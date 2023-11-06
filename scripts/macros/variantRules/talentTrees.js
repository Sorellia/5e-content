import { constants } from "../../constants.js";
import { helpers } from "../../helpers.js";

export async function talentTreeLevelupHandler(advancement) {
    let advancementSteps = advancement.steps;
    let actor = advancement.actor;
    let talentPoints = actor.getFlag('5e-content', 'talents.talentPoints') ?? 0;
    let actorProf = actor.system.attributes.prof, previousProf = actor.getFlag('5e-content', 'talents.actorProf') ?? 2;

    if (actor.system.details.level === 1) talentPoints = 2;
    if (actorProf > previousProf) {
        await actor.setFlag('5e-content', 'talents.actorProf', actorProf);
        talentPoints++;
    }

    for (let step in advancementSteps) {
        let advancementName = advancementSteps[step]?.flow?.title ?? '';
        if (advancementName === 'Ability Score Improvement' && advancementSteps[step].type === 'forward') {
            talentPoints+=2;
            for (let assignment in advancementSteps[step].flow.assignments) {
                let assignments = advancementSteps[step].flow.assignments[assignment];
                if (assignments > 0) talentPoints-= assignments;
            }
        }
    }

    if (talentPoints === 0) return;
    await actor.setFlag('5e-content', 'talents.talentPoints', talentPoints);
    let spendTalents = await helpers.dialog('Talent Spending', constants.yesNo, `You have <b>${talentPoints}</b> talent points available to spend. Would you like to spend them? You are not required to.`);
    if (spendTalents) await talentDialog(actor, talentPoints, talentPoints);
}

async function talentDialog(actor, talentPoints, cycles = 1) {
    for (let cycle = 0; cycle < cycles; cycle++) {
        let talentMessage = `Talents`
        if (cycles > 1) talentMessage = `Talents (${cycle + 1}/${cycles})`
        let talentChoices = await helpers.dialog(talentMessage, [['Skill Trees', 'skillTalents'], ['Specialty Trees', 'specialtyTalents']], `You currently have <b>${talentPoints - cycle}</b> talent points to spend. Would you like to spend one on a skill tree, or a specialty tree?`);

        switch (talentChoices) {
            case 'skillTalents':
                await chooseSkillTalentCategory(actor);
                break;
            case 'specialtyTalents':
                await chooseSpecialtyTalentCategory(actor);
                break;
            default:
                break;
        }

        let actorTalentPoints = actor.getFlag('5e-content', 'talents.talentPoints') ?? cycles-cycle;
        actorTalentPoints = actorTalentPoints-1;
        await actor.setFlag('5e-content', 'talents.talentPoints', actorTalentPoints);
    }
}

async function chooseSkillTalentCategory(actor, skill = false) {
    let configSkills = CONFIG.DND5E.skills, skillChoice;
    if (!skill) {
        let skillDialog = [];
        for (let skill in configSkills) {
            skillDialog.push([configSkills[skill].label, skill]);
        }
        skillChoice = await helpers.dialog('Skill Talents', skillDialog, 'What skill would you like to select a talent for?', 'column');
    } else skillChoice = skill;
    let skillName = configSkills[skillChoice].label, viableTalents = [], entryTalent = false;
    const pack = game.packs.get('5e-content.feats'), items = await pack.getDocuments();

    for (let item of items) {
        let itemFlag = item.flags['5e-content']?.talents?.multipleAllowed ?? false
        if (item.folder.name === skillName && (!helpers.getFeature(actor, item.name) && !itemFlag)) {
            let itemRequirements = item.system.requirements;
            if (itemRequirements === '' || helpers.getFeature(actor, itemRequirements)) {
                viableTalents.push([item.name, item.uuid]);
            } else if (itemRequirements != '') {
                let formattedRequirements = itemRequirements.replace('or ', ''), pushItem = false;
                formattedRequirements = formattedRequirements.split(', ');
                for (let requirement of formattedRequirements) if (helpers.getFeature(actor, requirement)) pushItem = true;
                if (pushItem) viableTalents.push([item.name, item.uuid]);
            }
        }
    }

    if (viableTalents.length === 0) {
        await helpers.dialog('All Talents Learned', [['Ok', true]], 'You already know all talents from this cateogry. Returning to the category to choose a new one.');
        await chooseSkillTalentCategory(actor);
        return;
    }

    let talentOption = await helpers.dialog('Select a Talent', viableTalents, 'Which talent would you like to learn?', 'column');
    let item = await fromUuidSync(talentOption), itemData = game.items.fromCompendium(item);
    await actor.createEmbeddedDocuments('Item', [itemData]);
    if (itemData.system.requirements === '' && !skill) entryTalent = true;

    let talents = actor.getFlag('5e-content', `talents.${skillName.toLowerCase()}Talents`) ?? 0;
    actor.setFlag('5e-content', `talents.${skillName.toLowerCase()}Talents`, talents + 1);

    if (entryTalent) await handleEntryTalents(actor, 'skill', skillChoice, skillName);
}

