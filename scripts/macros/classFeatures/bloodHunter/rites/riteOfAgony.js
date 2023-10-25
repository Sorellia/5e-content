import { helpers } from "../../../../helpers.js";
import { bloodHunter } from "../bloodHunter.js";

async function damage(workflow) {
    let args = workflow.args;
    console.log(args);
    let itemType = args[0].item?.type;
    let targetToken = args[0].tokenUuid;
    let sourceEffect = helpers.findEffect(fromUuidSync(targetToken).actor, 'Rite of Agony');
    if (!sourceEffect) sourceEffect = helpers.findEffect(fromUuidSync(targetToken).actor, 'Rite of Agony (Invoked)');
    let sourceItem = fromUuidSync(sourceEffect.origin);
    let sourceActor = sourceItem.parent;
    let bloodHunterDie = sourceActor.system.scale[`blood-hunter`][`blood-rite-die`].die;
    if (itemType != "weapon") return;
    
    let damageRoll = await bloodHunter.rollRiteDie(sourceActor, bloodHunterDie);
    await helpers.applyWorkflowDamage(fromUuidSync(targetToken),damageRoll,'necrotic',[targetToken],'Rite of Agony - Damage to Self (Necrotic)',args[0].itemCardId);
}

export let riteOfAgony = {
    'damage': damage
}