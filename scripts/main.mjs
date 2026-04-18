import { MODULE_ID, SETTINGS } from "./config.mjs";
import { registerLinkHooks } from "./links.mjs";
import { registerSummonControls } from "./ui/scene-controls.mjs";
import { registerSheetInjection } from "./ui/sheet-injection.mjs";
import { registerAutoSpawn } from "./tracker.mjs";
import { summonBlackIce } from "./summon.mjs";
import { executeBlackIceAttack } from "./combat.mjs";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`);

  game.settings.register(MODULE_ID, SETTINGS.AUTO_COMBAT, {
    name: `${MODULE_ID}.settings.autoCombat.name`,
    hint: `${MODULE_ID}.settings.autoCombat.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, SETTINGS.AUTO_DESTROY, {
    name: `${MODULE_ID}.settings.autoDestroy.name`,
    hint: `${MODULE_ID}.settings.autoDestroy.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, SETTINGS.SHOW_HUD_BUTTON, {
    name: `${MODULE_ID}.settings.showHud.name`,
    hint: `${MODULE_ID}.settings.showHud.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "autoSpawnOnTileCross", {
    name: `${MODULE_ID}.settings.autoSpawn.name`,
    hint: `${MODULE_ID}.settings.autoSpawn.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
});

Hooks.once("ready", () => {
  registerLinkHooks();
  registerSummonControls();
  registerSheetInjection();
  if (game.settings.get(MODULE_ID, "autoSpawnOnTileCross")) {
    registerAutoSpawn();
  }

  // Public API — other modules and macros can call these directly.
  const moduleData = game.modules.get(MODULE_ID);
  if (moduleData) {
    moduleData.api = {
      summonBlackIce,
      executeBlackIceAttack,
    };
    Hooks.callAll(`${MODULE_ID}.ready`, moduleData.api);
  }

  console.log(`${MODULE_ID} | ready`);
});
