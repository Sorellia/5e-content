import { bloodHunter } from './macros/classFeatures/bloodHunter/bloodHunter.js';
import { constants } from './constants.js';
import { helpers } from './helpers.js';
import { macros } from './macros.js';
import { queue } from './utility/queue.js';
import { registerFeatures } from './customFeatures.js';
import { remoteAimCrosshair, remoteDialog, remoteDocumentDialog, remoteDocumentsDialog, remoteMenu } from './utility/remoteDialog.js';
import { rest, preRest } from './utility/restListener.js';
import { savantItemCreationHandler, savantItemUpdateHandler } from './macros/classFeatures/savant/savantItemHandler.js';
import { scholarlyPursuitCreationManager } from './macros/classFeatures/savant/scholarlyPursuits/scholarlyPursuits.js';
import { levelUpHandler } from './classLevelUpHandler.js';
import { skillToolRoll } from './utility/skillToolListener.js';
import { talentTreeLevelupHandler } from './macros/variantRules/talentTrees.js';
import { talentItemAddition } from './macros/variantRules/talentCreationHandler.js';
export let socket;

Hooks.once('init', async function() {
	console.log("5e Content | Initialising module!");
	registerFeatures();
});

Hooks.once('socketlib.ready', async function() {
	console.log("5e Content | Registering sockets!");
	socket = socketlib.registerModule('5e-content');
	socket.register('remoteDialog', remoteDialog);
	socket.register('remoteDocumentDialog', remoteDocumentDialog);
	socket.register('remoteDocumentsDialog', remoteDocumentsDialog);
	socket.register('remoteAimCrosshair', remoteAimCrosshair);
	socket.register('remoteMenu', remoteMenu);
});

Hooks.once('ready', async function () {
	console.log("5e Content | Registering Automation Hooks");
	// Blood Hunter Hooks
	Hooks.on('midi-qol.damageApplied', macros.sacrificialOffering.onDamage);
	Hooks.on('midi-qol.preAttackRoll', macros.riteOfBlindness.reactionDefense);
	// Savant Hooks
	Hooks.on('midi-qol.preItemRoll', macros.savant.adroitAnalysis.intSubstitute);
	Hooks.on('midi-qol.damageApplied', macros.savant.adroitAnalysis.onDamage);
	Hooks.on('midi-qol.preAttackRoll', macros.savant.adroitAnalysis.markAttackDisadvantage);
	Hooks.on('midi-qol.preCheckSaves', macros.savant.adroitAnalysis.preSave);
	Hooks.on('midi-qol.preCheckSaves', macros.savant.flashOfBrilliance.preSave);
	Hooks.on('midi-qol.preDamageRoll', macros.savant.adroitAnalysis.preDamage);
	Hooks.on('createItem', savantItemCreationHandler);
	Hooks.on('createItem', scholarlyPursuitCreationManager);
	Hooks.on('updateItem', savantItemUpdateHandler);
	Hooks.on('updateActor', macros.savant.acceleratedReflexes.intHandler);
	Hooks.on('updateActor', macros.savant.predictiveDefense.intHandler);
	Hooks.on('updateActor', macros.linguistics.intHandler);
	Hooks.on('createActiveEffect', macros.savant.acceleratedReflexes.reactionHandler);
	Hooks.on('dnd5e.rollSkill', skillToolRoll);
	Hooks.on('dnd5e.rollToolCheck', skillToolRoll);
	// Baldurs Gate 3 Weapon Actions
	Hooks.on('preUpdateItem', macros.bg3.addFeatures);
	Hooks.on('preDeleteItem', macros.bg3.removeFeatures);
	Hooks.on('midi-qol.preDamageRollComplete', macros.bg3.piercingStrike.damage);
	Hooks.on('dnd5e-restCompleted', macros.bg3.rest);
	Hooks.on('midi-qol.RollComplete', macros.bg3.healing);
	// Generic Hooks
	Hooks.on('dnd5e.restCompleted', rest);
	Hooks.on('closePromptRestDialog', preRest);
	Hooks.on('updateItem', levelUpHandler);
	Hooks.on('dnd5e.advancementManagerComplete', talentTreeLevelupHandler);
	Hooks.on('createItem', talentItemAddition);
});

globalThis['sorelliaAutomations'] = {
	bloodHunter,
	constants,
	helpers,
	queue,
	macros
}