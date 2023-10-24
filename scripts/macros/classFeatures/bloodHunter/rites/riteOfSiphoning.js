import { helpers } from "../../../../helpers.js";

async function hpReplenish(workflow) {
    let damageTotal = workflow.args[0].damageTotal;
    let actor = workflow.actor;
    let target = fromUuidSync(workflow.args[0].hitTargetUuids[0]);
    let siphon = actor.getFlag('5e-content', 'vitalSacrifice.siphon') ?? false;
    actor.unsetFlag('5e-content', 'vitalSacrifice.siphon');
    let immune = helpers.checkTrait(target.actor, 'di', 'necrotic');
    let resistant = helpers.checkTrait(target.actor, 'dr', 'necrotic');
    if (immune) damageTotal = 0;
    if (resistant) damageTotal = Math.floor(damageTotal / 2);
    if (siphon && damageTotal >= 1) await helpers.applyDamage(workflow.token, damageTotal, 'healing');
}

export let riteOfSiphoning = {
    'hpReplenish': hpReplenish
}