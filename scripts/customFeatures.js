export function registerFeatures() {
	let config = CONFIG.DND5E, classFeatures = config.featureTypes.class.subtypes, weaponTypes = config.weaponTypes;
	let newClassFeatureTypes = { bloodRites: "Blood Rite", inventorUpgrades: "Inventor Upgrade", savantRunes: "Savant Rune", scholarlyPursuits: "Scholarly Pursuit" };
	let newWeaponTypes = { simpleF: "Simple Firearm", martialF: "Martial Firearm"};
	classFeatures = Object.assign(classFeatures, newClassFeatureTypes);
	weaponTypes = Object.assign(weaponTypes, newWeaponTypes);
}