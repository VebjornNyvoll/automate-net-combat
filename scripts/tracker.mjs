import { MODULE_ID, FLAGS } from "./config.mjs";
import { getActorLink } from "./links.mjs";

/**
 * Auto-spawn Black ICE when a netrunner token crosses onto a Black ICE tile.
 *
 * Strategy: hook preUpdateToken, detect a netrunner moving into a rect
 * that overlaps a known Black ICE tile (by texture or flag). If detected,
 * defer to the summon flow with that tile's type and the moving token's actor.
 *
 * Phase 2.5 — disabled by default, opt-in via setting.
 */
import { SETTINGS } from "./config.mjs";
import { detectBlackIceKeyFromTile } from "./data/presets.mjs";
import { summonBlackIce } from "./summon.mjs";

export function registerAutoSpawn() {
  Hooks.on("updateToken", async (tokenDoc, change) => {
    if (!game.user.isGM) return;
    if (!("x" in change) && !("y" in change)) return;

    const actor = tokenDoc.actor;
    if (!actor) return;
    if (actor.type !== "character" && actor.type !== "mook") return;

    const scene = tokenDoc.parent;
    if (!scene) return;

    const newCenter = {
      x: (change.x ?? tokenDoc.x) + (tokenDoc.width * scene.grid.size) / 2,
      y: (change.y ?? tokenDoc.y) + (tokenDoc.height * scene.grid.size) / 2,
    };

    const blackIceTile = findTileUnderPoint(scene, newCenter);
    if (!blackIceTile) return;

    const key = detectBlackIceKeyFromTile(blackIceTile);
    if (!key) return;

    // Dedup: if a Black ICE actor was already spawned for this tile, skip.
    const already = scene.tokens.some((t) => {
      const flag = t.getFlag(MODULE_ID, FLAGS.BLACK_ICE_KEY);
      return flag === key;
    });
    if (already) return;

    await summonBlackIce({
      blackIceKey: key,
      targetActor: actor,
      position: { x: blackIceTile.x + blackIceTile.width / 2, y: blackIceTile.y + blackIceTile.height / 2 },
    });
  });
}

function findTileUnderPoint(scene, point) {
  for (const tile of scene.tiles) {
    if (
      point.x >= tile.x &&
      point.x <= tile.x + tile.width &&
      point.y >= tile.y &&
      point.y <= tile.y + tile.height
    ) {
      if (detectBlackIceKeyFromTile(tile)) return tile;
    }
  }
  return null;
}

// Re-export helpers so main.mjs has a single import.
export { registerSheetInjection } from "./ui/sheet-injection.mjs";
