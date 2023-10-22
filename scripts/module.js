import {bloodHunter} from './bloodHunter.js';
import {constants} from './constants.js';
import {helpers} from './helpers.js';
import {macros} from './macros.js';
import {registerFeatures} from './customFeatures.js';
import {remoteAimCrosshair, remoteDialog, remoteDocumentDialog, remoteDocumentsDialog, remoteMenu} from './utility/remoteDialog.js';
export let socket;

Hooks.once('init', async function() {
	console.log("5e Content | Initialising module!");
	registerFeatures();
});

Hooks.once('socketlib.ready', async function() {
	socket = socketlib.registerModule('5e-content');
	socket.register('remoteDialog', remoteDialog);
	socket.register('remoteDocumentDialog', remoteDocumentDialog);
	socket.register('remoteDocumentsDialog', remoteDocumentsDialog);
	socket.register('remoteAimCrosshair', remoteAimCrosshair);
	socket.register('remoteMenu', remoteMenu);
});

globalThis['sorelliaAutomations'] = {
	bloodHunter,
	constants,
	helpers,
	macros
}