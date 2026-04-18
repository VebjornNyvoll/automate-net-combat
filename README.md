# Automate Net Combat

**A Foundry VTT module for Cyberpunk Red that removes the manual busywork of Black ICE combat.**

Before this module, running Black ICE meant: create a program item, mark it as black ice, type in stats from CRB p.201–203, create a Black ICE actor, link them manually, and then track damage by hand when the ICE attacked. This module ships the full CRB Black ICE roster pre-built, spawns a fully-linked actor + program + token in one click, and applies attack damage to the right target automatically.

## Features

- **12 CRB Black ICE pre-built** as a compendium pack of actors and linked programs (Asp, Giant, Hellhound, Kraken, Liche, Raven, Scorpion, Skunk, Wisp, Dragon, Killer, Sabertooth)
- **One-click summon**: GM clicks a toolbar or Tile HUD button, picks the target netrunner, and the module spawns the Black ICE actor, creates its linked program item, places the token on the scene, adds it to combat, and sets the CPR native `programUUID` token flag
- **Tile HUD integration**: on any tile whose texture or flag identifies it as a Black ICE tile, a bug icon appears in the HUD — one click kicks off the summon flow with the type already known
- **Attack pipeline**: an "Attack" button on the Black ICE sheet rolls `1d10 + ATK` with CPR crit rules (explode on 10, subtract on 1), rolls damage per the Black ICE type, and applies the result to either the target netrunner's HP or a random rezzed program's REZ
- **Architect interop**: detects tiles from [cpr-netrunning-architect](https://github.com/VebjornNyvoll/cpr-netrunning-architect), matching the same 12 Black ICE keys
- **Auto-spawn (experimental, off by default)**: when a netrunner token crosses onto a Black ICE tile, auto-summon the corresponding Black ICE
- **Chat cards** showing the full roll breakdown, damage applied, and the effect text

## Requirements

- Foundry VTT v12 (verified) or v13
- Cyberpunk Red (`cyberpunk-red-core`) system v0.89.1+

## Installation

### Via manifest URL

1. In Foundry VTT, go to Settings → Add-on Modules → Install Module
2. Paste: `https://github.com/VebjornNyvoll/automate-net-combat/releases/latest/download/module.json`
3. Click Install, then enable it in your world

### Manual

Clone this repo into `{Foundry Data}/Data/modules/automate-net-combat`, restart Foundry, and enable the module in your world.

## Usage

### Spawning a Black ICE

**From the toolbar (any scene):**

1. Click the bug icon in the Token Controls toolbar (top-left)
2. Pick a Black ICE type from the dialog
3. Click the target netrunner's token on the canvas

**From a tile (architect workflow):**

1. Click a Black ICE tile to open its Tile HUD
2. Click the bug icon in the HUD
3. Click the target netrunner's token on the canvas

In both cases the module creates a world-level `blackIce` actor, an owned `program` item carrying the CRB stats (class `blackice`), drops an unlinked token at the tile or picked location, adds the Black ICE to combat (if enabled), and flags the target netrunner so subsequent attacks auto-resolve.

### Running a Black ICE attack

1. Double-click the Black ICE token to open its sheet
2. Click the **Attack** button (top of the sheet, pink)
3. The module rolls attack + damage, applies to the target, and posts a chat card

- Default target = the netrunner set at summon time
- Hold **Shift** while clicking Attack to force anti-program mode (damages a random rezzed program's REZ instead of netrunner HP)
- If no flagged target exists, you'll be prompted to click one

## Settings

| Setting | Default | Description |
|---|---|---|
| Auto-add Black ICE to combat | ✓ | Add summoned Black ICE to the active combat with initiative rolled from SPD |
| Auto-derez programs at 0 REZ | ✓ | Flip `isRezzed` to false when a program is reduced to 0 REZ |
| Show Tile HUD summon button | ✓ | Display the summon bug on Tile HUDs for Black ICE tiles |
| Auto-spawn on tile crossing | ✗ | Experimental: auto-summon when a netrunner token moves onto a Black ICE tile |

## Development

```bash
git clone https://github.com/VebjornNyvoll/automate-net-combat
cd automate-net-combat
npm install
npm run build:packs   # regenerates LevelDB packs from packs-src/
```

Symlink or copy the folder into `{Foundry Data}/Data/modules/automate-net-combat` to load it in your world.

### Project layout

```
packs-src/            JSON + data source for the compendium
  black-ice-data.mjs  single source of truth for all 12 Black ICE stat blocks
scripts/              module code (entry point: main.mjs)
  config.mjs          module id, flag keys, settings keys, pack ids
  summon.mjs          summon workflow (actor + program + token + flags)
  combat.mjs          attack resolution, damage application, chat cards
  links.mjs           actor↔program link lifecycle
  tracker.mjs         auto-spawn on tile crossing (experimental)
  ui/                 scene controls, Tile HUD, sheet injection, pickers
tools/
  build-packs.mjs     generates JSON + compiles LevelDB packs
```

### Adjusting Black ICE stats

Edit `packs-src/black-ice-data.mjs` and re-run `npm run build:packs`. The same stat block is emitted as both a program item (with `damage.blackIce` / `damage.standard`) and an actor (with `stats.{per,spd,atk,def,rez}`), so you only edit it once.

### Public API

`game.modules.get("automate-net-combat").api` exposes:

- `summonBlackIce({ blackIceKey, targetActor, position })` — the full summon flow
- `executeBlackIceAttack(actor, { target, targetMode })` — attack pipeline

## Release

1. Bump `version` in `module.json` and `package.json`
2. Commit and tag: `git tag v0.1.1 && git push --tags`
3. Create a GitHub Release on that tag
4. The CI workflow builds packs, zips everything, and attaches `module.json` + `module.zip` to the release

## License

MIT. Cyberpunk Red rules content is © R. Talsorian Games and used under the [Homebrew Content Policy](https://rtalsoriangames.com/homebrew-content-policy/).
