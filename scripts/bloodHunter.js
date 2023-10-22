import { helpers } from "./helpers.js";
import { constants } from "./constants.js";

export let bloodHunter = {
    'rollRiteDie': async function _rollRiteDie(actor, riteDie, mode = 'vital-sacrifice') {
        // Roll the Blood Rite Dice twice.
        let firstRoll = await new Roll(riteDie).roll({async: true});
        let secondRoll = await new Roll(riteDie).roll({async: true});

        if (secondRoll.total === firstRoll.total) return firstRoll; // If the two rolls are identical, there is no point in proceeding further; return the 'primary roll'.
        
        // If the call-mode of the function is to initiate a vital sacrifice, proceed, else check if it's a vital control roll.
        if (mode === 'vital-sacrifice') {
            // Test the actor features to determine if they have the sanguine mastery class feature; if they do, test both die and return the lowest. If they don't, return the 'primary roll'.
            if (helpers.getFeature(actor, 'Sanguine Mastery')) {
                if (secondRoll.total > firstRoll.total) return firstRoll;
                else return secondRoll;
            } else return firstRoll;
        } else if (mode === 'vital-control') {
            // Test the actor features to determine if they have the vital control class feature; if they do, allow them to choose between both die in a dialog. Otherwise, return the 'primary roll'.
            if (helpers.getFeature(actor, 'Vital Control')) {
                if (helpers.getFeature(actor, 'Sanguine Mastery')) {
                    // If the actor has the sanguine mastery feature, check if removing the con mod of the actor would reduce both rolls to 1 or below. If true, return the 'primary roll'.
                    if (firstRoll.total - actor.system.abilities.con.mod <= 1 && secondRoll.total - actor.system.abilities.con.mod <= 1) return firstRoll;
                }
                // Format the rolls into a dialog and present it to the player, allowing them to determine what roll to use.
                const result = await helpers.dialog('Vital Control', [{label: `First Roll: ${firstRoll.total}`, value: true}, {label: `Second Roll: ${secondRoll.total}`, value: false}],'Which of these rite die rolls would you prefer to use?', 'row');
                if (result) return firstRoll;
                else return secondRoll;
            } else return firstRoll
        }
    },
    // Function to perform the actual vital sacrifice.
    'performVitalSacrifice': async function _performVitalSacrifice(itemCardId, riteDie, token) {
        let actor = token.actor;
        // Query the above function to determine what the vital sacrifice roll will be, and then subtract the con mod for the purposes of the active effect
        let damageRoll = await bloodHunter.rollRiteDie(actor, riteDie, 'vital-control');
        let totalDamage = damageRoll.total;

        if (actor.classes['blood-hunter']?.system?.levels >= 20) {
            totalDamage -= actor.system.abilities.con.mod;
            if (totalDamage < 1) totalDamage = 1;
            damageRoll.total = totalDamage;
        }
        // Determine if the actor already possesses one or more vital sacrifice stacks; if they do, increment the value for the number displayed after this stack
        let mutationFlag = 'vitalSacrifice';
        let mutationName = bloodHunter.buildStackingMutationName(actor, 'Vital Sacrifice', mutationFlag);

        let effectData = {
            'changes': [
                {
                    'key': 'system.attributes.hp.bonuses.overall',
                    'mode': 2,
                    'value': '-' + totalDamage,
                    'priority': 0
                }
            ],
            'icon': 'icons/magic/death/skull-horned-goat-pentagram-red.webp',
            'label': mutationName,
            'flags': {
                'dae': {
                    'specialDuration': [
                        'longRest'
                    ],
                    'stackable': 'multi',
                    'macroRepeat': 'none'
                },
                'effectmacro': {
                    'onDelete': {
                        'script': "actor.unsetFlag('5e-content', '" + mutationFlag + ".count')"
                    }
                }
            }
        };
        // Apply the effect to the actor and then roll the workflow damage on midi.
        await helpers.createEffect(actor, effectData);

        await helpers.applyWorkflowDamage(token, damageRoll, "none", [], "Vital Sacrifice", itemCardId);
    },
    // This and function immediately after handle determining what number of vital sacrifices have been made this long rest, so that each vital sacrifice is numbered differently.
    // TODO: work out a workflow to make this better; perhaps detecting an effect and then deleting and replacing that instead?
    'buildStackingMutationName': function _buildStackingMutationName(actor, mutationName, mutationFlag, setFlag = true) {
        mutationName = mutationName + " (";
        let mutationCount = 1;
        // Call the below function to determine how many vital sacrifices the actor has used so far, and then optionally set the flag to the next count to increment by 1, and rename the mutation.
        let currentMutationCount = bloodHunter.getMutationStacks(actor, mutationFlag);
        if (currentMutationCount >= mutationCount) mutationCount = currentMutationCount + 1;
        if (setFlag) actor.setFlag("5e-content", `${mutationFlag}.count`, mutationCount);
        return mutationName + mutationCount + ")";
    },
    // Check actor flags for the vital sacrifice count and return it.
    'getMutationStacks': function _getMutationStacks(actor, mutationFlag) {
        let currentMutationCount = actor.getFlag('5e-content', `${mutationFlag}.count`) ?? 0;
        return currentMutationCount;
    },
    // Supply the target token and whether or not the version is invoked, and the effect will be applied.
    'applyRiteEffects': async function _applyRiteEffects(workflow, targetToken, riteDie, invoked = false) {
        let effectData = await bloodHunter.lookupRiteEffect(workflow, riteDie, invoked);
        if (effectData !== false) await helpers.createEffect(targetToken.actor, effectData);
    },
    'lookupRiteEffect': async function _lookupRiteEffect(workflow, riteDie, invoked = false) {
        let riteLabel = workflow.item.name;
        let actor = workflow.actor;
        if(helpers.getFeature(actor, 'Sanguine Mastery')) riteDie = '2' + riteDie + 'kh1';
        if(invoked) riteLabel = riteLabel + ' (Invoked)';
        let effectData = {
            'duration': {'seconds': 12},
            'icon': workflow.item.img,
            'label': riteLabel,
            'origin': workflow.item.uuid,           
        };
        let riteName = workflow.item.name;
        let saveDC = helpers.getItemDC(workflow.item);
        switch (riteName) {
            case 'Rite of Agony':
                effectData.changes = [
                    {
                        'key': 'flags.midi-qol.disadvantage.ability.check.str',
                        'mode': 0,
                        'value': 1,
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.disadvantage.ability.check.dex',
                        'mode': 0,
                        'value': 1,
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.disadvantage.ability.save.str',
                        'mode': 0,
                        'value': 1,
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.disadvantage.ability.save.dex',
                        'mode': 0,
                        'value': 1,
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.onUseMacroName',
                        'mode': 0,
                        'value': 'function.sorelliaAutomations.macros.riteOfAgony.damage,preCheckHits',
                        'priority': 0
                    }
                ];
                effectData.flags = {
                    'dae': {
                        'specialDuration': ['turnEndSource']
                    }
                };
                if (invoked) {
                    effectData.changes = effectData.changes.concat([
                        {
                            'key': 'flags.midi-qol.OverTime',
                            'mode': 5,
                            'value': `turn=end,saveAbility=con,saveDC=${saveDC}`,
                            'priority': 0
                        }
                    ]);
                    effectData.duration.seconds = 60;
                    effectData.flags.dae.specialDuration.splice(0,1);
                }
                break;
            case 'Rite of Anxiety':
                effectData.duration.seconds = 60;
                if (invoked) {
                    effectData.changes = [
                        {
                            'key': 'flags.midi-qol.disadvantage.ability.save.int',
                            'mode': 0,
                            'value': 1,
                            'priority': 0
                        },
                        {
                            'key': 'flags.midi-qol.disadvantage.ability.save.wis',
                            'mode': 0,
                            'value': 1,
                            'priority': 0
                        },
                        {
                            'key': 'flags.midi-qol.disadvantage.ability.save.cha',
                            'mode': 0,
                            'value': 1,
                            'priority': 0
                        }
                    ];
                    effectData.duration.seconds = 12;
                    effectData.flags = {
                        'dae': {
                            'specialDuration': ['turnEndSource', 'isSave']
                        }
                    };
                }
                break;
            case 'Rite of Binding':
                effectData.changes = [
                    {
                        'key': 'system.attributes.movement.all',
                        'mode': 0,
                        'value': 0,
                        'priority': 0
                    },
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Reaction',
                        'priority': 0
                    }
                ];
                effectData.flags = {
                    'dae': {
                        'specialDuration': ['turnEndSource']
                    }
                };
                if (invoked) {
                    effectData.changes = effectData.changes.concat([
                        {
                            'key': 'flags.midi-qol.OverTime',
                            'mode': 5,
                            'value': `turn=end,saveAbility=con,saveDC=${saveDC}`,
                            'priority': 0
                        }
                    ]);
                    effectData.duration.seconds = 60;
                    effectData.flags.dae.specialDuration.splice(0,1);
                }
                break;
            case 'Rite of Blindness':

            case 'Rite of Confusion':
                effectData.changes = [
                    {
                        'key': 'flags.midi-qol.concentrationSaveBonus',
                        'mode': 2,
                        'value': `-${riteDie}`,
                        'priority': 0
                    }
                ];
                effectData.flags = {
                    'dae': {
                        'specialDuration': ['turnEndSource']
                    }
                };
                if (invoked) {
                    effectData.duration.seconds = 600;
                    effectData.flags.dae.specialDuration.splice(0,1);
                }
                break;
            case 'Rite of Corrosion':
                effectData.changes = [
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Poisoned',
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.OverTime',
                        'mode': 5,
                        'value': `turn=end,saveAbility=con,saveDC=${saveDC}`,
                        'priority': 0
                    }
                ];
                effectData.duration.seconds = 60;
                if (invoked) {
                    effectData.changes[1].value = `turn=end,saveAbility=con,saveDC=${saveDC},label=${workflow.item.name},damageBeforeSave=false,damageRoll=2${riteDie},damageType=necrotic`
                }
                break;
            case 'Rite of Decay':

            case 'Rite of Exposure':

            case 'Rite of Exsanguination':

            case 'Rite of Fear':
                effectData.changes = [
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Frightened',
                        'priority': 0
                    }
                ];
                effectData.duration.seconds = 60;
                if (invoked) {
                    effectData.changes[0].value = 'Stunned';
                }
                break;
            case 'Rite of Marking':
                if (invoked) actor.setFlag('5e-content','vitalSacrifice.riteOfMarking',true);
                effectData = false;
                break;
            case 'Rite of Nightmares':
                effectData.changes = [
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Frightened',
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.OverTime',
                        'mode': 5,
                        'value': `turn=end,saveAbility=wis,saveDC=${saveDC},damageBeforeSave=false,damageRoll=4${riteDie},damageType=psychic`,
                        'priority': 0
                    }
                ];
                effectData.duration.seconds = 60;
                if (invoked) {
                    effectData.changes[0].value = 'Incapacitated'
                    effectData.changes = effectData.changes.concat([
                        {
                            'key': 'system.attributes.movement.all',
                            'mode': 0,
                            'value': 0,
                            'priority': 0
                        }
                    ])
                }
                break;
            case 'Rite of Revelation':

            case 'Rite of Siphoning':
                effectData = false;
            case 'Rite of the Puppet':
                effectData.changes = [
                    {
                        'key': 'system.attributes.hp.value',
                        'mode': 2,
                        'value': 1,
                        'priority': 0
                    }
                ];
                effectData.flags = {
                    'dae': {
                        'specialDuration': ['1Attack']
                    }
                };
                if (invoked) {
                    effectData.changes = effectData.changes.concat([
                        {
                            'key': 'system.bonuses.All-Attacks',
                            'mode': 2,
                            'value': `${riteDie}`,
                            'priority': 0
                        },
                        {
                            'key': 'system.bonuses.All-Damage',
                            'mode': 2,
                            'value': `${riteDie}`,
                            'priority': 0
                        }
                    ]);
                }
                break;
            case 'Rite of the Senseless':
                effectData.changes = [
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Blinded',
                        'priority': 0
                    },
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Deafened',
                        'priority': 0
                    },
                    {
                        'key': 'macro.CE',
                        'mode': 0,
                        'value': 'Inaudible',
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.fail.spell.vocal',
                        'mode': 0,
                        'value': 1,
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.fail.spell.verbal',
                        'mode': 0,
                        'value': 1,
                        'priority': 0
                    },
                    {
                        'key': 'flags.midi-qol.OverTime',
                        'mode': 5,
                        'value': `turn=end,saveAbility=con,saveDC=${saveDC}`,
                        'priority': 0
                    }
                ];
                effectData.duration.seconds = 60;
                if (invoked) {
                    effectData.changes = effectData.changes.concat([
                        {
                            'key': 'system.attributes.movement.all',
                            'mode': 0,
                            'value': 0,
                            'priority': 0
                        }
                    ]);
                }
                break;
            default:
                effectData = false;
        }
        return effectData;
    },
    // Prompt the actor for a vital sacrifice; takes on the actor to be inspected, its token, the item calling the prompt and if it must be accepted to use the item.
    'vitalSacrificePrompt': async function _vitalSacrificePrompt(actor, token, item, neededForItemUse = false, sizeConstraint = false, updateUses = true) {
        // Generate two different messages, depending on if this vital sacrifice is required or not.
        let vitalSacMessage = 'Would you like to make a Vital Sacrifice to improve this rite?';
        if (neededForItemUse) vitalSacMessage = 'You cannot use this rite without a Vital Sacrifice, which can also bolster it. Make a Vital Sacrifice?'
        if (neededForItemUse && sizeConstraint) vitalSacMessage = 'You cannot use this rite on that target without a Vital Sacrifice, as they are too big. Make a Vital Sacrifice?'
        // Call the helper dialog function to ask the player to vital sacrifice
        const result = await helpers.dialog('Vital Sacrifice', constants.yesNo, vitalSacMessage, 'row');

        if (result && neededForItemUse) { // If the player chose YES and the item MUST have a vital sacrifice to operate.
            actor.setFlag('5e-content', 'vitalSacrifice.proceed', true);
            if (updateUses) await helpers.updateItemUses(token.document, item, 1);
            return true;
            // Set the flag appropriate to vital sacrifice, so that the later workflow can detect that it must be used. Update the item's uses to allow it to be used, and then return true to allow the workflow to continue.
        } else if (result && !neededForItemUse) { // If the player chose YES but the item does NOT require a vital sacrifice to operate.
            actor.setFlag('5e-content', 'vitalSacrifice.proceed', true);
            bloodHunter.vitalControlPrompt(actor);
            return true;
            // Set the flag appropriate to vital sacrifice, and test for vital control before returning true, to allow the workflow to continue.
        } else if (!result && !neededForItemUse) { // If the player chose NO but the item does NOT require a vital sacrifice to operate.
            actor.setFlag('5e-content', 'vitalSacrifice.proceed', false);
            return true;
            // Set the flag to disallow vital sacrifice and return true, to allow the workflow to continue.
        } else return false;
        // Otherwise, the player chose NO, and the item MUSt have a vital sacrifice to operate, in which case cancel the workflow.
    },
    // If a vital control prompt was issued (in the second case above), pass it the actor and it will figure out if that actor has vital control or not.
    'vitalControlPrompt': async function _vitalControlPrompt(actor) {
        // Test for the actor having vital control, and if they do, whether or not it has 0 uses.
        let vitalControl = helpers.getFeature(actor, 'Vital Control');
        let controlUses = vitalControl?.system?.uses?.value;
        if (!vitalControl || controlUses === 0) return;
        // If the actor has vital control and it has uses remaining, prompt them on if they would like to use it.
        const result = await helpers.dialog('Vital Control', constants.yesNo, 'Would you like to invoke this vital sacrifice without paying the cost, using vital control? You can only do this <b>once</b> per long rest.', 'row');
        if (result) {
            // If the actor chose to use vital control, set the appropirate flag and deduct a use from vital control to deplete it to 0 charges.
            await helpers.updateItemUses(token.document, vitalControl, -1);
            actor.setFlag('5e-content', 'vitalControl.proceed', true);
        }
    },
    // Should take place before the item is rolled for all rites; determines if a vital sacrifice is required to use the rite or not (and handles edge-cases like the rite of exsanguination).
    'determineVitalSacrifice': async function _determineVitalSacrifice(args) {
        let item = args.item;
        let actor = args.actor;
        let token = args.token;
        let target = args.args[0].targets[0];
        let itemUses = item.system.uses.value;
        let targetSize = helpers.getSize(target.actor);
        // Coverage for the specific interaction of rite of the puppet needing a low-hp target.
        if (item.name === 'Rite of the Puppet' && target.actor.attributes.hp.value !== 0) {
            ui.notifications.warn("Target has HP remaining and is not a valid target!");
            return false;
        }
        // Coverage for the specific interaction of rite of binding being unusable without a vital sac against a huge or gargantuan target.
        if (item.name === 'Rite of Binding' && targetSize > 3) {
            let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(actor, token, item, true, true);
            if (!vitalSacrifice) return false;
        }
        // If the item has no uses and it isn't the rite of exsanguination (which cannot be invoked at 0 uses), tell the player that they MUST use a vital sacrifice to use the rite.
        if (itemUses === 0 && item.name !== "Rite of Exsanguination") {
            let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(actor, token, item, true);
            if (!vitalSacrifice) return false;
        } else await bloodHunter.vitalSacrificePrompt(actor, token, item);
    },
    'getTargetFromSingleSet': async function _getTargetFromSingleSet(set) {
        let target;
        let iterator = set.entries();

        for (const entry of iterator) {
            target = entry;
            target = target[0];
        }
        return target;
    },
    // Should take place before active effects on all rites; parses whether or not a vital sacrifice is required, or if a vital control is available.
    'vitalSacrificeOrControl': async function _vitalSacrificeOrControl(args) {
        // Setup general workflow items for the rest of the functionality.
        let token = args.token;
        let actor = token.actor;
        let workflow = args.workflow;
        let targets = workflow.failedSaves;
        let riteDice = actor.system.scale[`blood-hunter`][`blood-rite-die`];
        let applyRites = false;
        let target;
        if (targets.size === 1) { 
            applyRites = true; // If there is exactly 1 target, allow the application of rite effects
            target = await bloodHunter.getTargetFromSingleSet(targets);
            target = target.document;
        }
        // Pull in the flags for vital sac and vital control; set to false if no flag is present.
        let vitalSacrifice = actor.getFlag('5e-content', 'vitalSacrifice.proceed') ?? false;
        let vitalControl = actor.getFlag('5e-content', 'vitalControl.proceed') ?? false;
        // If vital control was used, unset vital sacrifice and remove both flags.
        if (vitalControl) {
            vitalSacrifice = "undefined";
            actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
            actor.unsetFlag('5e-content', 'vitalControl.proceed');
            if (applyRites) bloodHunter.applyRiteEffects(workflow, target, riteDice.die, true);
        // Else, if vital sacrifice was called for, call the function to roll a vital sacrifice, and unset the vital sacrifice flag.
        } else if (vitalSacrifice) {
            await bloodHunter.performVitalSacrifice(workflow.itemCardId, riteDice.die, token);
            actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
            if (applyRites) bloodHunter.applyRiteEffects(workflow, target, riteDice.die, true);
        } else {
            if (applyRites) bloodHunter.applyRiteEffects(workflow, target, riteDice.die);
        }
    }
}