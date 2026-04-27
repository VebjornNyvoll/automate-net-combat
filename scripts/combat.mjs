import { MODULE_ID, FLAGS, SETTINGS } from "./config.mjs";
import { getLinkedProgram, getActorLink } from "./links.mjs";
import { pickTokenFromScene } from "./ui/target-picker.mjs";

/**
 * Roll a CPR-style d10 with exploding 10s and subtracting 1s.
 *   - Natural 10: add another d10 (once, per CRB; no chaining in base CPR)
 *   - Natural 1: subtract another d10
 *
 * Returns a resolved Roll that has been evaluated and formatted for chat.
 *
 * @param {string} bonusFormula - e.g. "+ @atk" or "+ 6"
 * @param {object} rollData
 */
async function rollCprD10(bonusFormula, rollData = {}) {
  // Base d10
  const base = await new Roll("1d10", rollData).evaluate();
  let extra = 0;
  let annotation = "";
  const rawDie = base.dice[0]?.results?.[0]?.result ?? base.total;
  if (rawDie === 10) {
    const bonus = await new Roll("1d10", rollData).evaluate();
    extra = bonus.total;
    annotation = ` (crit success +${extra})`;
  } else if (rawDie === 1) {
    const penalty = await new Roll("1d10", rollData).evaluate();
    extra = -penalty.total;
    annotation = ` (crit fail ${extra})`;
  }
  const bonusRoll = await new Roll(`0 ${bonusFormula}`, rollData).evaluate();
  const total = rawDie + extra + bonusRoll.total;
  return {
    total,
    rawDie,
    extra,
    annotation,
    bonus: bonusRoll.total,
    rolls: [base, bonusRoll],
  };
}

/**
 * Execute a Black ICE attack from the given actor against the given target.
 * If target is provided, skip the target-pick step.
 *
 * targetMode:
 *   "program" - damage goes to a netrunner program's REZ (anti-program roll)
 *   "brain"   - damage goes to netrunner HP directly (anti-personnel roll)
 *   "auto"    - infer from Black ICE class (system.class)
 */
export async function executeBlackIceAttack(actor, { target, targetMode = "auto" } = {}) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.notifications.gmOnly`));
    return;
  }
  if (!actor || actor.type !== "blackIce") {
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.notifications.notBlackIce`));
    return;
  }

  const link = getActorLink(actor);
  const program = await getLinkedProgram(actor);
  if (!program) {
    ui.notifications.error(
      game.i18n.localize(`${MODULE_ID}.notifications.noLinkedProgram`)
    );
    return;
  }

  const mode = targetMode === "auto"
    ? (actor.system.class === "antiprogram" ? "program" : "brain")
    : targetMode;

  let resolvedTarget = target;
  let targetProgram = null;
  if (!resolvedTarget) {
    // Auto-target from flag
    const uuid = link.targetUuid;
    if (uuid) {
      try { resolvedTarget = await fromUuid(uuid); } catch { /* ignore */ }
    }
  }
  if (!resolvedTarget) {
    resolvedTarget = await pickTokenFromScene({
      filter: (a) => a.type === "character" || a.type === "mook",
      title: game.i18n.localize(`${MODULE_ID}.dialog.pickAttackTargetTitle`),
      label: game.i18n.localize(`${MODULE_ID}.dialog.pickAttackTargetLabel`),
      emptyMessage: game.i18n.localize(`${MODULE_ID}.notifications.noAttackTargets`),
    });
    if (!resolvedTarget) return;
  }

  // Roll attack
  const atkStat = Number(actor.system?.stats?.atk ?? 0);
  const attack = await rollCprD10(`+ ${atkStat}`);

  // Roll damage per CRB: anti-personnel hits HP (standard), anti-program hits REZ (blackIce)
  const dmgFormula = mode === "program" ? program.system.damage.blackIce : program.system.damage.standard;
  const damageRoll = dmgFormula && dmgFormula !== "0"
    ? await new Roll(dmgFormula).evaluate()
    : null;

  // If anti-program, try to find a running program on the target netrunner to hit.
  if (mode === "program" && resolvedTarget?.items) {
    const rezzed = resolvedTarget.items.filter(
      (i) => i.type === "program" && i.system?.isRezzed && i.system?.class !== "blackice"
    );
    if (rezzed.length) {
      targetProgram = rezzed[Math.floor(Math.random() * rezzed.length)];
    }
  }

  // Apply damage
  let applied = null;
  if (damageRoll) {
    if (mode === "program" && targetProgram) {
      const current = Number(targetProgram.system.rez ?? 0);
      const newRez = Math.max(0, current - damageRoll.total);
      await targetProgram.update({ "system.rez": newRez });
      applied = { kind: "programRez", name: targetProgram.name, before: current, after: newRez };
      if (newRez <= 0 && game.settings.get(MODULE_ID, SETTINGS.AUTO_DESTROY)) {
        await targetProgram.update({ "system.isRezzed": false });
      }
    } else if (mode === "brain" && resolvedTarget?.update) {
      const hp = resolvedTarget.system?.derivedStats?.hp;
      if (hp) {
        const current = Number(hp.value ?? 0);
        const newHp = Math.max(0, current - damageRoll.total);
        await resolvedTarget.update({ "system.derivedStats.hp.value": newHp });
        applied = { kind: "hp", name: resolvedTarget.name, before: current, after: newHp };
      }
    }
  }

  await postAttackCard({
    actor,
    program,
    target: resolvedTarget,
    targetProgram,
    mode,
    attack,
    damageRoll,
    applied,
  });
}

