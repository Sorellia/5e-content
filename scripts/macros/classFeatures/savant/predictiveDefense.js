import { helpers } from "../../../helpers.js";

async function intHandler(actor, changes) {
    if (!helpers.getFeature(actor, 'Predictive Defense')) return;
    let intChanges = changes.system?.abilities?.int?.value;
    if (!intChanges) return;
    let intMod = Math.floor((intChanges-10)/2);
    let maxInt = actor.system.attributes.ac.equippedArmor?.system?.armor?.dex ?? intMod + 1;
    if (intMod > maxInt) intMod = maxInt;
    let acUpdates = {
        'system.attributes.ac.formula': `@attributes.ac.armor + ${intMod}`
    }

    await actor.update(acUpdates);
}

export let predictiveDefense = {
    'intHandler': intHandler
}