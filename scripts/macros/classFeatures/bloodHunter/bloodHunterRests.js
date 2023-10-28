import { helpers } from "../../../helpers.js";

async function rest(actor) {
    let curseSpecialist = helpers.getFeature(actor, 'Curse Specialist');
    if (curseSpecialist) {
        let previousRite = actor.getFlag('5e-content', 'curseSpecialist');
        let token = actor.getActiveTokens()[0].document;
        if (!token) return;
        actor.unsetFlag('5e-content', 'curseSpecialist');
        if (previousRite) {
            previousRite = actor.items.get(previousRite).toObject();
            await helpers.updateItemUses(token, previousRite, -1, true);
        }
        let foundRites = [];
        actor.items.forEach(item => {
            if (item.type === 'feat' && item.system.type.subtype === 'bloodRites') {
                foundRites.push([item.name, item.id]);
            }
        });

        let selection;
        if (foundRites.length === 0) return;
        if (foundRites.length === 1) selection = foundRites[0][1];
        if (!selection) selection = await helpers.dialog('Choose a Blood Rite', foundRites, 'Which rite would you like to imbue with curse specialist to grant a second use?', 'column');
        if (!selection) return;

        let riteData = actor.items.get(selection).toObject();

        await helpers.updateItemUses(token, riteData, 1, true);
        actor.setFlag('5e-content', 'curseSpecialist', selection);
    }
}
async function spectralNatureHandler() {
    for (const actor of game.actors) {
        let spectralNature = helpers.getFeature(actor, 'Spectral Nature');
        if (spectralNature) {
            let restTypeData = game.restrecovery.getActiveProfileData();
            let baseFood = restTypeData['food-units-per-day'];
            let baseWater = restTypeData['water-units-per-day'];
            let foodToEat, waterToDrink, spectralMastery = helpers.getFeature(actor, 'Spectral Mastery');
            if (!spectralMastery) {
                foodToEat = baseFood/2;
                waterToDrink = baseWater/2;
                actor.setFlag('rest-recovery', 'data.sated.food', foodToEat);
                actor.setFlag('rest-recovery', 'data.sated.water', waterToDrink);
            } else {
                let noFoodFlag = actor.getFlag('dae', 'rest-recovery.force.noFood');
                if (!noFoodFlag) {
                    actor.setFlag('dae', 'rest-recovery.force.noFood', 1);
                    actor.setFlag('dae', 'rest-recovery.force.noWater', 1);
                }
            }
        }
    }
}

export let bloodHunterRests = {
    'rest': rest,
    'spectralNatureHandler': spectralNatureHandler
}

