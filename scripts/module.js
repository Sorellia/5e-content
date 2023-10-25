import {bloodHunter} from './macros/classFeatures/bloodHunter/bloodHunter.js';
import {constants} from './constants.js';
import {helpers} from './helpers.js';
import {macros} from './macros.js';
import {queue} from './utility/queue.js';
import {registerFeatures} from './customFeatures.js';
import {remoteAimCrosshair, remoteDialog, remoteDocumentDialog, remoteDocumentsDialog, remoteMenu} from './utility/remoteDialog.js';
import {rest, preRest } from './utility/restListener.js';
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
	Hooks.on('midi-qol.preAttackRoll', macros.riteOfBlindness.reactionDefense);
	Hooks.on('midi-qol.damageApplied', macros.sacrificialOffering.onDamage);
	Hooks.on('dnd5e.restCompleted', rest);
	Hooks.on('closePromptRestDialog', preRest);
});

globalThis['sorelliaAutomations'] = {
	bloodHunter,
	constants,
	helpers,
	queue,
	macros
}