import { helpers } from "../../../helpers.js";
import { bloodHunterHelpers } from "./bloodHunterHelpers.js";

export let bloodHunterRests = {
    'rest': async function rest(actor) {
        let curseSpecialist = helpers.getFeature(actor, 'Curse Specialist');
        if (curseSpecialist) await bloodHunterHelpers.curseSpecialist(actor);
    },
    'spectralNatureHandler': async function spectralNatureHandler() {
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
}

