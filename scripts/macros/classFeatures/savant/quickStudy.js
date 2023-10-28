import { constants } from "../../../constants.js";
import { helpers } from "../../../helpers.js";

async function selectLanguage(actor) {
    let selectableLanguages = [], actorLangArray = [], configLanguages = CONFIG.DND5E.languages, actorLanguages = actor.system.traits.languages.value
    const iterator = actorLanguages.entries();
    for (const entry of iterator) {
        let actorLang = entry[0];
        actorLangArray.push(actorLang);
    }

    let forbiddenLanugages = ['cant'];
    for (let language in configLanguages) {
        if (!forbiddenLanugages.includes(language) && !actorLangArray.includes(language)) {
            selectableLanguages.push([configLanguages[language], language]);
        }
    }

    let chosenLanguage = await helpers.dialog('Select a Language', selectableLanguages, 'Select a language from the following to learn.', 'column');
    await helpers.updateLanguages(actor, chosenLanguage);

    actor.setFlag('5e-content', 'savant.quickStudy.prof', chosenLanguage);
    actor.setFlag('5e-content', 'savant.quickStudy.label', configLanguages[chosenLanguage]);
}

async function selectTool(actor) {
    let selectableTools = [], configTools = CONFIG.DND5E.toolIds, actorTools = actor.system.tools;
    let baseUuidString = 'Compendium.dnd5e.items.Item.';
    
    for (let tool in configTools) {
        let toolUuid = fromUuidSync(baseUuidString + configTools[tool]);
        if (!actorTools[tool]) selectableTools.push([toolUuid.name, tool]);
    }

    let chosenTool = await helpers.dialog('Select a Tool', selectableTools, 'Select a tool from the following to learn.', 'column');
    await helpers.updateToolProf(actor, chosenTool, 'proficient');

    actor.setFlag('5e-content', 'savant.quickStudy.prof', chosenTool);
    actor.setFlag('5e-content', 'savant.quickStudy.label', fromUuidSync(baseUuidString + configTools[chosenTool]).name);
}

async function selectSkill(actor) {
    let configSkills = CONFIG.DND5E.skills, actorSkills = actor.system.skills, selectableSkills = [];

    for (let skill in actorSkills) {
        if (actorSkills[skill].value === 0) {
            selectableSkills.push([configSkills[skill].label, skill]);
        }
    }
    let chosenSkill = await helpers.dialog('Select a Skill', selectableSkills, 'Select a skill from the following to learn.', 'column');
    
    await helpers.updateSkillProf(actor, chosenSkill, 'proficient');
    actor.setFlag('5e-content', 'savant.quickStudy.prof', chosenSkill);
    actor.setFlag('5e-content', 'savant.quickStudy.label', configSkills[chosenSkill].label);
}

async function selectWeaponProf(actor) {
    let selectableWeapons = [], actorWeaponArray = [], configWeapons = CONFIG.DND5E.weaponIds, actorWeapons = actor.system.traits.weaponProf.value;
    let baseUuidString = 'Compendium.dnd5e.items.Item.';
    
    const iterator = actorWeapons.entries();
    for (const entry of iterator) {
        let weaponCategories = ['sim', 'mar'];
        let actorWeap = entry[0];
        if (!weaponCategories.includes(actorWeap)) actorWeaponArray.push(actorWeap);
    }
    
    for (let weapon in configWeapons) {
        let weaponData = fromUuidSync(baseUuidString + configWeapons[weapon]);
        if (!actorWeaponArray.includes(weapon)) {
            let weaponType = weaponData.system.weaponType;
            let forbiddenTypes = ['simpleR', 'simpleM'];
            if (!forbiddenTypes.includes(weaponType) && weaponData.name != 'Shortsword') {
                selectableWeapons.push([weaponData.name, weapon]);
            }
        }
    }
    
    let chosenWeapon = await sorelliaAutomations.helpers.dialog('Select a Weapon', selectableWeapons, 'Select a weapon proficiency from the following to learn.', 'column');
    await helpers.updateWeaponProf(actor, chosenWeapon);

    actor.setFlag('5e-content', 'savant.quickStudy.prof', chosenWeapon);
    actor.setFlag('5e-content', 'savant.quickStudy.label', fromUuidSync(baseUuidString + configWeapons[chosenWeapon]).name);
}

export async function quickStudy(actor) {
    let quickStudy = helpers.getFeature(actor, 'Quick Study');
    if (!quickStudy) return;
    let keepPrev, previousProf = actor.getFlag('5e-content', 'savant.quickStudy.prof') ?? false;
    if (previousProf) {
        let previousProfLabel = actor.getFlag('5e-content', 'savant.quickStudy.label'); 
        keepPrev = await helpers.dialog('Quick Study: Previous Proficiency Found', [['Keep It', true], ['Choose a New Proficiency', false]], `Your previous Quick Study choice was ${previousProfLabel}. Would you like to keep this proficiency, or choose a new one?`);
        if (!keepPrev) {
            let previousProfType = actor.getFlag('5e-content', 'savant.quickStudy.type');
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
            actor.unsetFlag('5e-content', 'savant.quickStudy.type');
            actor.unsetFlag('5e-content', 'savant.quickStudy.prof');
            actor.unsetFlag('5e-content', 'savant.quickStudy');
        }
    }
    if (!keepPrev) {
        let choices = await helpers.dialog('Quick Study', [['Language', 'language'], ['Skill', 'skill'], ['Tool', 'tool'], ['Weapon', 'weapon']], 'You may learn a single type of proficiency. Which would you like to choose from?', 'column');

        switch (choices) {
            case 'language':
                await selectLanguage(actor);
                break;
            case 'skill':
                await selectSkill(actor);
                break;
            case 'tool':
                await selectTool(actor);
                break;
            case 'weapon':
                await selectWeaponProf(actor);
                break;
            default:
                break;
        }
        actor.setFlag('5e-content', 'savant.quickStudy.type', choices);
    }
}