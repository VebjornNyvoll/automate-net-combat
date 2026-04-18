/**
 * Cyberpunk Red Black ICE stat blocks, sourced from the Core Rulebook (p.201-203)
 * and the architect module's Black ICE keys.
 *
 * Each entry becomes one `program` item (class: "blackice") and one `blackIce` actor
 * with stats copied from the program. Keys match cpr-netrunning-architect floor.blackice keys.
 *
 * Field reference:
 *   type           - "antipersonnel" (damages netrunner HP) or "antiprogram" (damages programs)
 *   per, spd       - Black ICE Perception / Speed
 *   atk, def       - Black ICE attack / defense bonus
 *   rez            - Current and max REZ (HP pool)
 *   damage.std     - damage against a netrunner's HP (anti-personnel attack)
 *   damage.bi      - damage against a target program's REZ (anti-program attack)
 *   effect         - plain-text rules effect summary shown in chat cards
 *   description    - HTML description for the item sheet (rules flavor + effect notes)
 *
 * Stat values reflect the CRB. GM can duplicate pack entries and adjust for homebrew.
 */

export const BLACK_ICE = [
  {
    key: "asp",
    name: "Asp",
    type: "antipersonnel",
    per: 4,
    spd: 3,
    atk: 4,
    def: 2,
    rez: 15,
    damage: { std: "3d6", bi: "1d6" },
    effect: "Deals 3d6 direct Brain damage to the Netrunner (bypasses armor).",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> Small, fast-moving, and venomous. Delivers targeted attacks on a Netrunner's neural link.</p><p><strong>Effect:</strong> 3d6 direct Brain damage. Ignores SP from cyberware armor.</p>",
  },
  {
    key: "giant",
    name: "Giant",
    type: "antiprogram",
    per: 6,
    spd: 2,
    atk: 6,
    def: 4,
    rez: 30,
    damage: { std: "2d6", bi: "1d6" },
    effect:
      "Deals 1d6 damage to every Program currently rezzed on the target Netrunner's Cyberdeck.",
    description:
      "<p><em>Anti-Program Black ICE.</em> A brutal, slow-moving mass that crushes every running program it encounters.</p><p><strong>Effect:</strong> 1d6 damage to the REZ of every Program on the target Netrunner's Cyberdeck.</p>",
  },
  {
    key: "hellhound",
    name: "Hellhound",
    type: "antipersonnel",
    per: 6,
    spd: 4,
    atk: 6,
    def: 4,
    rez: 20,
    damage: { std: "2d6", bi: "1d6" },
    effect:
      "Deals 2d6 direct Brain damage. The Netrunner catches fire: takes 2d6 direct Brain damage at the start of each of their following turns until they Jack Out.",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> A burning predator that latches on and won't let go.</p><p><strong>Effect:</strong> 2d6 direct Brain damage, plus a persistent 2d6 direct Brain damage tick at the start of each of the Netrunner's subsequent turns until they Jack Out or the Hellhound is defeated.</p>",
  },
  {
    key: "kraken",
    name: "Kraken",
    type: "antipersonnel",
    per: 4,
    spd: 2,
    atk: 8,
    def: 4,
    rez: 35,
    damage: { std: "3d6", bi: "1d6" },
    effect:
      "Deals 3d6 direct Brain damage and grapples the Netrunner. The Netrunner cannot Jack Out until the Kraken is defeated.",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> Slow, massive, inescapable. Grabs hold of the Netrunner and won't release them.</p><p><strong>Effect:</strong> 3d6 direct Brain damage. The Netrunner is Grappled — they cannot Jack Out of the Architecture until the Kraken is defeated.</p>",
  },
  {
    key: "liche",
    name: "Liche",
    type: "antipersonnel",
    per: 6,
    spd: 4,
    atk: 6,
    def: 6,
    rez: 25,
    damage: { std: "2d6", bi: "1d6" },
    effect:
      "Deals 2d6 direct Brain damage. The Netrunner loses 1 NET Action per turn until the Liche is defeated.",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> An intelligent construct that locks up a Netrunner's reactions.</p><p><strong>Effect:</strong> 2d6 direct Brain damage. The Netrunner's Meat and NET Actions per turn are reduced by 1 as long as the Liche is active.</p>",
  },
  {
    key: "raven",
    name: "Raven",
    type: "antipersonnel",
    per: 8,
    spd: 3,
    atk: 4,
    def: 2,
    rez: 15,
    damage: { std: "0", bi: "0" },
    effect:
      "Traces the Netrunner's meat-space location and alerts the Architecture's owner. No damage.",
    description:
      "<p><em>Anti-Personnel Black ICE (Tracker).</em> Does no damage, but quietly pinpoints the Netrunner's physical location and alerts the owner of the Architecture.</p><p><strong>Effect:</strong> On a successful hit, the Netrunner's meat-body location is revealed. Arriving consequences (security response, corp goons, etc.) are up to the GM.</p>",
  },
  {
    key: "scorpion",
    name: "Scorpion",
    type: "antipersonnel",
    per: 4,
    spd: 4,
    atk: 6,
    def: 4,
    rez: 20,
    damage: { std: "3d6", bi: "1d6" },
    effect:
      "Deals 3d6 direct Brain damage. If the Netrunner is killed, alerts corps to the break-in.",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> A lethal mid-range combatant optimized for clean kills.</p><p><strong>Effect:</strong> 3d6 direct Brain damage. If this attack reduces the Netrunner to 0 HP, the Architecture's owner receives an immediate alert.</p>",
  },
  {
    key: "skunk",
    name: "Skunk",
    type: "antiprogram",
    per: 4,
    spd: 2,
    atk: 2,
    def: 2,
    rez: 15,
    damage: { std: "1d6", bi: "1d6" },
    effect:
      "Derezzes every Program currently rezzed on the target Netrunner's Cyberdeck.",
    description:
      "<p><em>Anti-Program Black ICE.</em> Cheap, unglamorous, devastating to a Netrunner's arsenal.</p><p><strong>Effect:</strong> On a successful attack, every Program currently rezzed on the target Netrunner's Cyberdeck is immediately derezzed.</p>",
  },
  {
    key: "wisp",
    name: "Wisp",
    type: "antipersonnel",
    per: 2,
    spd: 4,
    atk: 2,
    def: 4,
    rez: 15,
    damage: { std: "0", bi: "0" },
    effect:
      "Ejects the Netrunner from the Architecture. They must jack in again and start from the top floor.",
    description:
      "<p><em>Anti-Personnel Black ICE (Bouncer).</em> Does no damage, but boots the Netrunner out of the Architecture.</p><p><strong>Effect:</strong> On a successful hit, the Netrunner is immediately ejected from the Architecture and must re-enter at the lobby floor.</p>",
  },
  {
    key: "dragon",
    name: "Dragon",
    type: "antipersonnel",
    per: 6,
    spd: 2,
    atk: 8,
    def: 6,
    rez: 30,
    damage: { std: "3d6", bi: "1d6" },
    effect:
      "Deals 3d6 direct Brain damage and Stuns the Netrunner (they skip their next turn).",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> The apex predator of NET combat. Huge, slow, and devastating.</p><p><strong>Effect:</strong> 3d6 direct Brain damage. The Netrunner is Stunned and loses their next turn.</p>",
  },
  {
    key: "killer",
    name: "Killer",
    type: "antipersonnel",
    per: 6,
    spd: 4,
    atk: 8,
    def: 4,
    rez: 20,
    damage: { std: "3d6", bi: "1d6" },
    effect: "Deals 3d6 direct Brain damage.",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> A clean, efficient assassin. High speed, high attack, lethal.</p><p><strong>Effect:</strong> 3d6 direct Brain damage.</p>",
  },
  {
    key: "sabertooth",
    name: "Sabertooth",
    type: "antipersonnel",
    per: 4,
    spd: 4,
    atk: 6,
    def: 4,
    rez: 25,
    damage: { std: "4d6", bi: "1d6" },
    effect: "Deals 4d6 direct Brain damage.",
    description:
      "<p><em>Anti-Personnel Black ICE.</em> Heavy-hitting predator — not the fastest, but it makes every bite count.</p><p><strong>Effect:</strong> 4d6 direct Brain damage.</p>",
  },
];

/** Lookup by key for quick access from summon/combat code. */
export const BLACK_ICE_BY_KEY = Object.fromEntries(BLACK_ICE.map((b) => [b.key, b]));
