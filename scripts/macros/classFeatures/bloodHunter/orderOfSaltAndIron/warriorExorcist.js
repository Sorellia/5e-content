import { bloodHunter } from "../bloodHunter.js";
import { constants } from "../../../../constants.js";
import { helpers } from "../../../../helpers.js";

async function onUse({actor, item, token, workflow}) {
    let target = workflow.targets;
    if (target.size > 1) return false;
    else if (target.size === 1) {
        target = await helpers.getElementFromSingleSet(target)
        target = target.document;
        if (target.disposition === -1) {
            ui.notifications.warn('WARNING | Target is not a willing creature!');
            return false;
        }
    } else {
        let selfTarget = await helpers.dialog('Target Self', constants.yesNo, `You don't have a target selected. Select yourself?`);
        if (!selfTarget) return false;
        target = token;
    }
    if (item.system.uses.value === 0) {
        let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true, false, true, false);
        actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
        if (!vitalSacrifice) return;
    }

    let targetEffects = [];
    let targetEffectOrigins = [];
    let targetActor = target.actor;
    const magicalEffectNames = ['Charm Person', 'Command', 'Sleep Spell', 'Fear'];
    const nonMagicalEffectNames = ['Charmed', 'Frightened'];

    targetActor.effects.forEach(effect => {
        if (magicalEffectNames.includes(effect.name)) {
            targetEffects.push([effect.name, effect._id]);
            targetEffectOrigins.push([effect._id, effect.origin]);
        }
    });

    targetActor.effects.forEach(effect => {
        if (nonMagicalEffectNames.includes(effect.name)) {
            let duplicateOrigin = false;
            if (targetEffectOrigins.length > 0) {
                for (let effectOrigin of targetEffectOrigins) {
                    if (effectOrigin[1] === effect.origin) {
                        duplicateOrigin = true;
                        continue;
                    }
                }
            }
            if (!duplicateOrigin) {
                targetEffects.push([effect.name, effect._id]);
                targetEffectOrigins.push([effect._id, effect.origin]);
            }
        }
    });

    let selection;
    let selectionOrigin;
    if (targetEffects.length === 0) {
        await helpers.dialog('Invalid Effects', constants.okCancel, 'No applicable effects found! Ask your GM if there are any magical control effects on your target!');
        return false;
    }
    if (targetEffects.length === 1) {
        await helpers.dialog('A single effect', constants.okCancel, `Your target only has a single applicable effect! They currently suffer from the ${targetEffects[0][0]} condition.`);
        selection = targetEffects[0][1];
        selectionOrigin = targetEffectOrigins[0][1];
    }
    if (!selection) selection = await helpers.dialog('Warrior Exorcist', targetEffects, 'Choose one of the following effects to dispel.', 'columns');
    if (!selection) return;

    for (let effectOrigin of targetEffectOrigins) {
        if (effectOrigin[0] === selection) {
            selectionOrigin = effectOrigin[1];
        }
    }
    
    let effectData = targetActor.effects.get(selection).toObject();
    let effect = helpers.findEffect(actor, effectData.name);
    await helpers.removeEffect(effect);

    let sourceItem = fromUuidSync(selectionOrigin);
    let sourceActor = sourceItem.parent ?? undefined;
    let sourceToken = sourceActor?.getActiveTokens()[0] ?? undefined;
    
    if (sourceActor === undefined) {
        await helpers.dialog('Invalid Source', constants.okCancel, `This effect's source actor is invalid. Please consult with your GM as to the source and have them determine if it is within 30 feet of you.`);
        return;
    }
    
    let nearbyTokens = await helpers.findNearby(token.document, 30).filter(i => i._id === sourceToken._id);
    if (nearbyTokens.length === 0) return;
    actor.setFlag('5e-content', 'warriorExorcist.damage', true);
    actor.setFlag('5e-content', 'warriorExorcist.target', sourceToken.document.uuid);
}

 async function applyEffects({actor, args, item, token}) {
    let dealDamage = actor.getFlag('5e-content', 'warriorExorcist.damage') ?? false;
    if (!dealDamage) return;
    let targetUuid = actor.getFlag('5e-content', 'warriorExorcist.target');
    let target = fromUuidSync(targetUuid);

    actor.unsetFlag('5e-content', 'warriorExorcist.damage');
    actor.unsetFlag('5e-content', 'warriorExorcist.target');
    actor.unsetFlag('5e-content', 'warriorExorcist');

    let saveResult = await helpers.rollRequest(target.object, 'save', 'wis');
    let dc = await helpers.getItemDC(item);
    if (saveResult.total >= dc) return;
    
    let riteDice = actor.system.scale['blood-hunter']['blood-rite-die'].die;
    let sanguineMastery = helpers.getFeature(actor, 'Sanguine Mastery');
    if (sanguineMastery) riteDice = `6${riteDice}kh`;
    else riteDice = `3${riteDice}`;
    let damageRoll = await new Roll(riteDice).evaluate({async: true});
    await helpers.applyWorkflowDamage(token, damageRoll, 'radiant', [target], 'Warrior Exorcist - Damage to Effect Source', args[0].itemCardId);
 }

 export let warriorExorcist = {
    'onUse': onUse,
    'applyEffects': applyEffects
 }