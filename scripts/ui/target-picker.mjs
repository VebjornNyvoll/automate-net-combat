/**
 * Canvas target picker. Enters a modal mode where the next token click resolves
 * the returned Promise with that token's Actor. Escape or right-click cancels.
 *
 * @param {object} [opts]
 * @param {(actor: Actor) => boolean} [opts.validate] - return true to accept, false to reject with a toast
 * @param {string} [opts.prompt] - localized prompt shown in a floating hint
 * @param {string} [opts.invalidMessage] - localized error if validate returns false
 * @returns {Promise<Actor|null>}
 */
export function pickTargetToken({ validate, prompt, invalidMessage } = {}) {
  return new Promise((resolve) => {
    if (!canvas?.ready) {
      ui.notifications.error("Canvas not ready.");
      resolve(null);
      return;
    }

    const hint = document.createElement("div");
    hint.className = "anc-target-hint";
    hint.textContent = prompt ?? "Click a token. Esc to cancel.";
    document.body.appendChild(hint);

    const cleanup = () => {
      hint.remove();
      canvas.stage.off("pointerdown", onCanvasClick);
      window.removeEventListener("keydown", onKey, true);
    };

    const onCanvasClick = (event) => {
      const token = event?.target?.document ?? event?.target?.parent?.document ?? null;
      // The event target is a PIXI Graphics / Sprite — walk up to Token
      let placeable = event?.target;
      while (placeable && !placeable.document) placeable = placeable.parent;
      const tokenDoc = placeable?.document;
      if (!tokenDoc || tokenDoc.documentName !== "Token") {
        ui.notifications.warn("That's not a token. Try again, or press Esc.");
        return;
      }
      const actor = tokenDoc.actor;
      if (!actor) {
        ui.notifications.warn("Token has no actor.");
        return;
      }
      if (validate && !validate(actor)) {
        ui.notifications.warn(invalidMessage ?? "Invalid target.");
        return;
      }
      cleanup();
      resolve(actor);
    };

    const onKey = (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        cleanup();
        resolve(null);
      }
    };

    canvas.stage.on("pointerdown", onCanvasClick);
    window.addEventListener("keydown", onKey, true);
  });
}
