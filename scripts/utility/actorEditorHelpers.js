import { helpers } from "../helpers.js";

async function selectLanguage(actor, filterLanguages = [], forbiddenLanugages = ['druidic', 'cant'], cycles = 1) {
    for (let i = 0; i < cycles; i++) {
        let selectableLanguages = [], actorLangArray = [], configLanguages = CONFIG.DND5E.languages, actorLanguages = actor.system.traits.languages.value
        const iterator = actorLanguages.entries();
        for (const entry of iterator) {
            let actorLang = entry[0];
            actorLangArray.push(actorLang);
        }
        
        for (let language in configLanguages) {
            if (!forbiddenLanugages.includes(language) && !actorLangArray.includes(language)) {
                if (filterLanguages.length === 0 || filterLanguages.includes(configLanguages[language])) selectableLanguages.push([configLanguages[language], language]);
            }
        }
    
        let chosenLanguage = await helpers.dialog('Select a Language', selectableLanguages, 'Select a language from the following to learn.', 'column');
        if (chosenLanguage) await helpers.updateLanguages(actor, chosenLanguage);
    
        if (cycles === 1) return [chosenLanguage, configLanguages[chosenLanguage]];
    }
}

async function selectTool(actor, filterTools = [], cycles = 1) {
    for (let i = 0; i < cycles; i++) {
        let selectableTools = [], configTools = CONFIG.DND5E.toolIds, actorTools = actor.system.tools;
        let baseUuidString = 'Compendium.dnd5e.items.Item.';
        let vehicleProfs = {air: 'Air Vehicle', land: 'Land Vehicle', sea: 'Sea Vehicle', space: 'Space Vehicle'};
        configTools = {...configTools,...vehicleProfs};

        for (let tool in configTools) {
            let toolUuid = fromUuidSync(baseUuidString + configTools[tool]);
            if (!actorTools[tool]) {
                if (vehicleProfs[tool] && (filterTools.length === 0 || filterTools.includes(vehicleProfs[tool]))) selectableTools.push([vehicleProfs[tool], tool]);
                else if (filterTools.length === 0 || filterTools.includes(toolUuid.name)) selectableTools.push([toolUuid.name, tool]);
            }
        }

        let chosenTool = await helpers.dialog('Select a Tool', selectableTools, 'Select a tool proficiency from the following to learn.', 'column');
        if (chosenTool) await helpers.updateToolProf(actor, chosenTool, 'proficient');

        if (vehicleProfs[chosenTool] && cycles === 1) return [chosenTool, vehicleProfs[chosenTool]];
        else if (cycles === 1) return [chosenTool, fromUuidSync(baseUuidString + configTools[chosenTool]).name];
    }
}

async function selectSkill(actor, filterSkills = [], cycles = 1) {
    for (let i = 0; i < cycles; i++) {
        let configSkills = CONFIG.DND5E.skills, actorSkills = actor.system.skills, selectableSkills = [];

        for (let skill in actorSkills) {
            if (actorSkills[skill].value === 0 && (filterSkills.length === 0 || filterSkills.includes(configSkills[skill].label))) {
                selectableSkills.push([configSkills[skill].label, skill]);
            }
        }
        
        let chosenSkill = await helpers.dialog('Select a Skill', selectableSkills, 'Select a skill proficiency from the following to learn.', 'column');
        if (chosenSkill) await helpers.updateSkillProf(actor, chosenSkill, 'proficient');

        if (cycles === 1) return [chosenSkill, configSkills[chosenSkill].label];
    }
}

async function selectWeaponProf(actor, filterWeapons = [], forbiddenWeapons = [], cycles = 1) {
    for (let i = 0; i < cycles; i++) {
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
                if (forbiddenWeapons.length === 0 || (!forbiddenWeapons.includes(weaponType) && !forbiddenWeapons.includes(weaponData.name))) {
                    if (filterWeapons.length === 0 || filterWeapons.includes(weaponData.name)) selectableWeapons.push([weaponData.name, weapon]);
                }
            }
        }
        
        let chosenWeapon = await helpers.dialog('Select a Weapon', selectableWeapons, 'Select a weapon proficiency from the following to learn.', 'column');
        if (chosenWeapon) await helpers.updateWeaponProf(actor, chosenWeapon);

        if (cycles === 1) return [chosenWeapon, fromUuidSync(baseUuidString + configWeapons[chosenWeapon]).name];
    }
}

export let actorEditorHelpers = {
    'selectLanguage': selectLanguage,
    'selectSkill': selectSkill,
    'selectTool': selectTool,
    'selectWeapon': selectWeaponProf
}