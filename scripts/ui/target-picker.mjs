import { MODULE_ID } from "../config.mjs";

const HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);

/**
 * Detect whether an actor is a netrunner: prefers a role item named "Netrunner",
 * falls back to "owns a cyberdeck."
 */
export function isNetrunner(actor) {
  if (!actor) return false;
  if (actor.type !== "character" && actor.type !== "mook") return false;
  const hasRole = actor.items?.some?.(
    (i) => i.type === "role" && /netrunner/i.test(i.name)
  );
  if (hasRole) return true;
  return Boolean(actor.items?.some?.((i) => i.type === "cyberdeck"));
}

/**
 * Prompt the GM to pick a netrunner from the tokens on the active scene.
 * Filters to actors with a Netrunner role; falls back to actors with a cyberdeck
 * if no role-tagged netrunner is on the scene.
 *
 * - 0 candidates → error notification, returns null
 * - 1 candidate  → auto-resolves with that actor (no dialog)
 * - 2+           → dialog with a dropdown of token names + actor names
 *
 * @returns {Promise<Actor|null>}
 */
export async function pickNetrunnerFromScene() {
  return pickTokenFromScene({
    filter: (actor) => isNetrunner(actor),
    title: game.i18n.localize(`${MODULE_ID}.dialog.pickNetrunnerTitle`),
    label: game.i18n.localize(`${MODULE_ID}.dialog.pickNetrunnerLabel`),
    emptyMessage: game.i18n.localize(`${MODULE_ID}.notifications.noNetrunners`),
  });
}

/**
 * Generic scene-token picker. Lists tokens whose actor passes `filter`.
 *
 * @param {object} opts
 * @param {(actor: Actor) => boolean} [opts.filter]
 * @param {string} opts.title
 * @param {string} opts.label
 * @param {string} [opts.emptyMessage]
 * @returns {Promise<Actor|null>}
 */
export async function pickTokenFromScene({ filter, title, label, emptyMessage }) {
  const scene = canvas.scene;
  if (!scene) {
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.notifications.noScene`));
    return null;
  }
  const candidates = scene.tokens.filter((t) => {
    const actor = t.actor;
    if (!actor) return false;
    return filter ? filter(actor) : true;
  });
  if (candidates.length === 0) {
    ui.notifications.warn(
      emptyMessage ?? game.i18n.localize(`${MODULE_ID}.notifications.noCandidates`)
    );
    return null;
  }
  if (candidates.length === 1) return candidates[0].actor;

  const options = candidates
    .map((t) => {
      const tokenName = escapeHtml(t.name);
      const actorName = escapeHtml(t.actor.name);
      const detail = tokenName !== actorName ? ` (${actorName})` : "";
      return `<option value="${t.id}">${tokenName}${detail}</option>`;
    })
    .join("");

  const content = `
    <form class="anc-target-dialog">
      <div class="form-group">
        <label>${escapeHtml(label)}</label>
        <select name="tokenId">${options}</select>
      </div>
    </form>`;

  return new Promise((resolve) => {
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          label: game.i18n.localize(`${MODULE_ID}.dialog.confirm`),
          callback: (html) => {
            const id = html[0]?.querySelector("[name=tokenId]")?.value;
            const tok = id ? scene.tokens.get(id) : null;
            resolve(tok?.actor ?? null);
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
