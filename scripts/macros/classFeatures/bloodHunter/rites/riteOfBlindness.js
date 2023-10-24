import { helpers } from "../../../../helpers.js";
import { queue } from "../../../../utility/queue.js";
import { constants } from "../../../../constants.js";

async function reactionDefense(workflow) {
    let targetToken = workflow.hitTargets;
    if (targetToken.size !== 1) return;
    targetToken = await helpers.getTargetFromSingleSet(targetToken);
    targetToken = targetToken.document;
    let attackingToken = workflow.token.document;
    if (helpers.findEffect(attackingToken.actor, 'Rite of Blindness (Invoked)')) return;
    if (targetToken.disposition != 1 || attackingToken.disposition != -1) return;

    let queueSetup = await queue.setup(workflow.uuid, 'riteOfBlindness', 150);
    if (!queueSetup) return;
    let rite = await helpers.getFeature(targetToken.actor, 'Rite of Blindness');
    let tokens = helpers.findNearby(attackingToken, 30, 'enemy').filter(i => helpers.getFeature(i.actor, 'Rite of Blindness') && !helpers.findEffect(i.actor, 'Reaction'));
    let itemUse = false;
    let sourceActor;
    if (!rite) {
        if (tokens.length === 0) {
            queue.remove(workflow.uuid);
            return;
        }
        for (let token of tokens) {
            let firstOwner = helpers.firstOwner(token);
            await helpers.thirdPartyReactionMessage(firstOwner);
            let message = 'Protect ' + targetToken.actor.name + ' by debiliating their attacker with your Rite of Blindness?'
            if (firstOwner.isGM) message = '[' + token.actor.name + '] ' + message;
            let selection = await helpers.remoteDialog('Rite of Blindness', constants.yesNo, firstOwner.id, message, 'row');
            if (!selection) continue;
            await token.actor.setFlag('5e-content', 'blindness.target', workflow.tokenUuid);
            let originItem = await helpers.getFeature(token.actor, 'Rite of Blindness');
            itemUse = await originItem.use();
            if (itemUse) {
                sourceActor = token.actor;
                break;
            }
        }
    } else if (rite) {
        console.log("Target of the attack has rite of blindness!");
        let firstOwner = helpers.firstOwner(targetToken);
        await helpers.thirdPartyReactionMessage(firstOwner);
        let message = 'You are being attacked! Protect yourself by debiliating your attacker with Rite of Blindness?'
        let selection = await helpers.remoteDialog('Rite of Blindness', constants.yesNo, firstOwner.id, message, 'row');
        if (selection) {
            await targetToken.actor.setFlag('5e-content', 'blindness.target', workflow.tokenUuid);
            itemUse = await rite.use();
        }
    }
    await helpers.clearThirdPartyReactionMessage();
    if (itemUse) {
        if (!sourceActor) sourceActor = targetToken.actor;
        await debuffAttack(sourceActor, workflow);
    }
    queue.remove(workflow.uuid);
}

async function debuffAttack(sourceActor, workflow) {
    let originItem = await helpers.getFeature(sourceActor, 'Rite of Blindness');
    let riteDice = sourceActor.system?.scale['blood-hunter']['blood-rite-die'];
    let debuff = riteDice.die;
    let riteName = originItem.name;
    let invoked = sourceActor.getFlag('5e-content', 'vitalSacrifice.proceed') ?? false;
    if (invoked) riteName = riteName + ' (Invoked)';

    if (helpers.getFeature(sourceActor, 'Sanguine Mastery')) debuff = '2' + debuff + 'kh1';

    let effectData = {
        'duration': {'seconds': 6},
        'icon': originItem.img,
        'label': riteName,
        'origin': originItem.uuid,
        'changes': [
            {
                'key': 'system.bonuses.All-Attacks',
                'mode': 2,
                'value': `-${debuff}`,
                'priority': 0
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': ['1Attack']
            }
        }
    };
    if (invoked) {
        effectData.flags.dae.specialDuration.splice(0,1);
        effectData.flags = {
            'dae': {
                'specialDuration': ['turnEndSource']
            }
        };
    }
    
    sourceActor.unsetFlag('5e-content', 'blindness');

    await helpers.createEffect(workflow.token.actor, effectData);
}

export let riteOfBlindness = {
    'reactionDefense': reactionDefense
}