async function chooseSpecialtyTalentCategory(actor, specialty = false) {
    let specialtyChoice, viableTalents = [], entryTalent = false;
    const pack = game.packs.get('5e-content.feats'), items = await pack.getDocuments();
    if (!specialty) {
        let specialtyDialog = [['Adventuring', 'Adventuring'], ['Apprenticeship', 'Apprenticeship'], ['Armor', 'Armor'], ['Martial Talent', 'Martial Talent'], ['War Magic', 'War Magic'], ['Weapon Specialization', 'Weapon Specialization']];
        specialtyChoice = await helpers.dialog('Specialty Talents', specialtyDialog, 'Which specialty talent category would you like to choose from?', 'column');
    
        switch (specialtyChoice) {
            case 'Adventuring':
                specialtyChoice = await helpers.dialog('Adventuring Categories', [['A Friend So Nice', 'A Friend So Nice'], ['A Little Extra Life', 'A Little Extra Life']], 'Select a category of Adventuring talents you would like to pick from');
                break;
            case 'Weapon Specialization':
                let weaponSpec = await helpers.dialog('Weapon Specialization', [['One Major', 'major'], ['Two Intermediate', 'intermed'], ['One Intermediate and One Minor', 'interminor'], ['Three Minor', 'minor']], 'You can select weapon talents from within the <b>Major, Intermediate</b> and <b>Minor</b> categories, using one of the four options below. Pick your preference.', 'column');
                if (weaponSpec === 'major') await handleWeaponSpecs(actor, 1);
                else if (weaponSpec === 'intermed') await handleWeaponSpecs(actor, 0, 2);
                else if (weaponSpec === 'interminor') await handleWeaponSpecs(actor, 0, 1, 1);
                else if (weaponSpec === 'minor') await handleWeaponSpecs(actor, 0, 0, 3);
                return;
            default:
                break;
        }
    } else specialtyChoice = specialty;
    
    for (let item of items) {
        let itemFlag = item.flags['5e-content']?.talents?.multipleAllowed ?? false
        if (item.folder.name === specialtyChoice && (!helpers.getFeature(actor, item.name) && !itemFlag)) {
            let itemRequirements = item.system.requirements;
            if (itemRequirements === '' || helpers.getFeature(actor, itemRequirements)) {
                viableTalents.push([item.name, item.uuid]);
            } else if (itemRequirements != '') {
                let formattedRequirements = itemRequirements.replace('or ', ''), pushItem = false;
                formattedRequirements = formattedRequirements.split(', ');
                for (let requirement of formattedRequirements) if (helpers.getFeature(actor, requirement)) pushItem = true;
                if (pushItem) viableTalents.push([item.name, item.uuid]);
            }
        }
    }

    if (viableTalents.length === 0) {
        await helpers.dialog('All Talents Learned', [['Ok', true]], 'You already know all talents from this cateogry. Returning to the category to choose a new one.');
        await chooseSpecialtyTalentCategory(actor);
        return;
    }

    let talentOption = await helpers.dialog('Select a Talent', viableTalents, 'Which talent would you like to learn?', 'column');
    let item = await fromUuidSync(talentOption), itemData = game.items.fromCompendium(item);
    if (itemData.system.requirements === ''&& !specialty) entryTalent = true;
    await actor.createEmbeddedDocuments('Item', [itemData]);

    let talents = actor.getFlag('5e-content', `talents.${specialtyChoice.toLowerCase()}Talents`) ?? 0;
    actor.setFlag('5e-content', `talents.${specialtyChoice.toLowerCase()}Talents`, talents + 1)

    if (entryTalent) await handleEntryTalents(actor, 'specialty', specialtyChoice, itemData.name);
}

