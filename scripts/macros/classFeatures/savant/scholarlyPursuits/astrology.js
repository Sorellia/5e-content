import { helpers } from "../../../../helpers.js"

async function restHandler(actor) {
    if (!helpers.getFeature(actor, 'Astrology')) return;
    await helpers.dialog('Astrology', [['Ok', true]], 'Rolling the d20 for your astrology feature. Once rolled, you will be informed as to how to use it.');
    let astrology = await new Roll('1d20').evaluate({async: true});
    astrology = astrology.total;
    await helpers.dialog('Astrology Roll', [['Ok', true]], `Your astrology roll is <b>${astrology}</b>. It has been stored in a flag. Use the Astrology feature on your character sheet to apply the effects of astrology before rolling.`);
    actor.setFlag('5e-content', 'savant.astrology.die', astrology);
}

export let astrology = {
    'longRest': restHandler
}