import { bloodHunter } from "./bloodHunter.js";
import { constants } from "../../../constants.js";
import { helpers } from "../../../helpers.js";

export let crimsonOffering = {
    'preRoll': async function _preRoll({actor, args, character, item, scope, speaker, token, workflow}) {
        let offeringMade = actor.getFlag('5e-content', 'crimsonOffering.weapon');
        if (offeringMade) {
            ui.notifications.warn('You have already made a crimson offering! End your current one before activating a new one!');
            return false;
        }
        let improvedOffering = helpers.getFeature(actor, 'Improved Crimson Offering');
        let improvedOfferingUses = improvedOffering?.system?.uses?.value;
        if (improvedOffering && improvedOfferingUses != 0) {
            let result = await helpers.dialog('Improved Crimson Offering', constants.yesNo, 'You may use Crimson Offering <b>once</b> per long rest without making a Vital Sacrifice. Would you like to do that?', 'row')
            if (!result) {
                let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true, false, false);
                if (!vitalSacrifice) return false;
            } else {
                await improvedOffering.update({'system.uses.value': improvedOffering.system.uses.value - 1});
                actor.setFlag('5e-content', 'vitalSacrifice.proceed', true);
            }
        } else {
            let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true, false, false);
            if (!vitalSacrifice) return false;
        }
    },
    'crimsonOfferingEffect': async function _crimsonOfferingEffect({actor, args, character, item, scope, speaker, token, workflow}) {
        let sacrificeMade = actor.getFlag('5e-content', 'vitalSacrifice.proceed') ?? false;
        if (!sacrificeMade) return;
        actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');

        if (workflow.targets.size != 1) return;
        let riteDice = actor.system.scale['blood-hunter']['blood-rite-die'];
        if (!riteDice) {
            ui.notifications.warn('You do not appear to have a Blood Rite Die scale!');
            return;
        }

        let tokenDoc = token.document;
        let generatedMenu = [];
        actor.items.forEach(item => {
            if (item.type === 'weapon' && item.system.equipped && !(item.name === 'Unarmed Strike')) {
                generatedMenu.push([item.name, item.id]);
            }
        });

        let selection;
        if (generatedMenu.length === 0) return;
        if (generatedMenu.length === 1) selection = generatedMenu[0][1];
        if (!selection) selection = await helpers.dialog('Choose a weapon', generatedMenu, 'What weapon would you like to imbue with your crimson rite?', 'column');
        if (!selection) return;

        let weaponData = actor.items.get(selection).toObject();
        actor.setFlag('5e-content', 'crimsonOffering.weapon', selection);
    
        let offeringMenu = [['Offering of the Flame (Fire)','fire'],['Offering of the Dissolved (Acid)','acid'],['Offering of the Frozen (Cold)','cold'],['Offering of the Storm (Lightning)','lightning'],['Offering of the Assassin (Poison)','poison']];
        if (helpers.getFeature(actor, 'Improved Crimson Offering')) offeringMenu.push(['Offering of the Dead (Necrotic)','necrotic'],['Offering of the Oracle (Psychic)','psychic'],['Offering of the Roar (Thunder)','thunder'])
        if (helpers.getFeature(actor, 'Warrior of the Dawn')) offeringMenu.push(['Offering of the Dawn (Radiant)','radiant']);

        let damageType;
        if (offeringMenu.length === 0) return;
        damageType = await helpers.dialog('Choose an offering', offeringMenu, `Which crimson offering would you like to imbue into your ${weaponData.name}?`, 'column');
        if (!damageType) return;
        actor.setFlag('5e-content', 'crimsonOffering.type', damageType);

        if (helpers.getFeature(actor, 'Sanguine Mastery')) weaponData.system.damage.parts.push(['2' + riteDice + 'kh1', damageType]);
        else weaponData.system.damage.parts.push([riteDice, damageType]);
        weaponData.system.properties.mgc = true;
        let damageString = damageType[0].toUpperCase() + damageType.slice(1);

        let effectData = {
            'changes': [
                {
                    'key': 'flags.midi-qol.onUseMacroName',
                    'mode': 0,
                    'value': 'function.sorelliaAutomations.macros.crimsonOffering.damage,preDamageApplication',
                    'priority': 0
                }
            ],
            'name': 'Crimson Offering: ' + weaponData.name + ' (' + damageString + ')',
            'icon': workflow.item.img,
            'duration': {
                'seconds': 3600
            },
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
                        'script': "warpgate.revert(token.document, '" + 'Crimson Offering: ' + weaponData._id + "');\nactor.unsetFlag('5e-content', 'crimsonOffering.weapon');\nactor.unsetFlag('5e-content', 'crimsonOffering.type');\nactor.unsetFlag('5e-content', 'crimsonOffering');"
                    }
                }
            }
        };

        if (damageType === 'radiant') {
            effectData.changes.push(
                {
                    'key': 'system.traits.dr.value',
                    'mode': 2,
                    'value': 'necrotic',
                    'priority': 20
                },
                {
                    'key': 'ATL.light.bright',
                    'mode': 4,
                    'value': '20',
                    'priority': 20
                },
                {
                    'key': 'ATL.light.dim',
                    'mode': 4,
                    'value': '40',
                    'priority': 20
                }
            );
        }

        let updates = {
            'embedded': {
                'Item': {
                    [weaponData.name]: weaponData
                }
            }
        };

        let options = {
            'permanent': false,
            'name': 'Crimson Offering: ' + weaponData._id,
            'description': 'Crimson Offering: ' + weaponData.name
        };

        await warpgate.mutate(tokenDoc, updates, {}, options);
        await helpers.createEffect(actor, effectData);
    },
    'damage': async function _damage({speaker, actor, token, character, item, args}) {
        args = args[0];
        let workflow = args.workflow;
        let hitTargets = args.hitTargetUuids;
        let weapon = actor.getFlag('5e-content', 'crimsonOffering.weapon');
        weapon = actor.items.get(weapon).toObject();
        let crimsonOffering = helpers.getFeature(actor, 'Crimson Offering');
        let crimsonBrand = helpers.getFeature(actor, 'Crimson Brand');
        if (item._id !== weapon._id) return;
        if (hitTargets.length != 1 || !crimsonBrand) return;
        canvas.tokens.selectObjects();
        let tokens = canvas.tokens.placeables.filter(t => helpers.findEffect(t.actor, 'Crimson Brand'));
        let validTokens = 0;
        tokens.forEach(token => {
            let tokenDoc = token.document;
            let brand = helpers.findEffect(tokenDoc.actor, 'Crimson Brand');
            if (brand && brand.origin === crimsonOffering.uuid) validTokens++;
        });
        if (validTokens > 0) {
            let choice = await helpers.dialog('Duplicate Effect', constants.yesNo, 'There is at least one other creature with a crimson brand on it which comes from yourself. To use crimson brand again, these effects must be ended. Would you like to do this?');
            if (!choice) return;
            tokens.forEach(token => {
                let tokenDoc = token.document;
                let brand = helpers.findEffect(tokenDoc.actor, 'Crimson Brand');
                if (brand && brand.origin === crimsonOffering.uuid) helpers.removeEffect(brand);
            });
        }
        let choice = await helpers.dialog('Crimson Brand', constants.yesNo, 'Would you like to brand this target?');
        if (!choice) return;
        let brandUses = crimsonBrand?.system?.uses?.value;
        if (brandUses === 0) {
            let vitalSacrifice = await bloodHunter.vitalSacrificePrompt(workflow, actor, token, item, true, false, false);
            actor.unsetFlag('5e-content', 'vitalSacrifice.proceed');
            if (!vitalSacrifice) {
                ui.notifications.warn('You do not have any uses remaining in your crimson brand feature, and did not vital sacrifice!');
                return;
            }
        } else {
            await crimsonBrand.update({'system.uses.value': crimsonBrand.system.uses.value - 1});
            
        }

        let effectData = {
            'changes': [
                {
                    'key': 'flags.midi-qol.onUseMacroName',
                    'mode': 0,
                    'value': 'function.sorelliaAutomations.macros.crimsonOffering.brandDamage,preDamageApplication',
                    'priority': 0
                }                
            ],
            'name': 'Crimson Brand',
            'icon': crimsonBrand.img,
            'origin': crimsonOffering.uuid,
            'duration': {
                'seconds': 36000
            }
        }
        let target = fromUuidSync(hitTargets[0]);
        await helpers.createEffect(target.actor, effectData);
    },
    'brandDamage': async function _brandDamage({actor, token, args}) {
        args = args[0];
        let hitTargets = args.hitTargetUuids;
        if (hitTargets.length === 0) return;
        let effect = helpers.findEffect(actor, 'Crimson Brand');
        let sourceItem = fromUuidSync(effect.origin);
        let source = sourceItem.parent;
        let crimsonOfferingType = source.getFlag('5e-content', 'crimsonOffering.type');
        let sourceToken = source.getActiveTokens()[0].document;
        let applyBrand = false;
        for (let i in hitTargets) {
            let nearbySource = helpers.findNearby(fromUuidSync(hitTargets[i]), 7.5, 'ally').filter(x => x.id === sourceToken._id)
            if (hitTargets[i] === sourceToken.uuid || nearbySource.length != 0) applyBrand = true;
        }
        if (!applyBrand) return;

        let riteDice = source.system.scale['blood-hunter']['blood-rite-die'].die;
        let crimsonAnchor = helpers.getFeature(source, 'Crimson Anchor');
        if (crimsonAnchor) riteDice = '2' + riteDice;
        let damageRoll = await new Roll(riteDice).roll({async: true});

        await helpers.applyWorkflowDamage(sourceToken, damageRoll, crimsonOfferingType, [], `Crimson Brand - ${crimsonOfferingType} Damage`, args.itemCardId);
        await helpers.applyDamage(token, damageRoll.total, crimsonOfferingType);
    }
}