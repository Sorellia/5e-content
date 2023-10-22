import { registerFeatures } from './customFeatures.js';

Hooks.once("init", () => {
	registerFeatures();
});