import { socket } from './module.js';

export let helpers = {
    'dialog': async function _dialog(title, options, content, format = 'row') {
        if (content) content = '<center>' + content + '</center>';
        let buttons = options.map(([label, value]) => ({label, value}));
        let selected = await warpgate.buttonDialog(
            {
                buttons,
                title,
                content
            },
            format
        );
        return selected;
    },
    'numberDialog': async function _numberDialog(title, buttons, options) {
        let inputs = [];
        for (let i of options) {
            inputs.push({
                'label': i,
                'type': 'number'
            });
        }
        let config = {'title': title};
        
        return await warpgate.menu(
            {
                'inputs': inputs,
                'buttons': buttons
            },
            config
        );
    },
    'getRandomInt': function _getRandomInt(maxValue) {
        return Math.floor(Math.random() * maxValue);
    },
    'hasMutation': async function _hasMutation(token, mutationName, revertMutation = false, warn = false) {
        const mutStack = warpgate.mutationStack(token);
        if (revertMutation && !!mutStack.getName(mutationName)) {
            await warpgate.revert(token, mutationName);
            if (warn) ui.notifications.warn("Target actor already has this effect applied! Removing effect...");
        }
        return !!mutStack.getName(mutationName);
    },
    'getFeature': function _getFeature(actor, featureName) {
        return actor.items.getName(featureName);
    },
    'updateSkillProf': async function _updateSkillProf(actor, skillName, proficiency = 'proficient') {
        switch (proficiency.toLowerCase()) {
            case 'proficient':
                proficiency = 1;
                break;
            case 'expertise':
                proficiency = 2;
                break;
            case 'half':
                proficiency = 0.5;
                break;
            case 'untrained':
                proficiency = 0;
                break;
            default:
                break;
        }
        switch (skillName) {
            case 'Acrobatics':
                skillName = 'acr';
                break;
            case 'Animal Handling':
                skillName = 'ani';
                break;
            case 'Arcana':
                skillName = 'arc';
                break;
            case 'Athletics':
                skillName = 'ath';
                break;
            case 'Deception':
                skillName = 'dec';
                break;
            case 'History':
                skillName = 'his';
                break;
            case 'Insight':
                skillName = 'ins';
                break;
            case 'Intimidation':
                skillName = 'itm';
                break;
            case 'Investigation':
                skillName = 'inv';
                break;
            case 'Medicine':
                skillName = 'med';
                break;
            case 'Nature':
                skillName = 'nat';
                break;
            case 'Perception':
                skillName = 'prc';
                break;
            case 'Performance':
                skillName = 'prf';
                break;
            case 'Persuasion':
                skillName = 'per';
                break;
            case 'Religion':
                skillName = 'rel';
                break;
            case 'Sleight of Hand':
                skillName = 'slt';
                break;
            case 'Stealth':
                skillName = 'ste';
                break;
            case 'Survival':
                skillName = 'sur';
                break;
            default:
                break;
        }

        await actor.update({[`system.skills.${skillName}.value`]: proficiency});
    },
    'updateToolProf': async function _updateToolProf(actor, toolName, proficiency = 'proficient') {
        switch (proficiency) {
            case 'proficient':
                proficiency = 1;
                break;
            case 'expertise':
                proficiency = 2;
                break;
            case 'half':
                proficiency = 0.5;
                break;
            case 'untrained':
                proficiency = 0;
                break;
            default:
                break;
        }
        if (proficiency != 'remove') await actor.update({[`system.tools.${toolName}.value`]: proficiency});
        else await actor.update({[`system.tools.-=${toolName}`]: proficiency});
    },
    'updateLanguages': async function _updateLanguages(actor, language, remove = false) {
        let languageData = [], actorLanguages = actor.system.traits.languages.value;
        const iterator = actorLanguages.entries();

        for (const entry of iterator) {
            let entryLabel = entry[0];
            if (remove) {
                if (entryLabel != language) {
                    languageData.push(entryLabel);
                }
            } else {
                languageData.push(entryLabel);
            }
        }

        if (!remove) {
            languageData.push(language);
        }

        await actor.update({[`system.traits.languages.value`]: languageData});
    },
    'updateWeaponProf': async function _updateWeaponProf(actor, weapon, addOrRemove = 'add') {
        let weaponData = [], actorWeapons = actor.system.traits.weaponProf.value;
        const iterator = actorWeapons.entries();

        for (const entry of iterator) {
            let entryLabel = entry[0];
            if (addOrRemove === 'remove') {
                if (entryLabel != weapon) {
                    weaponData.push(entryLabel);
                }
            } else {
                weaponData.push(entryLabel);
            }
        }

        if (addOrRemove === 'add') {
            weaponData.push(weapon);
        }

        await actor.update({[`system.traits.weaponProf.value`]: weaponData});
    },
    'updateItemUses': async function _updateItemUses(token, item, delta, updateMax = false) {
        let updates;
        if (!updateMax) {
            updates = {
                'embedded': {
                    'Item': {
                        [item.name]: {
                            'system': {
                                'uses': {
                                    'value': item.system.uses.value + delta
                                }
                            }
                        }
                    }
                }
            };
        } else {
            updates = {
                'embedded': {
                    'Item': {
                        [item.name]: {
                            'system': {
                                'uses': {
                                    'value': item.system.uses.value + delta,
                                    'max': parseInt(item.system.uses.max) + delta
                                }
                            }
                        }
                    }
                }
            };
        }
        let options = {
            'permanent': true,
            'name': item.name
        }
        await warpgate.mutate(token, updates, {}, options);
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
    'findEffect': function _findEffect(actor, effectName) {
        return actor.effects.getName(effectName);
    },
    'createEffect': async function _createEffect(actor, effectData) {
        if (effectData.label) {
            effectData.name = effectData.label;
            delete effectData.label;
        }
        if (game.user.isGM) {
            await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        } else {
            await MidiQOL.socket().executeAsGM('createEffects', {'actorUuid': actor.uuid, 'effects': [effectData]});
        }
    },
    'removeEffect': async function _removeEffect(effect) {
        if (helpers.firstOwner(effect).id === game.user.id) {
            await effect.delete();
        } else {
            await MidiQOL.socket().executeAsGM('removeEffects', {'actorUuid': effect.parent.uuid, 'effects': [effect.id]});
        }
    },
    'updateEffect': async function _updateEffect(effect, updates) {
        if (game.user.isGM) {
            await effect.update(updates);
        } else {
            updates._id = effect.id;
            await MidiQOL.socket().executeAsGM('updateEffects', {'actorUuid': effect.parent.uuid, 'updates': [updates]});
        }
    },
    'addCondition': async function _addCondition(actor, name, overlay, origin) {
        await game.dfreds.effectInterface.addEffect(
            {
                'effectName': name,
                'uuid': actor.uuid,
                'origin': origin,
                'overlay': overlay
            }
        );
    },
    'removeCondition': async function _removeCondition(actor, name) {
        await game.dfreds.effectInterface.removeEffect(
            {
                'effectName': name,
                'uuid': actor.uuid
            }
        );
    },
    'applyDamage': async function _applyDamage(tokenList, damageValue, damageType) {
        let targets;
        if (Array.isArray(tokenList)) {
            targets = new Set(tokenList);
        } else {
            targets = new Set([tokenList]);
        }
        await MidiQOL.applyTokenDamage(
            [
                {
                    damage: damageValue,
                    type: damageType
                }
            ],
            damageValue,
            targets,
            null,
            null
        );
    },
    'applyWorkflowDamage': async function _applyWorkflowDamage(sourceToken, damageRoll, damageType, targets, flavor, itemCardId) {
        new MidiQOL.DamageOnlyWorkflow(sourceToken.actor, sourceToken, damageRoll.total, damageType, targets, damageRoll, {'flavor': flavor, 'itemCardId': itemCardId});
    },
    'findNearby': function _findNearby(tokenDoc, range, disposition, includeIncapacitated = false, includeToken = false) {
        let dispositionValue;
        switch (disposition) {
            case 'ally':
                dispositionValue = 1;
                break;
            case 'neutral':
                dispositionValue = 0;
                break;
            case 'enemy':
                dispositionValue = -1;
                break;
            default:
                dispositionValue = null;
        }
        let options = {'includeIncapacitated': includeIncapacitated, 'includeToken': includeToken};
        return MidiQOL.findNearby(dispositionValue, tokenDoc, range, options).filter(i => !i.document.hidden);
    },
    'addToRoll': async function _addToRoll(roll, addonFormula, negative = false) {
        let plusOrMinus = ' + ';
        if (negative) plusOrMinus = ' - ';
        let addonFormulaRoll = await new Roll('0 ' + plusOrMinus + addonFormula).evaluate({async: true});
        game.dice3d?.showForRoll(addonFormulaRoll);
        for (let i = 1; i < addonFormulaRoll.terms.length; i++) {
            roll.terms.push(addonFormulaRoll.terms[i]);
        }
        roll._total += addonFormulaRoll.total;
        roll._formula = roll._formula + plusOrMinus + addonFormula;
        return roll;
    },
    'getItemDC': function _getItemDC(item) {
        let itemDC;
        let scaling = item.system.save.scaling;

        if (scaling === 'spell') {
            itemDC = item.actor.system.attributes.spelldc;
        } else if (scaling != 'flat') {
            itemDC = item.actor.system.abilities[scaling].dc;
        } else {
            itemDC = item.system.save.dc;
            if (!itemDC) itemDC = 10;
        }
        return itemDC;
    },
    'getItemMod': function _getItemMod(item) {
        let itemMod;
        let scaling = item.system.save.scaling;

        if (scaling === 'spell') {
            itemMod = item.actor.system.abilities[item.actor.system.attributes.spellcasting].mod;
        } else {
            itemMod = item.actor.system.abilities[scaling].mod;
        }
        return itemMod;
    },
    'checkTrait': function _checkTrait(actor, type, trait) {
        return actor.system.traits[type].value.has(trait);
    },
    'functionToString': function _functionToString(input) {
        return `(${input.toString()})()`;
    },
    'getItemFromCompendium': async function _getItemFromCompendium(key, name, packFolderId = undefined, ignoreNotFound = false) {
        const gamePack = game.packs.get(key);
        if (!gamePack) {
            ui.notifications.warn('Invalid compendium specified!');
            return false;
        }
        let packIndex = await gamePack.getIndex({'fields': ['name','type','folder']});
        let match = packIndex.find(item => item.name === name && (!packFolderId || (packFolderId && item.folder === packFolderId)));

        if (match) {
            return (await gamePack.getDocument(match._id))?.toObject();
        } else {
            if (!ignoreNotFound) ui.notifications.warn('Item not found in specified compendium! Check spelling?');
            return undefined;
        }
    },
    'raceOrType': function _raceOrType(actor) {
        return actor.type === 'npc' ? actor.system.details?.type?.value : actor.system.details?.race;
    },
    'getDistance': function _getDistance(sourceToken, targetToken) {
        return MidiQOL.getDistance(sourceToken, targetToken, {wallsBlock: false});
    },
    'totalDamageType': function _totalDamageType(actor, damageDetail, type) {
        let total = 0
        let immune = helpers.checkTrait(actor, 'di', type);
        if (immune) return 0;
        for (let i of damageDetail) {
            if (i.type.toLowerCase() === type.toLowerCase()) total += i.damage;
        }
        let resistant = helpers.checkTrait(actor, 'dr', type);
        if (resistant) total = Math.floor(total / 2);
        return total;
    },
    'getEffectCastLevel': function _getEffectCastLevel(effect) {
        return effect.flags['midi-qol']?.castData?.castLevel;
    },
    'getRollDamageTypes': function _getRollDamageTypes(damageRoll) {
        let types = new Set();
        for (let i of damageRoll.terms) {
            if (i.flavor != '') types.add(i.flavor.toLowerCase());
        }
        return types;
    },
    'perTurnCheck': function _perTurnCheck(originItem, type, name, tokenId, ownTurnOnly = true) {
        if (!helpers.inCombat()) return true;
        if (ownTurnOnly && (tokenId != game.combat.current.tokenId)) return false;
        let currentTurn = game.combat.round + '-' + game.combat.turn;
        let previousTurn = originItem.flags['5e-content']?.[type]?.[name]?.turn;
        if (currentTurn != previousTurn) return true;
        return false;
    },
    'setTurnCheck': async function _setTurnCheck(originItem, type, name, reset) {
        let turn = '';
        if (helpers.inCombat() && !reset) turn = game.combat.round + '-' + game.combat.turn;
        await originItem.setFlag('5e-content', type + '.' + name + '.turn', turn);
    },
    'tokenInTemplate': function _tokenInTemplate(token, template) {
        let containedTokens = helpers.templateTokens(template);
        let foundToken = containedTokens.find(i => i === token.id);
        return foundToken;
    },
    'tokenTemplates': function _tokenTemplates(token) {
        return game.modules.get('templatemacro').api.findContainers(token);
    },
    'templateTokens': function _templateTokens(template) {
        return game.modules.get('templatemacro').api.findContained(template);
    },
    'findGrids': function _findGrids(previousCoords, coords, templateDoc) {
        return game.modules.get('templatemacro').api.findGrds(previousCoords, coords, templateDoc);
    },
    'inCombat': function _inCombat() {
        return !(game.combat === null || game.combat === undefined || game.combat?.started === false);
    },
    'addTempItem': async function _addTempItem(actor, itemData, itemID, itemNumber, category = false, favorite = false) {
        if (!itemData.flags['5e-content']) itemData.flags['5e-content'] = {};
        itemData.flags['5e-content'].tempItem = {
            'source': itemID,
            'itemNumber': itemNumber
        };
        if (category) itemData.flags['custom-character-sheer-sections'] = {
            'sectionName': category
        };
        if (favorite) itemData.flags['tidy5e-sheet'] = {
            'favorite': true
        };
        await actor.createEmbeddedDocuments('Item', [itemData]);
    },
    'removeTempItem': async function _removeTempItem(actor, itemID) {
        let items = actor.items.filter(item => item.flags['5e-content']?.tempItem?.source === itemID);
        for (let i of items) {
            await i.delete();
        }
    },
    'getTempItem': function _getTempItem(actor, itemID, itemNumber) {
        return actor.items.find(item => item.flags['5e-content']?.tempItem?.source === itemID && item.flags['5e-content']?.tempItem?.itemNumber === itemNumber);
    },
    'getCompendiumItemDescription': async function _getCompendiumItemDescription(name) {
        let itemData = await helpers.getItemFromCompendium('5e-content.items', name);
        if (itemData) return itemData.system.description.value;
    },
    'updateTargets': function _updateTargets(targets) {
        game.user.updateTokenTargets(targets);
    },
    'itemDuration': function _itemDuration(item) {
        return Date.convertDuration(item.system.duration, helpers.inCombat());
    },
    'getCriticalFDormula': function _getCriticalFDormula(formula) {
        return new CONFIG.Dice.DamageRoll(formula, {}, {'critical': true, 'powerfulCritical': game.settings.get('dnd5e', 'criticalDamageMaxDice'), 'multiplyNumeric': game.settings.get('dnd5e', 'criticalDamageModifiers')}).formula;
    },
    'getSize': function _getSize(actor, sizeToString = false) {
        let sizeValue;
        let sizeString;
        switch (actor.system.traits.size) {
            case  'tiny':
                sizeValue = 0;
                sizeString = 'tiny';
                break;
            case 'sm':
                sizeValue = 1;
                sizeString = 'small';
                break;
            case 'med':
                sizeValue = 2;
                sizeString = 'medium';
                break;
            case 'lg':
                sizeValue = 3;
                sizeString = 'large';
                break;
            case 'huge':
                sizeValue = 4;
                sizeString = 'huge';
                break;
            case 'grg':
                sizeValue = 5;
                sizeString = 'gargantuan';
                break;
        }
        if (sizeToString) return sizeString;
        else return sizeValue;
    },
    'sizeStringValue': function _sizeStringValue(sizeString){
        let sizeValue;
        switch (sizeString.toLowerCase()) {
            case 'tiny':
                sizeValue = 0;
                break;
            case 'small':
                sizeValue = 1;
                break;
            case 'medium':
                sizeValue = 2;
                break;
            case 'large':
                sizeValue = 3;
                break;
            case 'huge':
                sizeValue = 4;
                break;
            case 'gargantuan':
                sizeValue = 5;
                break;
            case 'sm':
                sizeValue = 1;
                break;
            case 'med':
                sizeValue = 2;
                break;
            case 'lg':
                sizeValue = 3;
                break;
            case 'grg':
                sizeValue = 5;
                break;
        }
        return sizeValue;
    },
    'aimCrosshair': async function _aimCrosshair(token, maxRange, icon, interval, size) {
        let distance = 0;
        let ray;
        let checkDistance = async (crosshairs) => {
            while (crosshairs.inFlight) {
                await warpgate.wait(100);
                ray = new Ray(token.center, crosshairs);
                distance = canvas.grid.measureDistances([{ray}], {'gridSpaces': true})[0];
                if (token.checkCollision(ray, {'origin': ray.A, 'type': 'move', 'mode': 'any'}) || distance > maxRange) {
                    crosshairs.icon = 'icons/svg/havzard.svg';
                } else {
                    crosshairs.icon = icon;
                }
                crosshairs.draw();
                crosshairs.label = distance + '/' + maxRange + 'ft.';
            }
        }
        let callbacks = {
            'show': checkDistance
        }
        let options = {
            'size': size,
            'icon': icon,
            'label': '0 ft.',
            'interval': interval
        }
        if (!maxRange) return await warpgate.crosshairs.show(options);
        return await warpgate.crosshairs.show(options, callbacks);
    },
    'getConfiguration': function _getConfiguration(item, key) {
        return item.flags['5e-content']?.configuration?.[key.toLowerCase().split(' ').join('-').toLowerCase()];
    },
    'updateCombatant': async function _updateCombatant(combatant, updates) {
        if (game.user.isGM) {
            await combatant.update(updates);
        } else {
            await socket.executeAsGM('updateCombatant', combatant.id, updates);
        }
    },
    'getCombatant': function _getCombatant(token) {
        return game.combat?.combatants?.find(i => i.tokenId === token.id);
    },
    'remoteDialog': async function _remoteDialog(title, options, userId, content, format = 'row') {
        if (userId === game.user.id) return await helpers.dialog(title, options, content, format);
        return await socket.executeAsUser('remoteDialog', userId, title, options, content, format);
    },
    'firstOwner': function _firstOwner(document) {
        return warpgate.util.firstOwner(document);
    },
    'selectDocument': async function selectDocument(title, documents, useUuids) {
        return await new Promise(async (resolve) => {
            let buttons = {},
                dialog;
            for (let i of documents) {
                buttons[i.name] = {
                    label: `<img src='${i.img}' width='50' height='50' style='border: 0px; float: left'><p style='padding: 1%; font-size: 15px'> ${i.name} </p>`,
                    callback: () => {
                        if (useUuids) {
                            resolve([i.uuid]);
                        } else {
                            resolve([i])
                        }
                    }
                }
            }
            let height = (Object.keys(buttons).length * 56 + 46);
            if (Object.keys(buttons).length > 14 ) height = 850;
            dialog = new Dialog(
                {
                    title: title,
                    buttons,
                    close: () => resolve(false)
                },
                {
                    height: height
                }
            );
            await dialog._render(true);
            dialog.element.find(".dialog-buttons").css({
                "flex-direction": 'column',
            })
        })
    },
    'selectDocuments': async function selectDocuments(title, documents, useUuids) {
        return await new Promise(async (resolve) => {
            let buttons = {cancel: {label: `Cancel`, callback: () => resolve(false)}, confirm: {label: `Confirm`, callback: (html) => getDocuments(html, documents)}},
                dialog;
            let content = `<form>`;
            content += `<datalist id = 'defaultNumbers'>`;
            for (let i = 0; i < 33; i++) {
                content += `<option value = '${i}'></option>`
            }
            content += `</datalist>`;
            for (let i = 0; documents.length > i; i++) {
                content += 
                    `<div class = 'form-group'>
                        <input type='number' id='${i}' name='${documents[i].name}' placeholder='0' list='defaultNumbers' style='max-width: 50px; margin-left: 10px'/>
                        <label> 
                            <img src='${documents[i].img}' width='50' height='50' style='border:1px solid gray; border-radius: 5px; float: left; margin-left: 20px; margin-right: 10px'>
                            <p style='padding: 1%; text-align: center; font-size: 15px;'> ${documents[i].name}` + (documents[i].system?.details?.cr ? ` (CR ${helpers.decimalToFraction(documents[i].system?.details?.cr)})` : ``) + `</p>
                        </label>
                    </div>
                `;
            }
            content += `</form>`;
            console.log(content);
            let height = (documents.length * 53 + 83);
            if (documents.length > 14 ) height = 850;
            dialog = new Dialog(
                {
                    title: title,
                    content: content,
                    buttons: buttons,
                    close: () => resolve(false)
                },
                {
                    height: height
                }
            );
            await dialog._render(true);
            function getDocuments(html, documents) {
                let returns = [];
                for (let i = 0; documents.length > i; i++) {
                    let current = html[0].querySelector(`input[id='${i}']`)?.value;
                    if (current > 0) {
                        for (let j = 0; current > j; j++) {
                            if (useUuids) {
                                returns.push(documents[i].uuid);
                            } else {
                                returns.push(documents[i]);
                            }
                        }
                    }
                }
                resolve(returns);
            }
        })
    },
    'remoteDocumentDialog': async function _remoteDocumentDialog(userId, title, documents) {
        if (userId === game.user.id) return await helpers.selectDocument(title, documents);
        let uuids = await socket.executeAsUser('remoteDocumentDialog', userId, title, documents.map(i => i.uuid));
        if (!uuids) return false;
        let returns = [];
        for (let i of uuids) {
            returns.push(await fromUuid(i));
        }
        return returns;
    },
    'remoteDocumentsDialog': async function _remoteDocumentsDialog(userId, title, documents) {
        if (userId === game.user.id) return await helpers.selectDocuments(title, documents);
        let uuids = await socket.executeAsUser('remoteDocumentsDialog', userId, title, documents.map(i => i.uuid));
        if (!uuids) return false;
        let returns = [];
        for (let i of uuids) {
            returns.push(await fromUuid(i));
        }
        return returns;
    },
    'getItem': function _getItem(actor, name) {
        return actor.items.find(i => i.flags['5e-content']?.info?.name === name);
    },
    'rollRequest': async function _rollRequest(token, request, ability) {
        let userID = helpers.firstOwner(token).id;
        let data = {
            'targetUuid': token.document.uuid,
            'request': request,
            'ability': ability
        };
        return await MidiQOL.socket().executeAsUser('rollAbility', userID, data);
    },
    'remoteAimCrosshair': async function _remoteAimCrosshair(token, maxRange, icon, interval, size, userId) {
        if (userId === game.user.id) return await helpers.aimCrosshair(token, maxRange, icon, interval, size);
        return await socket.executeAsUser('remoteAimCrosshair', userId, token.document.uuid, maxRange, icon, interval, size);
    },
    'menu': async function _menu(title, buttons, inputs, useSpecialRender = false) {
        function render(html) {
            let ths = html[0].getElementsByTagName('th');
            for (let t of ths) {
                t.style.width = 'auto';
                t.system.textAlign = 'left';
            }
            let tds = html[0].getElementsByTagName('td');
            for (let t of tds) {
                t.style.width = '50px';
                t.style.textAlign = 'center';
                t.style.paddingRight = '5px';
            }
        }
        if (useSpecialRender) return await warpgate.menu({'inputs': inputs, 'buttons': buttons}, {'title': title, 'render': render});
        return await warpgate.menu({'inputs': inputs, 'buttons': buttons}, {'title': title});
    },
    'remoteMenu': async function _remoteMenu(title, buttons, inputs, useSpecialRender, userId) {
        if (userId === game.user.id) return await helpers.menu(title, buttons, inputs, useSpecialRender);
        return await socket.executeAsUser('remoteMenu', userId, title, buttons, inputs, useSpecialRender);
    },
    'decimalToFraction': function _decimalToFraction(decimal) {
        if (Number(decimal) > 1) {
            return Number(decimal);
        } else {
            let fraction = '1/' + 1 / Number(decimal);
            return fraction;
        }
    },
    'animationCheck': function _animationCheck(item) {
        if (item.flags?.autoanimations?.isEnabled || item.flags['5e-content']?.info?.hasAnimation) return true;
        let state = false;
        let name = item.name;
        let autorecSettings = {
            melee: game.settings.get('autoanimations', 'aaAutorec-melee'),
            range: game.settings.get('autoanimations', 'aaAutorec-range'),
            ontoken: game.settings.get('autoanimations', 'aaAutorec-ontoken'),
            templatefx: game.settings.get('autoanimations', 'aaAutorec-templatefx'),
            aura: game.settings.get('autoanimations', 'aaAutorec-aura'),
            preset: game.settings.get('autoanimations', 'aaAutorec-preset'),
            aefx: game.settings.get('autoanimations', 'aaAutorec-aefx'),
        }
        Object.entries(autorecSettings).forEach(setting => setting[1].forEach(autoRec => name.toLowerCase().includes(autoRec.label.toLowerCase()) ? state = true : ''));
        return state;
    },
    'createTemplate': async function _createTemplate(templateData, returnTokens) {
        let [template] = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [templateData]);
        if (!returnTokens) return template;
        let tokens = templateTokens(template).map(t => template.parent.tokens.get(t));
        return {'template': template, 'tokens': tokens};
    },
    'placeTemplate': async function _placeTemplate(templateData, returnTokens) {
        let templateDoc = new CONFIG.MeasuredTemplate.documentClass(templateData, {'parent': canvas.scene});
        let template = new game.dnd5e.canvas.AbilityTemplate(templateDoc);
        let finalTemplate = false;
        try {
            [finalTemplate] = await template.drawPreview();
        } catch {};
        if (!returnTokens) return finalTemplate;
        if (!finalTemplate) return {'template': null, 'tokens': []};
        let tokens = templateTokens(finalTemplate).map(t => finalTemplate.parent.tokens.get(t));
        return {'template': finalTemplate, 'tokens': tokens};
    },
    'pushToken': async function _pushToken(sourceToken, targetToken, distance) {
        let knockBackFactor;
        let ray;
        let newCenter;
        let hitsWall = true;
        while (hitsWall) {
            knockBackFactor = distance / canvas.dimensions.distance;
            ray = new Ray(sourceToken.center, targetToken.center);
            if (ray.distance === 0) {
                ui.notifications.info('Target is unable to be moved!');
                return;
            }
            newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
            hitsWall = targetToken.checkCollision(newCenter, {'origin': ray.A, 'type': 'move', 'mode': 'any'});
            if (hitsWall) {
                distance -= 5;
                if (distance === 0) {
                    ui.notifications.info('Target is unable to be moved!');
                    return;
                }
            }
        }
        newCenter = canvas.grid.getSnappedPosition(newCenter.x - targetToken.w / 2, newCenter.y - targetToken.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x,
                'y': newCenter.y
            }
        };
        let options = {
            'permanent': true,
            'name': 'Move Token',
            'description': 'Move Token'
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
    },
    'getGridBetweenTokens': function _getGridBetweenTokens(sourceToken, targetToken, distance) {
        let knockBackFactor = distance / canvas.dimensions.distance;
        let ray = new Ray(sourceToken.center, targetToken.center);
        let extra = 1;
        if (Math.abs(ray.slope) === 1) extra = 1.41;
        if (ray.distance === 0) return {'x': sourceToken.x, 'y': sourceToken.y};
        let newCenter = ray.project(1 + ((canvas.dimensions.size * extra * knockBackFactor) / ray.distance));
        let cornerPosition = canvas.grid.getTopLeft(newCenter.x, newCenter.y, 1);
        return {'x': cornerPosition[0], 'y': cornerPosition[1]};
    },
    'addDamageDetailDamage': function _addDamageDetailDamage(targetToken, damageTotal, damageType, workflow) {
        let targetDamage = workflow.damageList.find(t => t.tokenId === targetToken.id);
        let targetActor = targetToken.actor;
        if (chris.checkTrait(targetActor, 'di', damageType)) return;
        if (chris.checkTrait(targetActor, 'dr', damageType)) damageTotal = Math.floor(damageTotal / 2);
        targetDamage.damageDetail[0].push(
            {
                'damage': damageTotal,
                'type': damageType
            }
        );
        targetDamage.totalDamage += damageTotal;
        if (workflow.defaultDamageType === 'healing') {
            targetDamage.newHP += roll.total;
            targetDamage.hpDamage -= damageTotal;
            targetDamage.appliedDamage -= damageTotal;
        } else {
            targetDamage.appliedDamage += damageTotal;
            targetDamage.hpDamage += damageTotal;
            if (targetDamage.oldTempHP > 0) {
                if (targetDamage.oldTempHP >= damageTotal) {
                    targetDamage.newTempHP -= damageTotal;
                } else {
                    let leftHP = damageTotal - targetDamage.oldTempHP;
                    targetDamage.newTempHP = 0;
                    targetDamage.newHP -= leftHP;
                }
            } else {
                targetDamage.newHP -= damageTotal;
            }
        }
    },
    'removeDamageDetailDamage': function _removeDamageDetailDamage(ditem, targetToken, reduction) {
        let absorbed = Math.min(ditem.appliedDamage, reduction);
        let keptDamage = ditem.appliedDamage - absorbed;
        if (ditem.oldTempHP > 0) {
            if (keptDamage > ditem.oldTempHP) {
                ditem.newTempHP = 0;
                keptDamage -= ditem.oldTempHP;
                ditem.tempDamage = ditem.oldTempHP;
            } else {
                ditem.newTempHP = ditem.oldTempHP - keptDamage;
                ditem.tempDamage = keptDamage;
            }
        }
        let maxHP = targetToken.actor.system.attributes.hp.max;
        ditem.hpDamage = Math.clamped(keptDamage, 0, maxHP);
        ditem.newHP = Math.clamped(ditem.oldHP - keptDamage, 0, maxHP);
        ditem.appliedDamage = keptDamage;
        ditem.totalDamage = keptDamage;
    },
    'thirdPartyReactionMessage': async function _thirdPartyReactionMessage(user) {
        let playerName = user.name;
        let lastMessage = game.messages.find(m => m.flags?.['chris-premades']?.thirdPartyReactionMessage);
        let message = '<hr>Waiting for a 3rd party reaction from:<br><b>' + playerName + '</b>';
        if (lastMessage) {
            await lastMessage.update({'content': message});
        } else {
            ChatMessage.create({
                'speaker': {'alias': name},
                'content': message,
                'whisper': game.users.filter(u => u.isGM).map(u => u.id),
                'blind': false,
                'flags': {
                    'chris-premades': {
                        'thirdPartyReactionMessage': true
                    }
                }
            });
        }
    },
    'clearThirdPartyReactionMessage': async function _clearThirdPartyReactionMessage() {
        let lastMessage = game.messages.find(m => m.flags?.['chris-premades']?.thirdPartyReactionMessage);
        if (lastMessage) await lastMessage.delete();
    },
    'lastGM': function _lastGM() {
        return game.settings.get('chris-premades', 'LastGM');
    },
    'isLastGM': function _isLastGM() {
        return game.user.id === chris.lastGM() ? true : false;
    }
}