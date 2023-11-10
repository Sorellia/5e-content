import { constants } from "../../../constants.js";
import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'topple', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save < workflow.actor.system.abilities.str.save) return;
    workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.targets.first().document)) {
        if (workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.str.save && workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.dex.save) workflow.item = workflow.item.clone({'system.save.scaling': 'int'}, {'keepId': true});
    }
    queue.remove(workflow.item.uuid);
}

async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = ['quarterstaff'];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = helpers.getFeature(workflow.actor, 'Topple');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'topple', 450);
    if (!queueSetup) return;
    let selection = await helpers.dialog(feature.name, constants.yesNo, 'Use Topple?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    featureData.system.damage.parts = [];
    delete (featureData._id);
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature2, config, options);
    queue.remove(workflow.item.uuid);
}

export let topple = {
    'item': item,
    'attack': attack
}