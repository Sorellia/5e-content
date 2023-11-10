import { constants } from "../../../constants.js";
import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

export async function tenacity({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!(workflow.targets.size === 1 && !workflow.hitTargets.size) || workflow.item.system.actionType != 'mwak') return;
    let validTypes = ['morningstar','greatclub','maul'];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = helpers.getFeature(workflow.actor, 'Tenacity');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'rushAttack', 450);
    if (!queueSetup) return;
    let selection = await helpers.dialog(feature.name, constants.yesNo, 'Use Tenacity?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.targets.first().document)) {
        if (workflow.actor.system.abilities.int.mod > workflow.actor.system.abilities.str.mod) featureData.system.ability = 'int';
    }
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature2, config, options);
    queue.remove(workflow.item.uuid);
}