import { MODULE_ID, FLAGS, SETTINGS } from "./config.mjs";

/**
 * Read the actor-side of a Black ICE / program link.
 * @param {Actor} actor - a blackIce actor
 * @returns {{ programId: string|null, targetUuid: string|null, blackIceKey: string|null }}
 */
export function getActorLink(actor) {
  const flags = actor?.flags?.[MODULE_ID] ?? {};
  return {
    programId: flags[FLAGS.LINKED_PROGRAM_ID] ?? null,
    targetUuid: flags[FLAGS.TARGET_ACTOR_UUID] ?? null,
    blackIceKey: flags[FLAGS.BLACK_ICE_KEY] ?? null,
  };
}

/**
 * Find the linked program Item on the given Black ICE actor.
 * @param {Actor} actor
 * @returns {Item|null}
 */
export function getLinkedProgram(actor) {
  const { programId } = getActorLink(actor);
  if (!programId) return null;
  return actor.items.get(programId) ?? null;
}

/**
 * Register hooks that clean up on either side of the link being deleted.
 * When the Black ICE actor is deleted, nothing to clean (owned program goes with it).
 * When the linked program is removed from the actor, clear the actor's link flag.
 */
export function registerLinkHooks() {
  Hooks.on("deleteItem", async (item) => {
    const parent = item.parent;
    if (!parent || parent.documentName !== "Actor") return;
    const link = getActorLink(parent);
    if (link.programId && link.programId === item.id) {
      await parent.unsetFlag(MODULE_ID, FLAGS.LINKED_PROGRAM_ID);
    }
  });

  Hooks.on("updateItem", async (item) => {
    if (!game.user.isGM) return;
    const parent = item.parent;
    if (!parent || parent.documentName !== "Actor") return;
    if (parent.type !== "blackIce") return;
    const link = getActorLink(parent);
    if (!link.programId || link.programId !== item.id) return;
    if (!game.settings.get(MODULE_ID, SETTINGS.AUTO_DESTROY)) return;
    const rez = item.system?.rez;
    if (typeof rez === "number" && rez <= 0) {
      ui.notifications?.info(
        game.i18n.format(`${MODULE_ID}.notifications.programDestroyed`, { name: item.name })
      );
    }
  });
}
