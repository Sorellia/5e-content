import { helpers } from "../../../../helpers.js";
import { selectLanguage } from "../quickStudy.js";

async function intHandler(actor, changes) {
    if (!helpers.getFeature(actor, 'Linguistics')) return;
    let intChanges = changes.system?.abilities?.int?.value;
    if (!intChanges) return;
    let grantedLanguages = actor.getFlag('5e-content', 'savant.linguistics.languagesGranted'), intMod = Math.floor((intChanges-10)/2);
    if (grantedLanguages >= intMod) return;

    let languagesToGrant = intMod-grantedLanguages;
    
    for (let i = 0; i < languagesToGrant; i++) {
        await selectLanguage(actor, false);
    }
    actor.setFlag('5e-content', 'savant.linguistics.languagesGranted', intMod);
}

export let linguistics = {
    'intHandler': intHandler
}