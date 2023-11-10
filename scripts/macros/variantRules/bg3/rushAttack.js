import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'rushAttack', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.targets.first().document)) {
        if (workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.str.save && workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.dex.save) workflow.item = workflow.item.clone({'system.save.scaling': 'int'}, {'keepId': true});
    }
    queue.remove(workflow.item.uuid);
}

async function turn(effect) {
    let turn = effect.flags['5e-content']?.feature?.rushAttack ?? 0;
    if (turn >= 1) {
        await helpers.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.5e-content.feature.rushAttack': turn + 1
    };
    await helpers.updateEffect(effect, updates);
}

export let rushAttack = {
    'item': item,
    'turn': turn
}