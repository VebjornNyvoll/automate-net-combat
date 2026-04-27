import { MODULE_ID, SETTINGS } from "../config.mjs";
import { detectBlackIceKeyFromTile } from "../data/presets.mjs";
import { pickBlackIceKey } from "./summon-dialog.mjs";
import { pickNetrunnerFromScene } from "./target-picker.mjs";
import { summonBlackIce } from "../summon.mjs";

/**
 * Registers all summon entry points:
 *   - Scene controls toolbar button (GM only)
 *   - Tile HUD button on Black-ICE-looking tiles
 */
export function registerSummonControls() {
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user.isGM) return;
    const tokenControl = controls.find((c) => c.name === "token");
    if (!tokenControl) return;
    tokenControl.tools.push({
      name: "summon-black-ice",
      title: game.i18n.localize(`${MODULE_ID}.controls.summonBlackIce`),
      icon: "fas fa-bug",
      button: true,
      onClick: () => startSummonFlow(),
    });
  });

  Hooks.on("renderTileHUD", (hud, html, data) => {
    if (!game.user.isGM) return;
    if (!game.settings.get(MODULE_ID, SETTINGS.SHOW_HUD_BUTTON)) return;
    const tile = hud.object?.document;
    if (!tile) return;
    const key = detectBlackIceKeyFromTile(tile);
    if (!key) return;

    const button = document.createElement("div");
    button.classList.add("control-icon", "anc-hud-summon");
    button.dataset.action = "anc-summon";
    button.title = game.i18n.localize(`${MODULE_ID}.controls.summonBlackIce`);
    button.innerHTML = `<i class="fas fa-bug"></i>`;
    button.addEventListener("click", async () => {
      const position = {
        x: tile.x + tile.width / 2,
        y: tile.y + tile.height / 2,
      };
      await startSummonFlow({ blackIceKey: key, position });
    });

    const col = html[0]?.querySelector(".col.left") ?? html[0];
    col?.appendChild(button);
  });
}

/**
 * Full GM summon flow. If blackIceKey is provided, skip the picker.
 * If position is provided, drop the token there; else use current cursor/viewport center.
 */
async function startSummonFlow({ blackIceKey, position } = {}) {
  let key = blackIceKey;
  if (!key) {
    key = await pickBlackIceKey();
    if (!key) return;
  }

  const targetActor = await pickNetrunnerFromScene();
  if (!targetActor) return;

  const dropPosition = position ?? currentDropPosition();
  await summonBlackIce({ blackIceKey: key, targetActor, position: dropPosition });
}

function currentDropPosition() {
  const t = canvas.tokens?.controlled?.[0];
  if (t) return { x: t.document.x + t.w / 2, y: t.document.y + t.h / 2 };
  const center = canvas.stage?.pivot ?? { x: 0, y: 0 };
  return { x: center.x, y: center.y };
}
