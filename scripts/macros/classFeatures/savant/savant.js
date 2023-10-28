import { constants } from "../../../constants.js";
import { helpers } from "../../../helpers.js";
import { queue } from "../../../utility/queue.js";
import { acceleratedReflexes } from "./acceleratedReflexes.js";
import { flashOfBrilliance } from "./flashOfBrilliance.js";
import { predictiveDefense } from "./predictiveDefense.js";
import { profoundInsight } from "./profoundInsight.js";
import { savantHelpers } from "./savantHelpers.js";

let adroitAnalysis = {
    'markAttackDisadvantage': async function _markAttackDisadvantage(workflow) {
        let target = workflow.targets;
        let token = workflow.token.document;
        let validActionTypes = ['mwak', 'rwak', 'msak', 'rsak'];
        if (token.disposition != -1 || target.size != 1 || !validActionTypes.includes(workflow.item.system.actionType)) return;
        target = await helpers.getTargetFromSingleSet(target);
        target = target.document;
        if (!savantHelpers.isMarkSource(token, target)) return;
        if (!savantHelpers.isMark(token)) return;
        workflow.disadvantage = true;
    },
    'intSubstitute': async function _intSubstitute(workflow) {
        let target = workflow.targets;
        let actor = workflow.actor;
        let adroitAnalysis = helpers.getFeature(actor, 'Adroit Analysis');
        let item = workflow.item;
        let itemActionType = item.system.actionType;
        let validActionTypes = ['mwak', 'rwak'];
        if (!adroitAnalysis || target.size != 1 || !validActionTypes.includes(itemActionType)) return;
        target = await helpers.getTargetFromSingleSet(target);
        target = target.document;
        let finesse = item.system.properties.fin ?? false;
        if (!savantHelpers.isMark(target)) return;
        console.log(item);
        if (!finesse) if (actor.system.abilities.int.mod > actor.system.abilities.str.mod) workflow.item.system.ability = 'int';
        if (finesse) {
            let bestAttack;
            if (actor.system.abilities.dex.mod > actor.system.abilities.str.mod) bestAttack = actor.system.abilities.dex.mod;
            else bestAttack = actor.system.abilities.str.mod;
            if (actor.system.abilities.int.mod > bestAttack) workflow.item.system.ability = 'int';
        }
    },
    'preDamage': async function _preDamage(workflow) {
        let deafened = helpers.findEffect(workflow.actor, 'Deafened');
        if (deafened) return;
        let target = workflow.hitTargets;
        if (target.size === 0) return;
        target = await helpers.getTargetFromSingleSet(target);
        target = target.document;
        if (savantHelpers.isMark(target)) {
            let actor = workflow.actor;
            let token = workflow.token.document;
            if (token.disposition === -1) return;
            let savantDie, wondrousIntellect = helpers.getFeature(actor, 'Wondrous Intellect');
    
            let queueSetup = await queue.setup(workflow.uuid, 'wondrousIntellect', 150);
            if (!queueSetup) return;
    
            if (!wondrousIntellect) {
                let tokens = helpers.findNearby(token, 1000, 'ally').filter(i => helpers.getFeature(i.actor, 'Wondrous Intellect') && !helpers.findEffect(i.actor, 'Reaction'));
                if (tokens.length === 0) {
                    queue.remove(workflow.uuid);
                    return;
                }
                for (let token of tokens) {
                    wondrousIntellect = helpers.getFeature(token.actor, 'Wondrous Intellect');
                    let firstOwner = helpers.firstOwner(token);
                    await helpers.thirdPartyReactionMessage(firstOwner);
                    let message = 'Bolster ' + actor.name + `'s attack damage with your intellect die?`;
                    let potentObservation = helpers.getFeature(token.actor, 'Potent Observation');
                    let titleMessage = 'Wondrous Intellect';
                    if (potentObservation) titleMessage = 'Potent Observation'
                    if (firstOwner.isGM) message = '[' + token.actor.name + '] ' + message;
                    let selection = await helpers.remoteDialog(titleMessage, constants.yesNo, firstOwner.id, message);
                    if (!selection) continue;
                    await helpers.addCondition(token.actor, 'Reaction', false);
                    savantDie = savantHelpers.getIntellectDie(token.actor, true);
                    if (potentObservation) savantDie = '2' + savantDie + 'kh1';
                }
            } else {
                savantDie = savantHelpers.getIntellectDie(actor, true);
            }
            await helpers.clearThirdPartyReactionMessage();
    
            let effectData = {
                'icon': wondrousIntellect.img,
                'label': wondrousIntellect.name,
                'origin': wondrousIntellect.uuid,
                'changes': [
                    {
                        'key': 'system.bonuses.All-Damage',
                        'mode': 2,
                        'value': savantDie,
                        'priority': 0
                    }
                ],
                'flags': {
                    'dae': {
                        'specialDuration': ['DamageDealt']
                    }
                }
            };
    
            await helpers.createEffect(actor, effectData);
            queue.remove(workflow.uuid);
        } else {
            let actor = workflow.actor;
            let token = workflow.token.document;
            if (token.disposition === -1) return;
            let savantDie, queueSetup = await queue.setup(workflow.uuid, 'potentObservation', 150);
            let potentObservation;
            if (!queueSetup) return;

            let tokens = helpers.findNearby(token, 1000, 'ally').filter(i => helpers.getFeature(i.actor, 'Potent Observation') && !helpers.findEffect(i.actor, 'Reaction'));
            if (tokens.length === 0) {
                queue.remove(workflow.uuid);
                return;
            }
            for (let token of tokens) {
                let firstOwner = helpers.firstOwner(token);
                await helpers.thirdPartyReactionMessage(firstOwner);
                let message = 'Bolster ' + actor.name + `'s attack damage with your intellect die?`;
                if (firstOwner.isGM) message = '[' + token.actor.name + '] ' + message;
                let selection = await helpers.remoteDialog('Potent Observation', constants.yesNo, firstOwner.id, message);
                if (!selection) continue;
                await helpers.addCondition(token.actor, 'Reaction', false);
                savantDie = savantHelpers.getIntellectDie(token.actor, true);
                potentObservation = helpers.getFeature(token.actor, 'Potent Observation');
            }
            await helpers.clearThirdPartyReactionMessage();
    
            let effectData = {
                'icon': potentObservation.img,
                'label': potentObservation.name,
                'origin': potentObservation.uuid,
                'changes': [
                    {
                        'key': 'system.bonuses.All-Damage',
                        'mode': 2,
                        'value': savantDie,
                        'priority': 0
                    }
                ],
                'flags': {
                    'dae': {
                        'specialDuration': ['DamageDealt']
                    }
                }
            };
    
            await helpers.createEffect(actor, effectData);
            queue.remove(workflow.uuid);
        }
    },
    'selfDamageBuffs': async function _selfDamageBuffs(workflow) {
        await adroitAnalysis.intSubstitute(workflow);
    },
    'onDamage': async function _onDamage(target, {workflow}) {
        let actor = workflow.actor;
        let targets = workflow.hitTargets;
        if (targets.size != 1 || !helpers.getFeature(actor, 'Adroit Analysis')) return;
        target = target.document;
        if (!savantHelpers.isMark(target)) return;
        await promptAdroitInformation(target.actor);
    },
    'preSave': async function _preSave(workflow) {
        let actor = workflow.actor;
        let concentration = helpers.findEffect(actor, 'Concentrating');
        if (concentration) {
            let concSource = fromUuidSync(concentration.origin);
            let target = workflow.targets;
            if (concSource.name != 'Adroit Analysis' || target.size === 0) return;
            target = helpers.getTargetFromSingleSet(target);
            target = target.document;
            let token = workflow.token.document
            if (concSource.parent.uuid != token.actor.uuid) return;
            if (actor.system.abilities.int.mod > actor.system.abilities.con.mod) workflow.item.system.save.ability = 'int';
        } else {
            let token = workflow.token.document
            if (!savantHelpers.isMark(token)) return;
            let targets = workflow.targets;
            let target;
            let iterator = targets.entries();
    
            for (const entry of iterator) {
                if (savantHelpers.isMarkSource(token, entry[0].document)) {
                    target = entry[0].document;
                    let incapacitated = helpers.findEffect(target.actor, 'Incapacitated');
                    if (incapacitated) continue;
                    let predictiveExpert = helpers.getFeature(target.actor, 'Predictive Expert');
                    if (!predictiveExpert) continue;

                    let effectData = {
                        'icon': predictiveExpert.img,
                        'label': predictiveExpert.name,
                        'origin': predictiveExpert.uuid,
                        'changes': [
                            {
                                'key': 'flags.midi-qol.advantage.ability.save.all',
                                'mode': 0,
                                'value': 1,
                                'priority': 0
                            }
                        ],
                        'flags': {
                            'dae': {
                                'specialDuration': ['isSave']
                            }
                        }
                    };
                    await helpers.createEffect(target.actor, effectData);
                } else {
                    target = entry[0].document;
                    let profoundInsight = target.actor.getFlag('5e-content', 'profoundInsight');
                    if (!profoundInsight) continue;

                    let effectData = {
                        'icon': 'icons/magic/perception/mask-stone-eyes-orange.webp',
                        'label': 'Profound Insight',
                        'changes': [
                            {
                                'key': 'flags.midi-qol.advantage.ability.save.all',
                                'mode': 0,
                                'value': 1,
                                'priority': 0
                            }
                        ],
                        'flags': {
                            'dae': {
                                'specialDuration': ['isSave']
                            }
                        }
                    };
                    await helpers.createEffect(target.actor, effectData);
                }
            }
        }
    }
}

