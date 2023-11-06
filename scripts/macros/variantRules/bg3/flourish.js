import { helpers } from "../../../helpers.js";

export async function flourish(effect) {
    if (effect.flags['5e-content']?.feature?.flourish) {
        await helpers.removeEffect(effect);
        return;
    }

    let updates = {
        'flags.5e-content.feature.flourish': true
    }

    await helpers.updateEffect(effect, updates);
}