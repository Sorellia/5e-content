import { helpers } from "../../../../helpers.js";

async function attack(workflow) {
    let args = workflow.args;
    workflow = workflow.workflow;
    let actor = workflow.actor;
    if (actor.flags?.dae?.onUpdateTarget && args[0].hitTargets.length > 0) {
        const isMarked = actor.flags.dae.onUpdateTarget.find(flag => flag.flagName === "Rite of Marking" && flag.sourceTokenUuid === args[0].hitTargetUuids[0]);
        let vitalSacrifice = actor.getFlag("5e-content", "vitalSacrifice.riteOfMarking") ?? false;
        if (isMarked) {
            workflow.advantage = true;
            if (vitalSacrifice) {
                let attackingItem = workflow.item;
                let itemData = {
                    'system': {
                        'critical': {
                            'threshold': 19
                        }
                    }
                };
                let updates = {
                    'embedded': {
                        'Item': {
                            [attackingItem.name]: itemData
                        }
                    }
                };
                let options = {
                    'permanent': false,
                    'name': attackingItem.name
                }
                await warpgate.mutate(fromUuidSync(args[0].tokenUuid), updates, {}, options);
            }
        }
    }
}

async function cleanUp(workflow) {
    let args = workflow.args;
    workflow = workflow.workflow;
    await helpers.hasMutation(fromUuidSync(args[0].tokenUuid),workflow.item.name,true);
}

export let riteOfMarking = {
    'attack': attack,
    'cleanUp': cleanUp
}