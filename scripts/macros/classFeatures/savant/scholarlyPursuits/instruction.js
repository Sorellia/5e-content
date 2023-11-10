import { constants } from "../../../../constants.js";
import { helpers } from "../../../../helpers.js"

async function instructionRest(actor) {
    let previousProf = actor.getFlag('5e-content', 'savant.instruction.prof') ?? false;
    if (previousProf) {
        let previousProfType = actor.getFlag('5e-content', 'savant.instruction.type');
        switch (previousProfType) {
            case 'skill':
                await helpers.updateSkillProf(actor, previousProf, 'untrained');
                break;
            case 'weapon':
                await helpers.updateWeaponProf(actor, previousProf, 'remove');
                break;
            case 'tool':
                await helpers.updateToolProf(actor, previousProf, 'remove');
                break;
            case 'language':
                await helpers.updateLanguages(actor, previousProf, true);
            default:
                break;
        }
        actor.unsetFlag('5e-content', 'savant.instruction.type');
        actor.unsetFlag('5e-content', 'savant.instruction.prof');
        actor.unsetFlag('5e-content', 'savant.instruction');
        actor.unsetFlag('5e-content', 'savant');
    }
    let instruction = helpers.getFeature(actor, 'Instruction');
    if (!instruction) return;
    let choice = await helpers.dialog('Instruction', constants.yesNo, 'Would you like to use your Instruction pursuit?');
    if (choice) await instruction.use();
}

async function instructionOnUse({actor, workflow}) {
    let target = workflow.targets;
    if (target.size != 1) return false;
    target = await helpers.getElementFromSingleSet(target);
    target = target.document;
    let instructionChoices = [['A Skill', 'skill'], ['A Tool', 'tool'], ['A Weapon', 'weapon'], ['A Language', 'language']];
    let choice = await helpers.dialog('Instruction', instructionChoices, 'Which of the following would you like to give to your target?', 'column');

    switch (choice) {
        case 'skill':
            await giveSkill(actor, target.actor);
            break;
        case 'tool':
            await giveTool(actor, target.actor);
            break;
        case 'weapon':
            await giveWeapon(actor, target.actor);
            break;
        case 'language':
            await giveLanguage(actor, target.actor);
            break;
        default:
            break;
    }
    target.actor.setFlag('5e-content', 'savant.instruction.type', choice);
}

async function giveSkill(actor, targetActor) {
    let configSkills = CONFIG.DND5E.skills, actorSkills = actor.system.skills, targetSkills = targetActor.system.skills, selectableSkills = [];
    for (let skill in actorSkills) {
        if (actorSkills[skill].value > 0 && targetSkills[skill].value === 0) {
            selectableSkills.push([configSkills[skill].label, skill]);
        }
    }

    if (selectableSkills.length === 0) {
        await helpers.dialog('Nothing to Grant', [['Ok', true]], `${targetActor.name} already has every skill proficiency you could possibly grant them. Use this feature again and choose a new target.`);
        clearTargets();
        let instruction = helpers.getFeature(actor, 'Instruction');
        instruction.use();
        return;
    }
        
    let chosenSkill = await helpers.dialog('Select a Skill', selectableSkills, `Select a skill proficiency from the following to grant to ${targetActor.name}.`, 'column');
    await helpers.updateSkillProf(targetActor, chosenSkill, 'proficient');
    targetActor.setFlag('5e-content', 'savant.instruction.prof', chosenSkill);
}

async function giveTool(actor, targetActor) {
    let selectableTools = [], configTools = CONFIG.DND5E.toolIds, actorTools = actor.system.tools, targetTools = targetActor.system.tools;
    let baseUuidString = 'Compendium.dnd5e.items.Item.';
    let vehicleProfs = {air: 'Air Vehicle', land: 'Land Vehicle', sea: 'Sea Vehicle', space: 'Space Vehicle'};
    configTools = {...configTools,...vehicleProfs};
    
    for (let tool in configTools) {
        let toolUuid = fromUuidSync(baseUuidString + configTools[tool]);
        if (actorTools[tool] && !targetTools[tool]) {
            if (vehicleProfs[tool]) selectableTools.push([vehicleProfs[tool], tool]);
            else selectableTools.push([toolUuid.name, tool]);
        }
    }

    if (selectableTools.length === 0) {
        await helpers.dialog('Nothing to Grant', [['Ok', true]], `${targetActor.name} already has every tool proficiency you could possibly grant them. Use this feature again and choose a new target.`);
        clearTargets();
        let instruction = helpers.getFeature(actor, 'Instruction');
        instruction.use();
        return;
    }

    let chosenTool = await helpers.dialog('Select a Tool', selectableTools, `Select a tool proficiency from the following to teach to ${targetActor.name}.`, 'column');
    await helpers.updateToolProf(targetActor, chosenTool, 'proficient');
    targetActor.setFlag('5e-content', 'savant.instruction.prof', chosenTool);

}

