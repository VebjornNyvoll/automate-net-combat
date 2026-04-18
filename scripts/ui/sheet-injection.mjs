import { MODULE_ID } from "../config.mjs";
import { executeBlackIceAttack } from "../combat.mjs";

/**
 * Inject an "Attack" button into the Black ICE actor sheet.
 * Fires executeBlackIceAttack against the currently-flagged target.
 */
export function registerSheetInjection() {
  Hooks.on("renderCPRBlackIceActorSheet", (app, html) => {
    if (!game.user.isGM) return;
    if (html[0]?.querySelector(".anc-attack-btn")) return;

    const actor = app.actor;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "anc-attack-btn";
    button.innerHTML = `<i class="fas fa-bolt"></i> ${game.i18n.localize(`${MODULE_ID}.sheet.attack`)}`;
    button.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const mode = ev.shiftKey ? "program" : "auto";
      await executeBlackIceAttack(actor, { targetMode: mode });
    });

    const host = html[0]?.querySelector(".window-content") ?? html[0];
    if (!host) return;
    const bar = document.createElement("div");
    bar.className = "anc-actions";
    bar.appendChild(button);
    host.prepend(bar);
  });
}
