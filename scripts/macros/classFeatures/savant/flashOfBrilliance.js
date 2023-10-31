import { helpers } from "../../../helpers.js";
import { queue } from "../../../utility/queue.js";
import { constants } from "../../../constants.js";
import { savantHelpers } from "./savantHelpers.js";

async function preSave(workflow) {
    let targets = workflow.targets;
    let target;
    let iterator = targets.entries();

    for (const entry of iterator) {
        target = entry[0].document;
        if (target.disposition === -1) return;
        let actor = target.actor, deafened = helpers.findEffect(actor, 'Deafened');
        if (deafened) return;
        
        let queueSetup = await queue.setup(workflow.uuid, 'flashOfBrilliance', 150);
        if (!queueSetup) return;
        let savantDie, flash, tokens = helpers.findNearby(target, 30, 'ally').filter(i => helpers.getFeature(i.actor, 'Flash of Brilliance') && !helpers.findEffect(i.actor, 'Reaction'));
        if (tokens.length === 0) {
            queue.remove(workflow.uuid);
            return;
        }
        for (let token of tokens) {
            flash = helpers.getFeature(token.actor, 'Flash of Brilliance');
            let firstOwner = helpers.firstOwner(token);
            await helpers.thirdPartyReactionMessage(firstOwner);
            let message = 'Bolster ' + actor.name + `'s saving throw with your intellect die?`;
            if (firstOwner.isGM) message = '[' + token.actor.name + '] ' + message;
            let selection = await helpers.remoteDialog('Flash of Brilliance', constants.yesNo, firstOwner.id, message);
            if (!selection) continue;
            await helpers.addCondition(token.actor, 'Reaction', false);
            savantDie = token.actor.getFlag('5e-content', 'savant.intellectDie.formula');
        }
        await helpers.clearThirdPartyReactionMessage();

        let effectData = {
            'icon': flash.img,
            'label': flash.name,
            'origin': flash.uuid,
            'changes': [
                {
                    'key': 'system.bonuses.abilities.save',
                    'mode': 2,
                    'value': savantDie,
                    'priority': 0
                }
            ],
            'flags': {
                'dae': {
                    'specialDuration': ['isSave']
                }
            }
        };

        await helpers.createEffect(actor, effectData);
        queue.remove(workflow.uuid);
    }
}

export let flashOfBrilliance = {
    'preSave': preSave
}