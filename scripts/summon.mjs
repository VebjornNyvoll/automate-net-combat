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

  // Clone source actor to world actors. toObject() strips pack association.
  const actorData = sourceActor.toObject();
  delete actorData._id;
  delete actorData._key;
  actorData.items = [];
  actorData.prototypeToken = foundry.utils.mergeObject(actorData.prototypeToken ?? {}, {
    texture: { src: TOKEN_TEXTURE_BY_KEY[blackIceKey] ?? actorData.img },
  });
  const [createdActor] = await Actor.createDocuments([actorData]);
  if (!createdActor) return null;

  // Embed the program on the actor as an owned item.
  const programData = sourceProgram.toObject();
  delete programData._id;
  delete programData._key;
  const [ownedProgram] = await createdActor.createEmbeddedDocuments("Item", [programData]);

  // Record link flags on the actor.
  await createdActor.update({
    [`flags.${MODULE_ID}.${FLAGS.BLACK_ICE_KEY}`]: blackIceKey,
    [`flags.${MODULE_ID}.${FLAGS.LINKED_PROGRAM_ID}`]: ownedProgram.id,
    [`flags.${MODULE_ID}.${FLAGS.TARGET_ACTOR_UUID}`]: targetActor?.uuid ?? null,
  });

  // Drop token on canvas.
  const gridSize = scene.grid.size ?? 100;
  const tokenData = foundry.utils.mergeObject(createdActor.prototypeToken.toObject(), {
    x: Math.round((position.x ?? 0) - gridSize / 2),
    y: Math.round((position.y ?? 0) - gridSize / 2),
    width: 1,
    height: 1,
    texture: { src: TOKEN_TEXTURE_BY_KEY[blackIceKey] ?? createdActor.img },
    actorLink: false,
    disposition: -1,
    flags: {
      [CPR_SYSTEM_ID]: { programUUID: ownedProgram.uuid },
      [MODULE_ID]: { blackIceKey },
    },
  });
  const [createdToken] = await scene.createEmbeddedDocuments("Token", [tokenData]);

  if (createdToken) {
    await createdActor.update({
      [`flags.${MODULE_ID}.${FLAGS.SPAWNED_TOKEN_ID}`]: createdToken.id,
    });
  }

  if (game.settings.get(MODULE_ID, SETTINGS.AUTO_COMBAT)) {
    await addTokenToActiveCombat(createdToken, createdActor);
  }

  const targetName = targetActor?.name ?? game.i18n.localize(`${MODULE_ID}.generic.noTarget`);
  ui.notifications.info(
    game.i18n.format(`${MODULE_ID}.notifications.summoned`, {
      name: createdActor.name,
      target: targetName,
    })
  );

  return { actor: createdActor, token: createdToken, program: ownedProgram };
}

async function addTokenToActiveCombat(tokenDoc, actor) {
  if (!tokenDoc) return;
  let combat = game.combat;
  if (!combat) {
    combat = await Combat.create({ scene: canvas.scene.id, active: true });
  }
  const existing = combat.combatants.find((c) => c.tokenId === tokenDoc.id);
  if (existing) return;
  const spd = Number(actor.system?.stats?.spd ?? 0);
  const roll = await new Roll(`1d10 + ${spd}`).evaluate();
  await combat.createEmbeddedDocuments("Combatant", [
    {
      tokenId: tokenDoc.id,
      sceneId: canvas.scene.id,
      actorId: actor.id,
      initiative: roll.total,
    },
  ]);
}