async function promptAdroitInformation(target) {
    let choiceButtons = buildChoices(target);
    let adroitMessage = 'You may learn one of the following characteristics of your target, which would you like to learn?';
    if (choiceButtons.length === 1) adroitMessage = 'You have learned all other characteristics of your target, and can only ask the following question.'
    let choice = await helpers.dialog('Adroit Analysis Information', choiceButtons, adroitMessage, 'column');
    let answer;
    let abilityScores = target.system.abilities;
    target.setFlag('5e-content', `savant.adroitAnalysis.${choice}.learned`, true);
    switch (choice) {
        case 'hiScore':
            let hiScore = ['', 0];
            for (let ability in abilityScores) {
                let currentHighest = hiScore[1];
                if (abilityScores[ability].value > currentHighest) {
                    hiScore = [ability, abilityScores[ability].value];
                }
            }
            switch (hiScore[0]) {
                case 'str':
                    hiScore = 'Strength';
                    break;
                case 'dex':
                    hiScore = 'Dexterity';
                    break;
                case 'con':
                    hiScore = 'Constitution';
                    break;
                case 'int':
                    hiScore = 'Intelligence';
                    break;
                case 'wis':
                    hiScore = 'Wisdom';
                    break;
                case 'cha':
                    hiScore = 'Charisma';
                    break;
                default:
                    break;
            }
            answer = hiScore;
            helpers.dialog('Highest Ability Score', constants.okCancel, `The target's highest ability score is <b>${answer}</b>.`);
            break;
        case 'loScore':
            let lowScore = ['', 21];
            for (let ability in abilityScores) {
                let currentLowest = lowScore[1];
                if (abilityScores[ability].value < currentLowest) {
                    lowScore = [ability, abilityScores[ability].value];
                }
            }
            switch (lowScore[0]) {
                case 'str':
                    lowScore = 'Strength';
                    break;
                case 'dex':
                    lowScore = 'Dexterity';
                    break;
                case 'con':
                    lowScore = 'Constitution';
                    break;
                case 'int':
                    lowScore = 'Intelligence';
                    break;
                case 'wis':
                    lowScore = 'Wisdom';
                    break;
                case 'cha':
                    lowScore = 'Charisma';
                    break;
                default:
                    break;
            }
            answer = lowScore;
            helpers.dialog('Lowest Ability Score', constants.okCancel, `The target's lowest ability score is <b>${answer}</b>.`);
            break;
        case 'ac':
            answer = target.system.attributes.ac.value;
            helpers.dialog('Armor Class', constants.okCancel, `The target's armor class rating is <b>${answer}</b>.`);
            break;
        case 'speed':
            let bestSpeed = ['', 0];
            let speedArray = target.system.attributes.movement;
            let forbiddenSpeeds = ['units', 'hover'];
            let speedString;
            for (let speed in speedArray) {
                let currentBest = bestSpeed[1];
                if (!forbiddenSpeeds.includes(speed)) {
                    if (speedArray[speed] > currentBest) {
                        bestSpeed = [speed, speedArray[speed]];
                    }
                }
            }
            switch (bestSpeed[0]) {
                case 'burrow':
                    speedString = 'burrowing';
                    break;
                case 'climbing':
                    speedString = 'climbing';
                    break;
                case 'fly':
                    speedString = 'flying';
                    break;
                case 'swim':
                    speedString = 'swimming';
                    break;
                case 'walk':
                    speedString = 'walking';
                    break;
                default:
                    break;
            }
            answer = speedString;
            helpers.dialog('Best Speed', constants.okCancel, `The target's best speed is their <b>${answer}</b> speed, which has a speed of <b>${bestSpeed[1]}</b> ft. per round.`);
            break;
        case 'maxHP':
            answer = target.system.attributes.hp.max;
            helpers.dialog('Maximum Hit Points', constants.okCancel, `The target's maximum hit point count is <b>${answer}</b>.`);
            break;
        case 'creatureType':
            answer = helpers.raceOrType(target);
            helpers.dialog('Creature Type', constants.okCancel, `The target's creature type is <b>${answer}</b>.`);
            break;
        case 'misc':
            helpers.dialog('Unsupported Question', constants.okCancel, `This question type cannot be automatically answered. Please ask the DM your question instead.`);
            break;
        default:
            break;
    }
}