async function postAttackCard({ actor, program, target, targetProgram, mode, attack, damageRoll, applied }) {
  const flavorKey = mode === "program"
    ? `${MODULE_ID}.attack.flavorProgram`
    : `${MODULE_ID}.attack.flavorBrain`;
  const flavor = game.i18n.format(flavorKey, {
    attacker: actor.name,
    target: target?.name ?? game.i18n.localize(`${MODULE_ID}.generic.noTarget`),
  });

  const parts = [];
  parts.push(`<div class="anc-card">`);
  parts.push(`<header class="anc-card-header"><strong>${actor.name}</strong> · ${program.name}</header>`);
  parts.push(`<section class="anc-card-attack">`);
  parts.push(`<div>Attack: <strong>${attack.total}</strong> <span class="anc-dim">(1d10=${attack.rawDie}${attack.annotation}, +${attack.bonus})</span></div>`);
  if (damageRoll) {
    parts.push(`<div>Damage: <strong>${damageRoll.total}</strong> <span class="anc-dim">(${damageRoll.formula})</span></div>`);
  }
  if (applied?.kind === "programRez") {
    parts.push(`<div class="anc-applied">${applied.name} REZ: ${applied.before} → <strong>${applied.after}</strong></div>`);
  } else if (applied?.kind === "hp") {
    parts.push(`<div class="anc-applied">${applied.name} HP: ${applied.before} → <strong>${applied.after}</strong></div>`);
  } else if (damageRoll) {
    parts.push(`<div class="anc-applied anc-dim">Damage not auto-applied (no matching target).</div>`);
  } else {
    parts.push(`<div class="anc-applied anc-dim">No damage (utility effect).</div>`);
  }
  const effectText = actor.getFlag(MODULE_ID, FLAGS.EFFECT_TEXT)
    ?? program.getFlag(MODULE_ID, FLAGS.EFFECT_TEXT);
  if (effectText) {
    parts.push(`<div class="anc-effect">${effectText}</div>`);
  }
  parts.push(`</section></div>`);

  const rolls = [...attack.rolls];
  if (damageRoll) rolls.push(damageRoll);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor,
    content: parts.join(""),
    rolls,
    type: CONST.CHAT_MESSAGE_TYPES?.ROLL ?? 5,
  });
}
