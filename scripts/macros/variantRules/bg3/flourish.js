import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'concussiveSmash', 50);
    if (!queueSetup) return;
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.targets.first().document)) {
        if (workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.dex.save) workflow.item = workflow.item.clone({'system.save.scaling': 'int'}, {'keepId': true});
    }
    queue.remove(workflow.item.uuid);
}

async function turn(effect) {
    if (effect.flags['5e-content']?.feature?.flourish) {
        await helpers.removeEffect(effect);
        return;
    }

    let updates = {
        'flags.5e-content.feature.flourish': true
    }

    await helpers.updateEffect(effect, updates);
}

export let flourish = {
    'item': item,
    'turn': turn
}