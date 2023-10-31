import { setupIntellectDie } from "../../../../classLevelupHandler.js";
import { helpers } from "../../../../helpers.js";
import { selectLanguage } from "../quickStudy.js";

export async function scholarlyPursuitCreationManager(item) {
    let ownerActor = item.parent;
    switch (item.name) {
        case 'Craftsmanship':
            await helpers.updateToolProf(ownerActor, 'jeweler', 'expertise');
            break;
        case 'Equestrianism':
            await helpers.updateSkillProf(ownerActor, 'Animal Handling');
            await ownerActor.update({'system.skills.ani.ability': 'int'});
            break;
        case 'Fencing':
            await helpers.updateWeaponProf(ownerActor, 'longsword');
            await helpers.updateWeaponProf(ownerActor, 'rapier');
            await helpers.updateWeaponProf(ownerActor, 'scimitar');
            break;
        case 'Linguistics':
            let intMod = ownerActor.system.abilities.int.mod;
            if (intMod < 1) return;
            for (let i = 0; i < intMod; i++) {
                await selectLanguage(ownerActor, false);
            }
            ownerActor.setFlag('5e-content', 'savant.linguistics.languagesGranted', intMod);
            break;
        case 'Marksmanship':
            await helpers.updateWeaponProf(ownerActor, 'blowgun');
            await helpers.updateWeaponProf(ownerActor, 'handcrossbow');
            await helpers.updateWeaponProf(ownerActor, 'heavycrossbow');
            await helpers.updateWeaponProf(ownerActor, 'longbow');
            await helpers.updateWeaponProf(ownerActor, 'net');
            break;
        case 'Meditation':
            let meditationStacks = ownerActor.getFlag('5e-content', 'savant.meditation') ?? 0;
            if (meditationStacks < 3) {
                await ownerActor.setFlag('5e-content', 'savant.meditation', meditationStacks + 1);
                await setupIntellectDie(ownerActor, true);
            }
            break;
        case 'Musicianship':
            await helpers.updateSkillProf(ownerActor, 'Performance');
            let musicalInstruments = [['Bagpipes', 'bagpipes'], ['Drums', 'drum'], ['Dulcimers', 'dulcimer'], ['Flutes', 'flute'], ['Horns', 'horn'], ['Lutes', 'lute'], ['Lyres', 'lyre'], ['Pan Flutes', 'panflute'], ['Shawms', 'shawm'], ['Viol', 'viol']];
            for (let i = 0; i < 3; i++) {
                let choice = await helpers.dialog(`Choose Instrument (${i + 1}/3)`, musicalInstruments, 'Choose an instrument to gain proficiency in.', 'column');
                musicalInstruments = filteredArray(musicalInstruments, choice);

                await helpers.updateToolProf(ownerActor, choice);
                await ownerActor.update({[`system.tools.${choice}.bonuses.check`]: '@abilities.int.mod'});
            }
            await ownerActor.update({[`system.skills.prf.bonuses.check`]: '@abilities.int.mod'});
            break;
        case 'Navigation':
            await helpers.updateToolProf(ownerActor, 'cartographer', 'expertise');
            await helpers.updateToolProf(ownerActor, 'navg', 'expertise');
            await helpers.updateToolProf(ownerActor, 'water', 'expertise');
            break;
        case 'Skill Mastery':
            let skillMastery = await helpers.dialog('Skill Mastery', [['Master a Skill', 'skill'], ['Master a Tool', 'tool']], 'Would you like to apply skill mastery to one of your skills, or a tool?');
            await selectSkillMastery(ownerActor, skillMastery);
            break;
        case 'Theology':
            await helpers.updateSkillProf(ownerActor, 'Religion');
            await helpers.updateLanguages(ownerActor, 'celestial');
            break;
        default:
            break;
    }
}

function filteredArray(arr, elem) {
	return arr.filter(function(item){
  		return !item.includes(elem);
  	});
}

async function selectSkillMastery(actor, skillOrTool) {
    switch (skillOrTool) {
        case 'skill':
            let configSkills = CONFIG.DND5E.skills, actorSkills = actor.system.skills, selectableSkills = [];
        
            for (let skill in actorSkills) {
                let skillMastery = actor.getFlag('5e-content', `savant.skillMastery.${skill}`) ?? false;
                if (actorSkills[skill].value > 0 && !skillMastery) {
                    selectableSkills.push([configSkills[skill].label, skill]);
                }
            }
            
            let chosenSkill = await helpers.dialog('Select a Skill', selectableSkills, 'Select a skill proficiency from the following to learn.', 'column');
            actor.setFlag('5e-content', `savant.skillMastery.${chosenSkill}`, true);
            break;
        case 'tool':
            let selectableTools = [], configTools = CONFIG.DND5E.toolIds, actorTools = actor.system.tools;
            let baseUuidString = 'Compendium.dnd5e.items.Item.';
            let vehicleProfs = {air: 'Air Vehicle', land: 'Land Vehicle', sea: 'Sea Vehicle', space: 'Space Vehicle'};
            configTools = {...configTools,...vehicleProfs};

            for (let tool in configTools) {
                let toolUuid = fromUuidSync(baseUuidString + configTools[tool]);
                let skillMastery = actor.getFlag('5e-content', `savant.skillMastery.${tool}`) ?? false;
                if (actorTools[tool] && !skillMastery) {
                    if (vehicleProfs[tool]) selectableTools.push([vehicleProfs[tool], tool]);
                    else selectableTools.push([toolUuid.name, tool]);
                }
            }

            let chosenTool = await helpers.dialog('Select a Tool', selectableTools, 'Select a tool proficiency from the following to improve with skill mastery.', 'column');
            actor.setFlag('5e-content', `savant.skillMastery.${chosenTool}`, true);
            break;
    }
}