import {
  MODULE_ID,
  CPR_SYSTEM_ID,
  PACK_IDS,
  FLAGS,
  SETTINGS,
  TOKEN_TEXTURE_BY_KEY,
  BLACK_ICE_KEYS,
} from "./config.mjs";

/**
 * Orchestrates the full Black ICE summon workflow.
 *
 * Input:
 *   blackIceKey  - one of BLACK_ICE_KEYS
 *   targetActor  - the netrunner Actor the Black ICE targets
 *   position     - { x, y } in scene pixel coordinates; center of token
 *
 * Steps:
 *   1. Import the source actor from the compendium into world actors
 *   2. Find the matching program in the actor compendium (packed as owned item) and
 *      ensure the new world actor has a program with class=blackice matching stats.
 *      We import an unowned program from the programs pack and embed it on the actor.
 *   3. Drop a token on canvas at the requested position (unlinked)
 *   4. Set flags: blackIceKey + linkedProgramId + targetActorUuid
 *   5. Set CPR native flag token.flags.cyberpunk-red-core.programUUID for damage hooks
 *   6. Optionally add to active combat
 */
export async function summonBlackIce({ blackIceKey, targetActor, position }) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.notifications.gmOnly`));
    return null;
  }
  if (!BLACK_ICE_KEYS.includes(blackIceKey)) {
    ui.notifications.error(
      game.i18n.format(`${MODULE_ID}.notifications.unknownKey`, { key: blackIceKey })
    );
    return null;
  }
  const scene = canvas.scene;
  if (!scene) {
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.notifications.noScene`));
    return null;
  }

  const actorPack = game.packs.get(PACK_IDS.actors);
  const programPack = game.packs.get(PACK_IDS.programs);
  if (!actorPack || !programPack) {
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.notifications.packsMissing`));
    return null;
  }

  const sourceActorIndex = actorPack.index.find(
    (e) => e.flags?.[MODULE_ID]?.blackIceKey === blackIceKey || e.name.toLowerCase() === blackIceKey
  );
  const sourceProgramIndex = programPack.index.find(
    (e) => e.flags?.[MODULE_ID]?.blackIceKey === blackIceKey || e.name.toLowerCase() === blackIceKey
  );
  if (!sourceActorIndex || !sourceProgramIndex) {
    ui.notifications.error(
      game.i18n.format(`${MODULE_ID}.notifications.packEntryMissing`, { key: blackIceKey })
    );
    return null;
  }

  const sourceActor = await actorPack.getDocument(sourceActorIndex._id);
  const sourceProgram = await programPack.getDocument(sourceProgramIndex._id);

  // Per CPR's canonical pattern (cpr-cyberdeck.js#_rezBlackIceToken), Black ICE
  // programs live in game.items as world-level templates, not as owned items on
  // the actor. The Black ICE sheet's damage-formula lookup uses
  // game.items.filter(i => i.uuid === programUUID), so an embedded program would
  // resolve to "n/a" on the sheet. Use a shared template per Black ICE key.
  const worldProgram = await ensureWorldProgram(sourceProgram, blackIceKey);

  // Clone source actor to world actors. toObject() strips pack association.
  const tokenTexture = TOKEN_TEXTURE_BY_KEY[blackIceKey];
  const actorData = sourceActor.toObject();
  delete actorData._id;
  delete actorData._key;
  actorData.items = [];
  if (tokenTexture) actorData.img = tokenTexture;
  // CPR convention: actor.system.class holds the blackIceType ("antipersonnel" /
  // "antiprogram"), not the program class string "blackice". Our pack data
  // already stores it correctly, but make sure stats.rez is a flat object the
  // CPR damage code can update via stats.rez.value.
  actorData.prototypeToken = foundry.utils.mergeObject(actorData.prototypeToken ?? {}, {
    texture: { src: tokenTexture ?? actorData.img },
    actorLink: false,
    disposition: -1,
  });
  const [createdActor] = await Actor.createDocuments([actorData]);
  if (!createdActor) return null;

  // Record our own link flags on the actor.
  await createdActor.update({
    [`flags.${MODULE_ID}.${FLAGS.BLACK_ICE_KEY}`]: blackIceKey,
    [`flags.${MODULE_ID}.${FLAGS.LINKED_PROGRAM_ID}`]: worldProgram.uuid,
    [`flags.${MODULE_ID}.${FLAGS.TARGET_ACTOR_UUID}`]: targetActor?.uuid ?? null,
  });

  // Drop token on canvas. Use Actor#getTokenDocument so actorId / delta / etc.
  // are set up correctly — bypassing it leaves tokenDocument.actor null and
  // crashes CPR's locked-container hook on drag.
  const gridSize = scene.grid.size ?? 100;
  // Locate the netrunner's token on this scene (if present) for the
  // netrunnerTokenId flag, which CPR uses for sheet lookups + sync hooks.
  const netrunnerToken = targetActor
    ? scene.tokens.find((t) => t.actor?.id === targetActor.id || t.actor?.uuid === targetActor.uuid)
    : null;
  const cprTokenFlags = {
    programUUID: worldProgram.uuid,
    sceneId: scene.id,
  };
  if (netrunnerToken) cprTokenFlags.netrunnerTokenId = netrunnerToken.id;

  const tokenDoc = await createdActor.getTokenDocument({
    x: Math.round((position.x ?? 0) - gridSize / 2),
    y: Math.round((position.y ?? 0) - gridSize / 2),
    width: 1,
    height: 1,
    texture: { src: tokenTexture ?? createdActor.img },
    flags: {
      [CPR_SYSTEM_ID]: cprTokenFlags,
      [MODULE_ID]: { blackIceKey },
    },
  });
  const [createdToken] = await scene.createEmbeddedDocuments("Token", [tokenDoc.toObject()]);

  if (createdToken) {
    // Reverse-link the program back to the spawned token, matching the canonical
    // CPR pattern so derez/lookup logic in cpr-cyberdeck.js can find this Black
    // ICE from the program side as well.
    await worldProgram.update({
      [`flags.${CPR_SYSTEM_ID}.biTokenId`]: createdToken.id,
      [`flags.${CPR_SYSTEM_ID}.sceneId`]: scene.id,
    });
    await createdActor.update({
      [`flags.${MODULE_ID}.${FLAGS.SPAWNED_TOKEN_ID}`]: createdToken.id,
    });
  }

  if (game.settings.get(MODULE_ID, SETTINGS.AUTO_COMBAT)) {
    await addToActiveCombat({ blackIceToken: createdToken, blackIceActor: createdActor, targetActor });
  }

  const targetName = targetActor?.name ?? game.i18n.localize(`${MODULE_ID}.generic.noTarget`);
  ui.notifications.info(
    game.i18n.format(`${MODULE_ID}.notifications.summoned`, {
      name: createdActor.name,
      target: targetName,
    })
  );

  return { actor: createdActor, token: createdToken, program: worldProgram };
}

const PROGRAM_FOLDER_NAME = "Black ICE Programs (auto)";

/**
 * Ensure exactly one world-level program template exists per Black ICE key.
 * Multiple Black ICE actors of the same type share one program template — the
 * actors carry their own REZ pools, so sharing the template doesn't share HP.
 */
async function ensureWorldProgram(sourceProgram, blackIceKey) {
  const existing = game.items.find(
    (i) => i.type === "program" && i.getFlag(MODULE_ID, FLAGS.BLACK_ICE_KEY) === blackIceKey
  );
  if (existing) return existing;

  const folder = await ensureProgramFolder();
  const data = sourceProgram.toObject();
  delete data._id;
  delete data._key;
  data.folder = folder?.id ?? null;
  foundry.utils.setProperty(data, `flags.${MODULE_ID}.${FLAGS.BLACK_ICE_KEY}`, blackIceKey);
  const [created] = await Item.createDocuments([data]);
  return created;
}

async function ensureProgramFolder() {
  let folder = game.folders.find(
    (f) => f.type === "Item" && f.name === PROGRAM_FOLDER_NAME
  );
  if (folder) return folder;
  folder = await Folder.create({
    name: PROGRAM_FOLDER_NAME,
    type: "Item",
    color: "#ff2b6d",
    sorting: "a",
  });
  return folder;
}

async function addToActiveCombat({ blackIceToken, blackIceActor, targetActor }) {
  if (!blackIceToken) return;
  let combat = game.combat;
  if (!combat) {
    combat = await Combat.create({ scene: canvas.scene.id, active: true });
  }

  const newCombatants = [];

  if (!combat.combatants.find((c) => c.tokenId === blackIceToken.id)) {
    const spd = Number(blackIceActor.system?.stats?.spd ?? 0);
    const roll = await new Roll(`1d10 + ${spd}`).evaluate();
    newCombatants.push({
      tokenId: blackIceToken.id,
      sceneId: canvas.scene.id,
      actorId: blackIceActor.id,
      initiative: roll.total,
    });
  }

  // Add the targeted netrunner if they have a token on this scene and aren't already in.
  if (targetActor) {
    const targetToken = canvas.scene.tokens.find(
      (t) => t.actor?.id === targetActor.id || t.actor?.uuid === targetActor.uuid
    );
    if (targetToken && !combat.combatants.find((c) => c.tokenId === targetToken.id)) {
      const initFormula = targetActor.system?.initiative?.formula ?? "1d10 + @stats.ref.value";
      const roll = await new Roll(initFormula, targetActor.getRollData?.() ?? {}).evaluate();
      newCombatants.push({
        tokenId: targetToken.id,
        sceneId: canvas.scene.id,
        actorId: targetActor.id,
        initiative: roll.total,
      });
    }
  }

  if (newCombatants.length) {
    await combat.createEmbeddedDocuments("Combatant", newCombatants);
  }
}
