import { helpers } from "./helpers.js";
import { quickStudy } from "./macros/classFeatures/savant/quickStudy.js";

export async function itemCreationHandler(item) {
    let ownerActor = item.parent;
    switch (item.name) {
        case 'Wondrous Intellect':
            let wondrousIntellectUpdates = {
                'system.abilities.int.bonuses.check': '@scale.savant.intellect-die',
                'system.abilities.int.bonuses.save': '@scale.savant.intellect-die',
                'system.abilities.wis.bonuses.check': '@scale.savant.intellect-die',
                'system.abilities.wis.bonuses.save': '@scale.savant.intellect-die'
            }

            await ownerActor.update(wondrousIntellectUpdates);
            break;
        case 'Predictive Defense':
            let int = ownerActor.system.abilities.int.mod;
            let maxInt = ownerActor.system.attributes.ac.equippedArmor?.system?.armor?.dex ?? int + 1;
            if (int > maxInt) int = maxInt;
            let acUpdates = {
                'system.attributes.ac.calc': 'custom',
                'system.attributes.ac.formula': `@attributes.ac.armor + ${int}`
            }

            await ownerActor.update(acUpdates);
            break;
        case 'Quick Study':
            await quickStudy(ownerActor);
        case 'Student of Runes':
            await helpers.updateSkillProf(ownerActor, 'History', 'expertise');
            await helpers.updateToolProf(ownerActor, 'calligrapher', 'expertise');
            break;
        case 'Undisputed Genius':
            let intValue = ownerActor.system.abilities.int.value;
            let modifiedValue = intValue + 4;
            await ownerActor.update({'system.abilities.int.value': modifiedValue});
        case 'Unyielding Will':
            let unyieldingWillUpdates = {
                'system.abilities.cha.proficient': 1,
                'system.abilities.cha.bonuses.save': '@scale.savant.intellect-die',
                'flags.midi-qol.superSaver.int': 1,
                'flags.midi-qol.superSaver.wis': 1,
                'flags.midi-qol.superSaver.cha': 1
            }

            await ownerActor.update(unyieldingWillUpdates);
            break;
        case 'Accelerated Reflexes':
            await ownerActor.update({'system.attributes.init.bonus': ownerActor.system.abilities.int.mod});
            break;
        default:
            break;
    }
}

export async function itemUpdateHandler(item, changes) {
    let equipped = changes.system?.equipped ?? false;
    let ownerActor = item.parent;
    let armorTypes = ['light', 'medium', 'heavy'];
    let armorType = item.system.armor?.type ?? 'undefined'
    if (!helpers.getFeature(ownerActor, 'Predictive Defense') || !armorTypes.includes(armorType)) return;
    let int, maxInt, acUpdates = {};
    let wornArmorName = ownerActor.system.attributes.ac.equippedArmor?.name ?? item.name;
    if (wornArmorName != item.name) return;
    if (equipped) {
        int = ownerActor.system.abilities.int.mod;
        maxInt = item.system.armor.dex ?? int + 1;
        if (int > maxInt) int = maxInt;
        acUpdates = {
            'system.attributes.ac.formula': `@attributes.ac.armor + ${int}`
        }
        await ownerActor.update(acUpdates);
    } else {
        int = ownerActor.system.abilities.int.mod;
        acUpdates = {
            'system.attributes.ac.formula': `@attributes.ac.armor + ${int}`
        }
        await ownerActor.update(acUpdates);
    }
}