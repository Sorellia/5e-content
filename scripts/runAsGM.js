import { helpers } from "./helpers.js";

async function updateCombatant(tokenId, updates) {
    let combatant = game.combat?.combatants?.get(tokenId);
    if (!combatant) return;
    await combatant.update(updates);
}

async function createEffect(actorUuid, effectData) {
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
}

async function updateEffect(effectUuid, updates) {
    let effect = await fromUuid(effectUuid);
    if (!effect) return;
    await effect.update(updates);
}

async function removeEffect(effectUuid) {
    let effect = await fromUuid(effectUuid);
    if (!effect) return;
    await effect.delete();
}

export let runAsGM = {
    'updateCombatant': updateCombatant,
    'createEffect': createEffect,
    'updateEffect': updateEffect,
    'removeEffect': removeEffect
}

async function rollItem(itemUuid, config, options) {
    let item = await fromUuid(itemUuid);
    if (!item) return;
    return await helpers.rollItem(item, config, options);
}

export let runAsUser = {
    'rollItem': rollItem
}