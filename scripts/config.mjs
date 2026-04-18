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

/** Token texture paths shipped by the CPR system for each Black ICE type. */
export const TOKEN_TEXTURE_BY_KEY = {
  asp: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Asp.webp`,
  giant: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Giant.webp`,
  hellhound: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Hellhound.webp`,
  kraken: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Kraken.webp`,
  liche: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Liche.webp`,
  raven: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Raven.webp`,
  scorpion: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Scorpion.webp`,
  skunk: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Skunk.webp`,
  wisp: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Wisp.webp`,
  dragon: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Dragon.webp`,
  killer: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Killer.webp`,
  sabertooth: `systems/${CPR_SYSTEM_ID}/tiles/netarch/WebP/Sabertooth.webp`,
};

export const BLACK_ICE_KEYS = Object.keys(TOKEN_TEXTURE_BY_KEY);
