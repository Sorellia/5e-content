export function registerFeatures() {
	let config = CONFIG.DND5E;
	let classFeatures = config.featureTypes.class.subtypes;
	let newClassFeatureTypes = { bloodRites: "Blood Rite", inventorUpgrades: "Inventor Upgrade", savantRunes: "Savant Rune", scholarlyPursuits: "Scholarly Pursuit" };
	classFeatures = Object.assign(classFeatures, newClassFeatureTypes);
}