async function handleEntryTalents(actor, talentCategory, talentType, talentName) {
    let unnecessaryTalentTypes = ['A Friend So Nice', 'A Little Extra Life', 'Apprenticeship', 'War Magic'], bannedTalentNames = ['Weapon Improvisation'];
    if (talentCategory === 'specialty' && !unnecessaryTalentTypes.includes(talentType) && !bannedTalentNames.includes(talentName)) {
        let choice = await helpers.dialog('Entry Talent', constants.yesNo, 'The talent you have selected is an entrance talent, have you chosen everything you wish to choose from it already?');
        if (!choice) return;
        await chooseSpecialtyTalentCategory(actor, talentType);
    } else if (talentCategory === 'skill') {
        let actorProf = actor.system.skills[talentType].value;
        if (actorProf === 0) await helpers.updateSkillProf(actor, talentName);
        else {
            await helpers.dialog('Already Proficient', [['Ok', true]], 'You are already proficient in the skill granted by this talent. You will now be taken to select a new talent in the tree.');
            await chooseSkillTalentCategory(actor, talentType);
        }
    }
}

async function handleWeaponSpecs(actor, majorSpecs = 0, intermediateSpecs = 0, minorSpecs = 0) {
    const pack = game.packs.get('5e-content.feats'), items = await pack.getDocuments();

    if (majorSpecs > 0) {
        for (let spec = 0; spec < majorSpecs; spec++) {
            let viableMajorSpecs = [];
            for (let item of items) {
                if (item.folder.name === 'Major' && !helpers.getFeature(actor, item.name)) {
                    let itemRequirements = item.system.requirements;
                    viableMajorSpecs.push([`(${itemRequirements}) ${item.name}`, item.uuid]);
                }
            }

            if (viableMajorSpecs.length === 0) {
                await helpers.dialog('All Major Specializations Learned', [['Ok', true]], 'You already know all major weapon specialisations!');
                break;
            }

            let specTitle = 'Select a Weapon Specialization';
            if (majorSpecs > 1) specTitle = `Select a Weapon Specialization (${spec + 1}/${majorSpecs})`;
            let specOption = await helpers.dialog(specTitle, viableMajorSpecs, 'Which weapon specialization would you like to learn?', 'column');
            let item = await fromUuidSync(specOption), itemData = game.items.fromCompendium(item);
            await actor.createEmbeddedDocuments('Item', [itemData]);
        }
    }

    if (intermediateSpecs > 0) {
        for (let spec = 0; spec < intermediateSpecs; spec++) {
            let viableIntermediateSpecs = [];
            for (let item of items) {
                if (item.folder.name === 'Intermediate' && !helpers.getFeature(actor, item.name)) {
                    let itemRequirements = item.system.requirements;
                    viableIntermediateSpecs.push([`(${itemRequirements}) ${item.name}`, item.uuid]);
                }
            }

            if (viableIntermediateSpecs.length === 0) {
                await helpers.dialog('All Intermediate Specializations Learned', [['Ok', true]], 'You already know all intermediate weapon specialisations!');
                break;
            }

            let specTitle = 'Select a Weapon Specialization';
            if (intermediateSpecs > 1) specTitle = `Select a Weapon Specialization (${spec + 1}/${intermediateSpecs})`;
            let specOption = await helpers.dialog(specTitle, viableIntermediateSpecs, 'Which weapon specialization would you like to learn?', 'column');
            let item = await fromUuidSync(specOption), itemData = game.items.fromCompendium(item);
            await actor.createEmbeddedDocuments('Item', [itemData]);
        }
    }

    if (minorSpecs > 0) {
        for (let spec = 0; spec < minorSpecs; spec++) {
            let viableMinorSpecs = [];
            for (let item of items) {
                if (item.folder.name === 'Minor' && !helpers.getFeature(actor, item.name)) {
                    let itemRequirements = item.system.requirements;
                    viableMinorSpecs.push([`(${itemRequirements}) ${item.name}`, item.uuid]);
                }
            }

            if (viableMinorSpecs.length === 0) {
                await helpers.dialog('All Minor Specializations Learned', [['Ok', true]], 'You already know all minor weapon specialisations!');
                break;
            }

            let specTitle = 'Select a Weapon Specialization';
            if (minorSpecs > 1) specTitle = `Select a Weapon Specialization (${spec + 1}/${minorSpecs})`;
            let specOption = await helpers.dialog(specTitle, viableMinorSpecs, 'Which weapon specialization would you like to learn?', 'column');
            let item = await fromUuidSync(specOption), itemData = game.items.fromCompendium(item);
            await actor.createEmbeddedDocuments('Item', [itemData]);
        }
    }
}