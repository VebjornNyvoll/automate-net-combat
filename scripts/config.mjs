export const MODULE_ID = "automate-net-combat";
export const CPR_SYSTEM_ID = "cyberpunk-red-core";
export const ARCHITECT_MODULE_ID = "cpr-netrunning-architect";

export const PACK_IDS = {
  actors: `${MODULE_ID}.black-ice-actors`,
  programs: `${MODULE_ID}.black-ice-programs`,
};

export const FLAGS = {
  BLACK_ICE_KEY: "blackIceKey",
  LINKED_PROGRAM_ID: "linkedProgramId",
  LINKED_ACTOR_ID: "linkedActorId",
  TARGET_ACTOR_UUID: "targetActorUuid",
  EFFECT_TEXT: "effectText",
  SPAWNED_TOKEN_ID: "spawnedTokenId",
};

export const SETTINGS = {
  AUTO_COMBAT: "autoAddToCombat",
  AUTO_DESTROY: "autoDestroyAtZeroRez",
  SHOW_HUD_BUTTON: "showTileHudButton",
};

export const SOCKET_EVENT = `module.${MODULE_ID}`;

/** Token icon paths shipped by the CPR system for each Black ICE type. */
export const TOKEN_TEXTURE_BY_KEY = {
  asp: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Asp.png`,
  giant: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Giant.png`,
  hellhound: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Hellhound.png`,
  kraken: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Kraken.png`,
  liche: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Liche.png`,
  raven: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Raven.png`,
  scorpion: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Scorpion.png`,
  skunk: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Skunk.png`,
  wisp: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Wisp.png`,
  dragon: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Dragon.png`,
  killer: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Killer.png`,
  sabertooth: `systems/${CPR_SYSTEM_ID}/icons/netrunning/Sabertooth.png`,
};

export const BLACK_ICE_KEYS = Object.keys(TOKEN_TEXTURE_BY_KEY);
