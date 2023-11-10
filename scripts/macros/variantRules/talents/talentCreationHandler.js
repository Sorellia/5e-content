import { actorEditorHelpers } from "../../../utility/actorEditorHelpers.js";

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
        default:
            break;
    }
}