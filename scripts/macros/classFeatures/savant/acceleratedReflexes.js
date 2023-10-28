import { helpers } from "../../../helpers.js";

async function intHandler(actor, changes) {
    if (!helpers.getFeature(actor, 'Accelerated Reflexes')) return;
    let intChanges = changes.system?.abilities?.int?.value;
    if (!intChanges) return;
    let intMod = Math.floor((intChanges-10)/2);
    await actor.update({'system.attributes.init.bonus': intMod});
}

async function reactionHandler(effect) {
    if (effect.name != 'Reaction') return;
    let actor = effect.parent;
    if (!actor) return;
    let acceleratedReflexes = 1 + (actor.system.scale['savant']['bonus-reactions'] ?? 0);
    let currentReactionCount = actor.getFlag('5e-content', 'bonusReactionsUsed') ?? 1;
    if (currentReactionCount < acceleratedReflexes) {
        currentReactionCount++;
        actor.setFlag('5e-content', 'bonusReactionsUsed', currentReactionCount);
        helpers.removeCondition(actor, 'Reaction');
    } else {
        let effectUpdate = {
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': "actor.unsetFlag('5e-content', 'bonusReactionsUsed');"
                    }
                }
            }
        }

        await helpers.updateEffect(effect, effectUpdate);
    }
}

export let acceleratedReflexes = {
    'intHandler': intHandler,
    'reactionHandler': reactionHandler
}