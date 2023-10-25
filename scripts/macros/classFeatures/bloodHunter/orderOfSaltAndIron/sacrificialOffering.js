import { bloodHunter } from "../bloodHunter.js";
import { constants } from "../../../../constants.js";
import { helpers } from "../../../../helpers.js";

async function onDamage(token, {ditem}) {
    token = token.document;
    let actor = token.actor;
    let sacrificialOffering = helpers.getFeature(actor, 'Sacrificial Offering');
    if (!sacrificialOffering) return;
    let hpDamage = ditem.hpDamage;
    let newHP = ditem.newHP;
    let riteDice = actor.system.scale[`blood-hunter`][`blood-rite-die`].die;
    let reaction = helpers.findEffect(actor, 'Reaction');
    let hit = ditem.wasHit;
    if (reaction || newHP != 0 || !hit) return;
    let choice = await helpers.dialog('Sacrificial Offering', constants.yesNo, 'You are about to be reduced to 0 HP! Would you like to use your reaction to invoke sacrificial offering?');
    if (!choice) return;
    await helpers.addCondition(actor, 'Reaction', false);
    await bloodHunter.performVitalSacrifice('', riteDice, token, false);
    ditem.hpDamage = hpDamage - 1;
}

export let sacrificialOffering = {
    'onDamage': onDamage
}