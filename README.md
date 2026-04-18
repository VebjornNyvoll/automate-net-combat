# Automate Net Combat

Automate Black ICE netrunning combat — create black-ice programs, spawn linked black-ice actors on the map, and apply black-ice attack damage to programs automatically.

## Installation

### Foundry Module Browser
Search for "Automate Net Combat" in the Foundry VTT module browser.

### Manual Installation
1. In Foundry VTT, go to Settings > Add-on Modules > Install Module
2. Paste this manifest URL: `https://github.com/VebjornNyvoll/automate-net-combat/releases/latest/download/module.json`
3. Click Install

## Development

1. Clone this repo into your Foundry `Data/modules/` directory
2. Restart Foundry and enable the module in your world

## Release

1. Update `version` in `module.json`
2. Commit and push
3. Create a GitHub Release with a tag matching the version (e.g., `v1.0.0`)
4. The GitHub Actions workflow will build and attach the module zip
