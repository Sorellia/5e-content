import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

export async function prepare({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.baseItem != 'greataxe') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'prepare', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let bonusDamageFormula = workflow.actor.system.abilities.str.mod + '[' + workflow.defaultDamageType + ']';
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.hitTargets.first().document)) {
        if (workflow.actor.system.abilities.int.mod > workflow.actor.system.abilities.str.mod) bonusDamageFormula = workflow.actor.system.abilities.int.mod + '[' + workflow.defaultDamageType + ']';
    }
    if (workflow.isCritical) bonusDamageFormula = helpers.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}