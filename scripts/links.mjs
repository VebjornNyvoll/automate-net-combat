import { MODULE_ID, CPR_SYSTEM_ID, FLAGS, SETTINGS } from "./config.mjs";

/**
 * Read the actor-side of a Black ICE / program link.
 *
 * The linked-program flag stores a full UUID (e.g. "Item.<id>") since the
 * program lives in game.items as a world-level template, shared across all
 * Black ICE actors of the same key.
 *
 * @param {Actor} actor - a blackIce actor
 * @returns {{ programUuid: string|null, targetUuid: string|null, blackIceKey: string|null }}
 */
export function getActorLink(actor) {
  const flags = actor?.flags?.[MODULE_ID] ?? {};
  return {
    programUuid: flags[FLAGS.LINKED_PROGRAM_ID] ?? null,
    targetUuid: flags[FLAGS.TARGET_ACTOR_UUID] ?? null,
    blackIceKey: flags[FLAGS.BLACK_ICE_KEY] ?? null,
  };
}

/**
 * Resolve the linked program for the given Black ICE actor.
 *
 * Resolution order:
 *   1. The token's CPR-native programUUID flag (most authoritative — matches
 *      the path the CPR sheet uses for damage formula lookup)
 *   2. Our own LINKED_PROGRAM_ID flag on the actor
 *   3. Fallback: any world program flagged with this Black ICE key
 *
 * @param {Actor} actor
 * @returns {Promise<Item|null>}
 */
export async function getLinkedProgram(actor) {
  if (!actor) return null;

  // Prefer the CPR token flag — that's what the native sheet honors.
  const tokenUuid = actor.token?.getFlag?.(CPR_SYSTEM_ID, "programUUID");
  if (tokenUuid) {
    const item = await fromUuid(tokenUuid);
    if (item) return item;
  }

  const { programUuid, blackIceKey } = getActorLink(actor);
  if (programUuid) {
    const item = await fromUuid(programUuid);
    if (item) return item;
  }

  if (blackIceKey) {
    return (
      game.items.find(
        (i) => i.type === "program" && i.getFlag(MODULE_ID, FLAGS.BLACK_ICE_KEY) === blackIceKey
      ) ?? null
    );
  }
  return null;
}

/**
 * Register lifecycle hooks for the actor↔program link.
 *
 * - When a Black ICE actor is deleted, clear the matching program's reverse
 *   flags (biTokenId / sceneId on cyberpunk-red-core). The shared world program
 *   itself is preserved — other Black ICE actors of the same key may still use it.
 * - When the program's REZ hits zero, notify the GM (chat-card driven destruction
 *   already happens in combat.mjs; this hook is a backstop).
 */
export function registerLinkHooks() {
  Hooks.on("deleteActor", async (actor) => {
    if (!game.user.isGM) return;
    if (actor?.type !== "blackIce") return;
    const program = await getLinkedProgram(actor);
    if (!program) return;
    const cprFlags = program.flags?.[CPR_SYSTEM_ID] ?? {};
    if (cprFlags.biTokenId) {
      await program.update({
        [`flags.${CPR_SYSTEM_ID}.-=biTokenId`]: null,
        [`flags.${CPR_SYSTEM_ID}.-=sceneId`]: null,
      });
    }
  });

  Hooks.on("updateItem", async (item) => {
    if (!game.user.isGM) return;
    if (item.type !== "program" || item.system?.class !== "blackice") return;
    if (!game.settings.get(MODULE_ID, SETTINGS.AUTO_DESTROY)) return;
    const rez = item.system?.rez;
    if (typeof rez === "number" && rez <= 0) {
      ui.notifications?.info(
        game.i18n.format(`${MODULE_ID}.notifications.programDestroyed`, { name: item.name })
      );
    }
  });
}
