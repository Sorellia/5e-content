import { helpers } from "../../../helpers.js";
import { savantHelpers } from "./savantHelpers.js";

async function onUse({actor, token, workflow}) {
    let concentration = helpers.findEffect(actor, 'Concentrating');
    if (!concentration) return;
    let concSource = fromUuidSync(concentration.origin);
    if (concSource.name != 'Adroit Analysis') return;
    token = token.document;
    let marks = helpers.findNearby(token, 1000, 'enemy').filter(i => helpers.findEffect(i.actor, 'Adroit Analysis'));
    let sourceMark;

    for (let mark of marks) {
        mark = mark.document;
        if (savantHelpers.isMark(mark)) {
            if (savantHelpers.isMarkSource(mark, token)) {
                sourceMark = mark;
            }
        }
    }

    let effectData = {
        'duration': { 'seconds': 12 },
        'icon': workflow.item.img,
        'label': workflow.item.name,
        'origin': concentration.origin,
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.ability.save.all',
                'mode': 0,
                'value': 1,
                'priority': 0
            },
            {
                'key': 'flags.midi-qol.disadvantage.ability.check.all',
                'mode': 0,
                'value': 1,
                'priority': 0
            },
            {
                'key': 'flags.midi-qol.disadvantage.attack.all',
                'mode': 0,
                'value': 1,
                'priority': 0
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': ['turnStartSource']
            },
            'effectmacro': {
                'onDelete': {
                    'script': "let tokens = sorelliaAutomations.helpers.findNearby(token.document, 1000).filter(i => i.actor.getFlag('5e-content', 'profoundInsight'))\nfor (let token of tokens) {\ntoken = token.document;\ntoken.actor.unsetFlag('5e-content', 'profoundInsight');}"
                }
            }
        }
    };
    let allies = helpers.findNearby(token, 1000, 'ally');
    for (let ally of allies) {
        ally = ally.document;
        ally.actor.setFlag('5e-content', 'profoundInsight', true);
    }

    await helpers.createEffect(sourceMark.actor, effectData);
}

export let profoundInsight = {
    'onUse': onUse
}