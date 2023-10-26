import { bloodHunter } from "../bloodHunter"

async function onUse({actor, item, token, workflow}) {
    if (item.system.uses.value === 0) {
        let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true, false, true, false);
        actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
        if (!vitalSacrifice) return;
    }
}

export let spectralnature = {
    'onUse': onUse
}