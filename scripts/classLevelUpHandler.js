import { helpers } from "./helpers.js";

export async function levelUpHandler(item, changes) {
    let ownerActor = item.parent;
    if (!ownerActor || item.type != 'class') return;
    switch (item.name) {
        case 'Savant':
            if (helpers.getFeature(ownerActor, 'Meditation')) await setupIntellectDie(ownerActor, true);
            else await setupIntellectDie(ownerActor);
            break;
        default:
            break;
    }
}

export async function setupIntellectDie(actor, meditation = false) {
    let intellectDie = actor.system.scale['savant']['intellect-die'], undisputedGenius = helpers.getFeature(actor, 'Undisputed Genius'), intMod = actor.system.abilities.int.mod, dieFlag;
    if (undisputedGenius) {
        dieFlag = `${intellectDie.die}rr<${intMod}`;
    } else if (meditation) {
        let meditationStacks = actor.getFlag('5e-content', 'savant.meditation');
        if (meditationStacks === 1) dieFlag = `${intellectDie.die}rr${meditationStacks}`;
        else dieFlag = `${intellectDie.die}rr<=${meditationStacks}`;
    } else {
        dieFlag = `${intellectDie.die}`;
    }
    actor.setFlag('5e-content', 'savant.intellectDie.formula', dieFlag);
    actor.setFlag('5e-content', 'savant.intellectDie.faces', intellectDie.faces);
}
