#!/usr/bin/env node
/**
 * Generates program + actor JSON source files from packs-src/black-ice-data.mjs
 * and compiles them into LevelDB compendium packs using @foundryvtt/foundryvtt-cli.
 *
 * Outputs:
 *   packs-src/black-ice-programs/*.json  (intermediate JSON)
 *   packs-src/black-ice-actors/*.json    (intermediate JSON)
 *   packs/black-ice-programs/             (LevelDB)
 *   packs/black-ice-actors/               (LevelDB)
 *
 * Run: node tools/build-packs.mjs
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { BLACK_ICE } from "../packs-src/black-ice-data.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_PROGRAMS = resolve(ROOT, "packs-src/black-ice-programs");
const SRC_ACTORS = resolve(ROOT, "packs-src/black-ice-actors");
const OUT_PROGRAMS = resolve(ROOT, "packs/black-ice-programs");
const OUT_ACTORS = resolve(ROOT, "packs/black-ice-actors");
const SYSTEM_ID = "cyberpunk-red-core";
const MODULE_ID = "automate-net-combat";

/** Produce a deterministic 16-char Foundry-style _id from an input seed. */
function stableId(seed) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const hash = createHash("sha256").update(seed).digest();
  let out = "";
  for (let i = 0; i < 16; i++) out += alphabet[hash[i] % alphabet.length];
  return out;
}

function buildProgramDoc(bi) {
  const _id = stableId(`${MODULE_ID}:program:${bi.key}`);
  return {
    _id,
    _key: `!items!${_id}`,
    name: bi.name,
    type: "program",
    img: `icons/svg/mystery-man.svg`,
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {
      [MODULE_ID]: { blackIceKey: bi.key, effectText: bi.effect },
    },
    system: {
      class: "blackice",
      blackIceType: bi.type,
      per: bi.per,
      spd: bi.spd,
      atk: bi.atk,
      def: bi.def,
      rez: bi.rez,
      damage: { blackIce: bi.damage.bi, standard: bi.damage.std },
      description: { value: bi.description },
      favorite: false,
      installLocation: "mall",
      interface: 0,
      isRezzed: false,
      price: { market: 0 },
      prototypeActor: "",
      revealed: true,
      size: 1,
      source: { book: "Core", page: 201 },
      usage: "toggled",
    },
  };
}

function buildActorDoc(bi) {
  const _id = stableId(`${MODULE_ID}:actor:${bi.key}`);
  return {
    _id,
    _key: `!actors!${_id}`,
    name: bi.name,
    type: "blackIce",
    img: `icons/svg/mystery-man.svg`,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    effects: [],
    items: [],
    flags: {
      [MODULE_ID]: { blackIceKey: bi.key, effectText: bi.effect },
    },
    system: {
      class: bi.type,
      stats: {
        per: bi.per,
        spd: bi.spd,
        atk: bi.atk,
        def: bi.def,
        rez: { value: bi.rez, max: bi.rez },
      },
      notes: bi.description,
    },
    prototypeToken: {
      name: bi.name,
      actorLink: false,
      disposition: -1,
      displayName: 20,
      displayBars: 20,
      bar1: { attribute: "stats.rez" },
      texture: { src: `icons/svg/mystery-man.svg` },
    },
  };
}

async function resetDir(path) {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

async function writeSources() {
  await resetDir(SRC_PROGRAMS);
  await resetDir(SRC_ACTORS);
  for (const bi of BLACK_ICE) {
    const prog = buildProgramDoc(bi);
    const actor = buildActorDoc(bi);
    await writeFile(resolve(SRC_PROGRAMS, `${bi.key}.json`), JSON.stringify(prog, null, 2));
    await writeFile(resolve(SRC_ACTORS, `${bi.key}.json`), JSON.stringify(actor, null, 2));
  }
}

async function compilePacks() {
  await rm(OUT_PROGRAMS, { recursive: true, force: true });
  await rm(OUT_ACTORS, { recursive: true, force: true });
  await compilePack(SRC_PROGRAMS, OUT_PROGRAMS);
  await compilePack(SRC_ACTORS, OUT_ACTORS);
}

async function main() {
  console.log("[build-packs] generating JSON sources...");
  await writeSources();
  console.log(`[build-packs] wrote ${BLACK_ICE.length} programs + ${BLACK_ICE.length} actors`);
  console.log("[build-packs] compiling LevelDB packs...");
  await compilePacks();
  console.log("[build-packs] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Silence unused warning for SYSTEM_ID — reserved for future pack metadata expansion.
void SYSTEM_ID;
