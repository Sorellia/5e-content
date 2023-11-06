import { constants } from "../../../constants.js";
import { queue } from "../../../utility/queue.js";
import { helpers } from "../../../helpers.js";

async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let queueSetup = await queue.setup(workflow.item.uuid, 'lacerate', 50);
    if (!queueSetup) return;
    if (workflow.actor.system.abilities.dex.save > workflow.actor.system.abilities.str.save) workflow.item = workflow.item.clone({'system.save.scaling': 'dex'}, {'keepId': true});
    queue.remove(workflow.item.uuid);
    if (workflow.targets.size != 1) return;
    let race = helpers.raceOrType(workflow.targets.first().actor);
    if (!(race === 'undead' || race === 'construct')) return;
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

async function turnStart(origin, token) {
    let featureData = await helpers.getItemFromCompendium('5e-content.feats', 'Bleeding', false);
    if (!featureData) return;
    delete (featureData._id);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': origin.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([token.document.uuid]);
    await MidiQOL.completeItemUse(feature, config, options);
}

async function turnEnd(effect) {
    let turn = effect.flags['5e-content']?.feature?.lacerate ?? 0;
    if (turn >= 1) {
        await helpers.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.5e-content.feature.lacerate': turn + 1
    };
    await helpers.updateEffect(effect, updates);
}

async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'mwak') return;
    let validTypes = ['handaxe','scimitar','battleaxe','longsword','glaive','greataxe','greatsword','halberd','sickle'];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = helpers.getFeature(workflow.actor, 'Lacerate');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'lacerate', 250);
    if (!queueSetup) return;
    let selection = await helpers.dialog(feature.name, constants.yesNo, 'Use Lacerate?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    let targetWorkflow = await MidiQOL.completeItemUse(feature2, config, options);
    if (targetWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = helpers.findEffect(workflow.targets.first().actor, 'Bleeding');
    if (effect) await helpers.updateEffect(effect, {'origin': feature.uuid});
    queue.remove(workflow.item.uuid);
}

export let lacerate = {
    'item': item,
    'turnStart': turnStart,
    'turnEnd': turnEnd,
    'attack': attack
}