import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";
import { savantHelpers } from "../../classFeatures/savant/savantHelpers.js";

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'topple', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    if (helpers.getFeature(workflow.actor, 'Adroit Analysis') && savantHelpers.isMark(workflow.targets.first().document)) {
        if (workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.str.save && workflow.actor.system.abilities.int.save > workflow.actor.system.abilities.dex.save) workflow.item = workflow.item.clone({'system.save.scaling': 'int'}, {'keepId': true});
    }
    queue.remove(workflow.item.uuid);
    if (workflow.targets.size != 1) return;
    let weapons = workflow.targets.first().actor.items.filter(i => i.system.equipped && i.type === 'weapon');
    if (weapons.length) return;
    let effectData = {
        'label': 'Invalid Creature',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 1
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.str',
                'mode': 2,
                'value': '99',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave.con'
                ]
            }
        }
    };
    await helpers.createEffect(workflow.targets.first().actor, effectData);
}

async function turn(effect) {
    let turn = effect.flags['5e-content']?.feature?.weakeningStrike ?? 0;
    if (turn >= 1) {
        await helpers.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.5e-content.feature.weakeningStrike': turn + 1
    };
    await helpers.updateEffect(effect, updates);
}

export let weakeningStrike = {
    'item': item,
    'turn': turn
}