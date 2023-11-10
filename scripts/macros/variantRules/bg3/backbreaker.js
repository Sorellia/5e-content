import { constants } from "../../../constants.js";
import { helpers } from "../../../helpers.js";
import { queue } from "../../../utility/queue.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

export async function backbreaker({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = ['maul', 'warhammer'];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;

    let feature = helpers.getFeature(actor, 'Backbreaker');
    if (!feature) return;
    if (!feature.system.uses.value) return;

    let queueSetup = await queue.setup(workflow.item.uuid, 'backbreaker', 250);
    if (!queueSetup) return;

    let selection = await helpers.dialog(feature.name, constants.yesNo, 'Use Backbreaker?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }

    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.targets.first().document)) {
        if (workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.str.save && workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.dex.save) featureData.system.save.scaling = 'int';
    }
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);

    await MidiQOL.completeItemUse(feature2, config, options);
    queue.remove(workflow.item.uuid)
}