async function giveWeapon(actor, targetActor) {
    let selectableWeapons = [], actorWeaponArray = [], targetWeaponArray = [], configWeapons = CONFIG.DND5E.weaponIds, actorWeapons = actor.system.traits.weaponProf.value, targetWeapons = targetActor.system.traits.weaponProf.value;
    let baseUuidString = 'Compendium.dnd5e.items.Item.';
    
    const iterator = actorWeapons.entries();
    for (const entry of iterator) {
        let weaponCategories = ['sim', 'mar'];
        let actorWeap = entry[0];
        if (!weaponCategories.includes(actorWeap)) {
            actorWeaponArray.push(actorWeap);
        }
    }

    const targetIterator = targetWeapons.entries();
    let targetWeaponProf = '';
    for (const targetEntry of targetIterator) {
        let weaponCategories = ['sim', 'mar'];
        let targetWeap = targetEntry[0];
        if (targetWeap === 'sim') {
            targetWeaponProf = 'simple';
        } else if (targetWeap === 'mar' && targetWeaponProf === 'simple') {
            targetWeaponProf = 'martial';
        }

        if (!weaponCategories.includes(targetWeap)) {
            targetWeaponArray.push(targetWeap);
        }
    }
    if (targetWeaponArray.length === 0 && targetWeaponProf === 'martial') return;
    let viableWeaponArray = actorWeaponArray.filter(val => !targetWeaponArray.includes(val));
    
    for (let weapon in configWeapons) {
        let weaponData = fromUuidSync(baseUuidString + configWeapons[weapon]);
        let permittedTypes = ['simpleR', 'simpleM'];
        if (viableWeaponArray.includes(weapon) || (permittedTypes.includes(weaponData.system.weaponType) && targetWeaponProf != 'simple' && !targetWeaponArray.includes(weapon))) {
            selectableWeapons.push([weaponData.name, weapon]);
        }
    }

    if (selectableWeapons.length === 0) {
        await helpers.dialog('Nothing to Grant', [['Ok', true]], `${targetActor.name} already has every weapon proficiency you could possibly grant them. Use this feature again and choose a new target.`);
        clearTargets();
        let instruction = helpers.getFeature(actor, 'Instruction');
        instruction.use();
        return;
    }

    let chosenWeapon = await helpers.dialog('Select a Weapon', selectableWeapons, `Select a weapon proficiency from the following to teach to ${targetActor.name}.`, 'column');
    await helpers.updateWeaponProf(targetActor, chosenWeapon);
    targetActor.setFlag('5e-content', 'savant.instruction.prof', chosenWeapon);
}

async function giveLanguage(actor, targetActor) {
    let selectableLanguages = [], actorLangArray = [], targetLangArray =[], configLanguages = CONFIG.DND5E.languages, actorLanguages = actor.system.traits.languages.value, targetLanguages = targetActor.system.traits.languages.value;
    const iterator = actorLanguages.entries();
    for (const entry of iterator) {
        let actorLang = entry[0];
        actorLangArray.push(actorLang);
    }

    const targetIterator = targetLanguages.entries();
    for (const entry of targetIterator) {
        let targetLang = entry[0];
        targetLangArray.push(targetLang);
    }

    let forbiddenLanugages = ['cant'];
    for (let language in configLanguages) {
        if (!forbiddenLanugages.includes(language) && (actorLangArray.includes(language) && !targetLangArray.includes(language))) {
            selectableLanguages.push([configLanguages[language], language]);
        }
    }

    if (selectableLanguages.length === 0) {
        await helpers.dialog('Nothing to Grant', [['Ok', true]], `${targetActor.name} already has every language you could possibly grant them. Use this feature again and choose a new target.`);
        clearTargets();
        let instruction = helpers.getFeature(actor, 'Instruction');
        instruction.use();
        return;
    }

    let chosenLanguage = await helpers.dialog('Select a Language', selectableLanguages, `Select a language from the following to teach to ${targetActor.name}.`, 'column');
    await helpers.updateLanguages(targetActor, chosenLanguage);
    targetActor.setFlag('5e-content', 'savant.instruction.prof', chosenLanguage);

}

function clearTargets() {
    game.user.targets.forEach(token => token.setTarget(false, {releaseOthers: false, groupSelection: true}));
    game.user.broadcastActivity({targets: game.user.targets.ids});
}

export let instruction = {
    'instructionRest': instructionRest,
    'onUse': instructionOnUse
}