function buildChoices(target) {
    let choiceButtons = [];
    let hiScore = target.getFlag('5e-content', 'savant.adroitAnalysis.hiScore.learned');
    let loScore = target.getFlag('5e-content', 'savant.adroitAnalysis.loScore.learned');
    let ac = target.getFlag('5e-content', 'savant.adroitAnalysis.ac.learned');
    let speed = target.getFlag('5e-content', 'savant.adroitAnalysis.speed.learned');
    let maxHP = target.getFlag('5e-content', 'savant.adroitAnalysis.maxHP.learned');
    let creatureType = target.getFlag('5e-content', 'savant.adroitAnalysis.creatureType.learned');

    if (!hiScore) choiceButtons.push(['Highest Ability Score', 'hiScore']);
    if (!loScore) choiceButtons.push(['Lowest Ability Score', 'loScore']);
    if (!ac) choiceButtons.push(['Armor Class', 'ac']);
    if (!speed) choiceButtons.push(['Best Speed', 'speed']);
    if (!maxHP) choiceButtons.push(['Maximum Hit Points', 'maxHP']);
    if (!creatureType) choiceButtons.push(['Creature Type', 'creatureType']);
    choiceButtons.push(['Any Question concerning the mark or its creature type', 'misc']);

    return choiceButtons;
}

export let savant = {
    'adroitAnalysis': adroitAnalysis,
    'acceleratedReflexes': acceleratedReflexes,
    'predictiveDefense': predictiveDefense,
    'flashOfBrilliance': flashOfBrilliance,
    'profoundInsight': profoundInsight
}