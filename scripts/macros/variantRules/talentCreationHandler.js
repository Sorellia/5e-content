import { helpers } from "../../helpers.js";
import { actorEditorHelpers } from "../../utility/actorEditorHelpers.js";

export async function talentItemAddition(item) {
    let ownerActor = item.parent;
    switch (item.name) {
        case 'Free Stride':
            await ownerActor.update({'system.attributes.movement.walk': ownerActor.system.attributes.movement.walk + 10})
            break;
        case 'Colossus':
            await ownerActor.setFlag('dnd5e', 'powerfulBuild', true);
            break;
        case 'Cultured':
            await actorEditorHelpers.selectLanguage(ownerActor, [], ['druidic', 'cant'], 2);
            break;
        case 'Linguist':
            await actorEditorHelpers.selectLanguage(ownerActor, [], ['druidic', 'cant'], 3);
            break;
        case 'Martial Casting':
            await ownerActor.setFlag('midi-qol', 'advantage.concentration', true);
            break;
        case 'Tactician':
            let int = ownerActor.system.abilities.int.mod, wis = ownerActor.system.abilities.wis.mod;
            let selection = await helpers.dialog('Select an Initative Score', [['Intelligence', 'int'], ['Wisdom', 'wis']], `Your scores are as follows:\n<b>Intelligence:</b> ${int}\n<b>Wisdom:</b> ${wis}\n\nWhich would you like to base your initiative off of?`);
            await ownerActor.update({'system.attributes.init.ability': selection});
            break;
        default:
            break;
    }
}