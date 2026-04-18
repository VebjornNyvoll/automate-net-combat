import { BLACK_ICE_KEYS } from "../config.mjs";

/**
 * UI metadata for Black ICE presets. Labels use localization keys that mirror
 * cpr-netrunning-architect so both modules surface the same display names.
 */
export const PRESETS = BLACK_ICE_KEYS.map((key) => ({
  key,
  labelKey: `CPR.netArchitecture.floor.options.blackIce.${key}`,
}));

/**
 * Attempts to determine a Black ICE key from a tile's data.
 * Tries flags first (forward-compatible with future architect updates),
 * then parses the texture src for a matching key.
 *
 * @param {TileDocument} tile
 * @returns {string|null}
 */
export function detectBlackIceKeyFromTile(tile) {
  const flagKey = tile?.flags?.["cpr-netrunning-architect"]?.blackice
    ?? tile?.flags?.["automate-net-combat"]?.blackIceKey;
  if (flagKey && BLACK_ICE_KEYS.includes(flagKey)) return flagKey;

  const src = tile?.texture?.src ?? "";
  const basename = src.split("/").pop()?.toLowerCase() ?? "";
  for (const key of BLACK_ICE_KEYS) {
    if (basename.includes(key)) return key;
  }
  return null;
}
