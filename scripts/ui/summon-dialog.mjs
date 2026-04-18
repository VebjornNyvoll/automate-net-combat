import { MODULE_ID, BLACK_ICE_KEYS } from "../config.mjs";

/**
 * Prompt the GM to pick a Black ICE key. Returns the key or null.
 * Used when the tile-based flow can't auto-detect the type.
 *
 * @param {string} [preselect] - key to preselect
 * @returns {Promise<string|null>}
 */
export async function pickBlackIceKey(preselect) {
  const options = BLACK_ICE_KEYS.map((key) => {
    const label = game.i18n.localize(`CPR.netArchitecture.floor.options.blackIce.${key}`);
    const selected = key === preselect ? "selected" : "";
    return `<option value="${key}" ${selected}>${label}</option>`;
  }).join("");

  const content = `
    <form class="anc-summon-dialog">
      <p>${game.i18n.localize(`${MODULE_ID}.dialog.summonPrompt`)}</p>
      <div class="form-group">
        <label>${game.i18n.localize(`${MODULE_ID}.dialog.blackIceType`)}</label>
        <select name="blackIceKey">${options}</select>
      </div>
    </form>`;

  return new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize(`${MODULE_ID}.dialog.summonTitle`),
      content,
      buttons: {
        ok: {
          label: game.i18n.localize(`${MODULE_ID}.dialog.pickTarget`),
          callback: (html) => {
            const key = html[0]?.querySelector("[name=blackIceKey]")?.value ?? null;
            resolve(key);
          },
        },
        cancel: {
          label: game.i18n.localize(`${MODULE_ID}.dialog.cancel`),
          callback: () => resolve(null),
        },
      },
      default: "ok",
      close: () => resolve(null),
    }).render(true);
  });
}
