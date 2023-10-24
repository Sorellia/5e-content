import { helpers } from "./helpers.js";
import { constants } from "./constants.js";

export let bloodHunter = {
    'rollRiteDie': async function _rollRiteDie(actor, riteDie, mode = 'vital-sacrifice') {
        // Roll the Blood Rite Dice two separate times, for comparisons
        let firstRoll = await new Roll(riteDie).roll({async: true});
        let secondRoll = await new Roll(riteDie).roll({async: true});

        if (secondRoll.total === firstRoll.total) return firstRoll; // If the two rolls are identical, there is no point in proceeding further; return the first roll
        
        // If the call-mode of the function is to initiate a vital sacrifice, proceed, else check if it's a vital control roll
        if (mode === 'vital-sacrifice') {
            // Test the actor features to determine if they have the sanguine mastery class feature; if they do, test both die and return the lowest
            if (helpers.getFeature(actor, 'Sanguine Mastery')) {
                if (secondRoll.total > firstRoll.total) return firstRoll;
                else return secondRoll;
            } else return firstRoll;
        } else if (mode === 'vital-control') {
            // Test the actor features to determine if they have the vital control class feature; if they do, allow them to choose between both die in a dialog.
            // Otherwise, return the first roll
            if (helpers.getFeature(actor, 'Vital Control')) {
                if (helpers.getFeature(actor, 'Sanguine Mastery')) {
                    // If the actor has the sanguine mastery feature, check if removing the con mod of the actor would reduce both rolls to 1 or below. If true,
                    // return the first roll
                    if (firstRoll.total - actor.system.abilities.con.mod <= 1 && secondRoll.total - actor.system.abilities.con.mod <= 1) return firstRoll;
                }
                // Format the rolls into a dialog and present it to the player, allowing them to determine what roll to use
                let data = [[`First Roll: ${firstRoll.total}`, true], [`Second Roll: ${secondRoll.total}`, false]];
                let firstOwner = helpers.firstOwner(actor);
                const result = await helpers.remoteDialog('Vital Control', data, firstOwner.id,'Which of these rite die rolls would you prefer to use?', 'row');
                if (result) return firstRoll;
                else return secondRoll;
            // If they don't, return the first roll
            } else return firstRoll
        }
    },
    // Function to perform the actual vital sacrifice
    'performVitalSacrifice': async function _performVitalSacrifice(itemCardId, riteDie, token) {
        let actor = token.actor;
        // Query the above function to determine what the vital sacrifice roll will be, and then subtract the con mod for the purposes of the active effect
        let damageRoll = await bloodHunter.rollRiteDie(actor, riteDie, 'vital-control');
        let totalDamage = damageRoll.total;

        // This function covers the other half of the sanguine mastery feature, subtracting the con mod of the actor and clamping the final value to a minimum of 1
        if (helpers.getFeature(actor, 'Sanguine Mastery')) {
            totalDamage -= actor.system.abilities.con.mod;
            if (totalDamage < 1) totalDamage = 1;
            damageRoll.total = totalDamage;
        }
        // Attempt to pull data from the actor for any vital sacrifice effects; if they have one, we can modify that instead of making a deluge of effects for each sacrifice
        let existingSacrifice = helpers.findEffect(actor, 'Vital Sacrifice');
        if (existingSacrifice) { // If they have an effect for a previous vital sacrifice
            let previousDamage = existingSacrifice.changes[0].value; // All vital sacrifice effects are formatted the same; this pulls the current total hp reduction amount,
            // and the below adds the new reduction to it
            totalDamage = previousDamage - totalDamage;
            // Format an update to the changes and also the on-delete script; this latter change is needed to refund the 'locked up' hitpoints from the vital sacrifice effect
            let updates = {
                'changes': [
                    {
                        'key': 'system.attributes.hp.bonuses.overall',
                        'mode': 2,
                        'value': totalDamage,
                        'priority': 0
                    }
                ],
                'flags': {
                    'effectmacro': {
                        'onDelete': {
                            'script': "actor.unsetFlag('5e-content', 'vitalSacrifice');\nlet hpReset = actor.system.attributes.hp.value + " + Math.abs(totalDamage) + ";\nawait actor.update({'system.attributes.hp.value': hpReset});"
                        }
                    }
                }
            };
            // Update the existing effect with the new information
            await helpers.updateEffect(existingSacrifice, updates);
        }
        if (!existingSacrifice) { // If they do not have an effect; this is the first vital sacrifice
            // Setup the full effect data, including the hp bonus change, and the script; see above for why it's necessary
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
                'name': 'Vital Sacrifice',
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
                            'script': "actor.unsetFlag('5e-content', 'vitalSacrifice');\nlet hpReset = actor.system.attributes.hp.value + " + Math.abs(totalDamage) + ";\nawait actor.update({'system.attributes.hp.value': hpReset});"
                        }
                    }
                }
            };
            // Create the effect on the actor
            await helpers.createEffect(actor, effectData);
        }
        // Roll the workflow damage via midi to 'present it', and update the actor to actually apply the damage automatically
        await helpers.applyWorkflowDamage(token, damageRoll, "none", [], "Vital Sacrifice", itemCardId);
        let hpUpdate = actor.system.attributes.hp.value - damageRoll.total;
        await actor.update({'system.attributes.hp.value': hpUpdate});
    },
    // Supply the target token and whether or not the version is invoked, and the effect will be applied.
    'applyRiteEffects': async function _applyRiteEffects(workflow, targetToken, riteDie, invoked = false) {
        let effectData = await bloodHunter.lookupRiteEffect(workflow, targetToken, riteDie, invoked);
        if (effectData !== false) await helpers.createEffect(targetToken.actor, effectData);
    },
    // Contained within this function are lookup tables for what each and every rite should do. Some will return false on the effect data, which tells the above function
    // to skip applying an effect; this might be because they don't apply an effect unless invoked, or their functionality is covered elsewhere
    'lookupRiteEffect': async function _lookupRiteEffect(workflow, target, riteDie, invoked = false) {
        // Setup initial variables needed by most-all of the rites; the name of the rite, the actor, the save DC of the rite, and the correct ritedie size and
        // label addition if the rite is invoked or the blood hunter has the sanguine mastery feature which lets you roll twice and keep the highest value on all rolls
        let riteLabel = workflow.item.name;
        let actor = workflow.actor;
        let saveDC = helpers.getItemDC(workflow.item);
        if(helpers.getFeature(actor, 'Sanguine Mastery')) riteDie = '2' + riteDie + 'kh1';
        if(invoked) riteLabel = riteLabel + ' (Invoked)';

        // Setup 'generic' effect data; all effects modify this to achieve their results
        let effectData = {
            'duration': {'seconds': 12},
            'icon': workflow.item.img,
            'label': riteLabel,
            'origin': workflow.item.uuid,           
        };

        // The 'modified' rite name is useless to the rest of this function; call a switch case on the actual name of the item being rolled, to determine which rite it is
        switch (workflow.item.name) {
            // Each case statement contains specific automation for that rite; in most cases that is just a pair of effectData modifications
            // But in some cases more significant automations for a specific effect are made here, followed by returning false on the effectData to not apply an effect
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
                effectData = false;
                break;                
            case 'Rite of Confusion':
                let conc = helpers.findEffect(target.actor, 'Concentrating');
                let concAdditions = {
                    'flags': {
                        'effectmacro': {
                            'onDelete': {
                                'script': `let effect = sorelliaAutomations.helpers.findEffect(actor, '${riteLabel}');\nsorelliaAutomations.helpers.removeEffect(effect);`
                            }
                        }
                    }
                }
                helpers.updateEffect(conc, concAdditions);
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
                if (!invoked) effectData = false;
                if (invoked) {
                    effectData.changes = [
                        {
                            'key': 'system.traits.dr.value',
                            'mode': 0,
                            'value': `-necrotic`,
                            'priority': 0
                        }
                    ];
                    effectData.duration = {};
                    effectData.flags = {
                        'dae': {
                            'specialDuration': ['turnEndSource', 'isDamaged']
                        }
                    };
                    if (helpers.checkTrait(target.actor, 'di', 'necrotic')) {
                        effectData.changes = [
                            {
                                'key': 'system.traits.di.value',
                                'mode': 0,
                                'value': `-necrotic`,
                                'priority': 0
                            },
                            {
                                'key': 'system.traits.dr.value',
                                'mode': 0,
                                'value': `necrotic`,
                                'priority': 0
                            }
                        ];

                    }
                }
                break;
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
                actor.setFlag("5e-content", `vitalSacrifice.siphon`, true);
                if (invoked) {
                    let damage = actor.system.scale[`blood-hunter`][`blood-rite-die`].faces;
                    damage = damage*2;
                    if (helpers.getFeature(actor, 'Sanguine Mastery')) damage = damage*2;
                    workflow.setDamageRoll(await new Roll(`${damage}`).evaluate({async: true}));
                }
                break;
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
            default: // By default, if something gets called through here and isn't on the rite list, return false to safeguard
                effectData = false;
        }
        return effectData; // Return the effect data; by now it's been modified with the final data of the rite in question.
    },
    // Prompt the actor for a vital sacrifice; takes on the actor to be inspected, its token, the item calling the prompt and if it must be accepted to use the item.
    'vitalSacrificePrompt': async function _vitalSacrificePrompt(workflow, actor, token, item, neededForItemUse = false, sizeConstraint = false, updateUses = true) {
        // If the actor's HP is too low for a vital sacrifice, tell them.
        let riteDice = actor.system.scale[`blood-hunter`][`blood-rite-die`];
        if (actor.system.attributes.hp.value <= riteDice.faces) {
            if (neededForItemUse) {
                ui.notifications.warn('You do not have enough hit points to use a vital sacrifice without dying, and you must use a vital sacrifice to use this rite!');
            } else {
                let vitalControl = await bloodHunter.vitalControlPrompt(actor, token);
                if (vitalControl) return true;
            }
            return false;
        }
        // Generate two different messages, depending on if this vital sacrifice is required or not.
        let vitalSacMessage = 'Would you like to make a Vital Sacrifice to improve this rite?';
        if (neededForItemUse) vitalSacMessage = 'You cannot use this rite without a Vital Sacrifice, which can also bolster it. Make a Vital Sacrifice?'
        if (neededForItemUse && sizeConstraint) vitalSacMessage = 'You cannot use this rite on that target without a Vital Sacrifice, as they are too big. Make a Vital Sacrifice?'
        // Call the helper dialog function to ask the player to vital sacrifice
        let firstOwner = helpers.firstOwner(actor);
        const result = await helpers.remoteDialog('Vital Sacrifice', constants.yesNo, firstOwner.id,vitalSacMessage, 'row');

        if (result && neededForItemUse) { // If the player chose YES and the item MUST have a vital sacrifice to operate.
            actor.setFlag('5e-content', 'vitalSacrifice.proceed', true);
            if (updateUses) await helpers.updateItemUses(token.document, item, 1);
            await bloodHunter.performVitalSacrifice(workflow.itemCardId, riteDice.die, token);
            return true;
            // Set the flag appropriate to vital sacrifice, so that the later workflow can detect that it must be used. Update the item's uses to allow it to be used, and then return true to allow the workflow to continue.
        } else if (result && !neededForItemUse) { // If the player chose YES but the item does NOT require a vital sacrifice to operate.
            actor.setFlag('5e-content', 'vitalSacrifice.proceed', true);
            let vitalC = await bloodHunter.vitalControlPrompt(actor, token);
            if (!vitalC) await bloodHunter.performVitalSacrifice(workflow.itemCardId, riteDice.die, token);
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
    'vitalControlPrompt': async function _vitalControlPrompt(actor, token) {
        // Test for the actor having vital control, and if they do, whether or not it has 0 uses.
        let vitalControl = helpers.getFeature(actor, 'Vital Control');
        let controlUses = vitalControl?.system?.uses?.value;
        if (!vitalControl || controlUses === 0) return false;
        // If the actor has vital control and it has uses remaining, prompt them on if they would like to use it.
        let firstOwner = helpers.firstOwner(actor);
        const result = await helpers.remoteDialog('Vital Control', constants.yesNo, firstOwner.id,'Would you like to invoke this vital sacrifice without paying the cost, using vital control? You can only do this <b>once</b> per long rest.', 'row');
        if (result) {
            // If the actor chose to use vital control, set the appropirate flag and deduct a use from vital control to deplete it to 0 charges.
            await helpers.updateItemUses(token.document, vitalControl, -1);
            actor.setFlag('5e-content', 'vitalControl.proceed', true);
            return true;
        } else return false;
    },
    // Should take place before the item is rolled for all rites; determines if a vital sacrifice is required to use the rite or not (and handles edge-cases like the rite of exsanguination).
    'determineVitalSacrifice': async function _determineVitalSacrifice(args) {
        let item = args.item;
        let actor = args.actor;
        let token = args.token;
        let workflow = args.workflow;
        let target = args.args[0].targets[0];
        let itemUses = item.system.uses.value;
        let targetSize = helpers.getSize(target.actor);
        let conc = helpers.findEffect(target.actor, 'Concentrating');
        // Coverage for the specific interaction of several rites needing specific conditions to be met.
        if (item.name === 'Rite of the Puppet' && target.actor.attributes.hp.value !== 0) {
            ui.notifications.warn("Target has HP remaining and is not a valid target!");
            return false;
        } else if (item.name === 'Rite of Binding' && targetSize > 3) {
            let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true, true);
            if (!vitalSacrifice) return false;
        } else if (item.name === 'Rite of Confusion' && !conc) {
            ui.notifications.warn("Target must be Concentrating to be a valid target!");
            return false;
        } else if (itemUses === 0) {
// If the item has no uses and it isn't the rite of exsanguination (which cannot be invoked at 0 uses), tell the player that they MUST use a vital sacrifice to use the rite.
            if (item.name === 'Rite of Exsanguination') return;
            let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true);
            if (!vitalSacrifice) return;
        } else await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item);
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
            target = await helpers.getTargetFromSingleSet(targets);
            target = target.document;
        }
        // Pull in the flags for vital sac and vital control; set to false if no flag is present.
        let vitalSacrifice = actor.getFlag('5e-content', 'vitalSacrifice.proceed') ?? false;
        let vitalControl = actor.getFlag('5e-content', 'vitalControl.proceed') ?? false;
        // If vital control was used, unset vital sacrifice and remove both flags.
        if (vitalControl) {
            vitalSacrifice = "undefined";
            actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
            actor.unsetFlag('5e-content', 'vitalControl');
            if (applyRites) {
                let reactionTarget = actor.getFlag('5e-content', 'blindness.target') ?? false;
                if (!reactionTarget) await bloodHunter.applyRiteEffects(workflow, target, riteDice.die, true);
                else await bloodHunter.applyRiteEffects(workflow, fromUuidSync(reactionTarget), riteDice.die, true);
            }
        // Else, if vital sacrifice was called for, call the function to roll a vital sacrifice, and unset the vital sacrifice flag.
        } else if (vitalSacrifice) {
            actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
            if (applyRites) {
                let reactionTarget = actor.getFlag('5e-content', 'blindness.target') ?? false;
                if (!reactionTarget) await bloodHunter.applyRiteEffects(workflow, target, riteDice.die, true);
                else await bloodHunter.applyRiteEffects(workflow, fromUuidSync(reactionTarget), riteDice.die, true);
            }
        } else {
            if (applyRites) {
                let reactionTarget = actor.getFlag('5e-content', 'blindness.target') ?? false;
                if (!reactionTarget) await bloodHunter.applyRiteEffects(workflow, target, riteDice.die);
                else await bloodHunter.applyRiteEffects(workflow, fromUuidSync(reactionTarget), riteDice.die);
            }
        }
    }
}