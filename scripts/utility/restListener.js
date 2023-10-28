import { bloodHunterRests } from '../macros/classFeatures/bloodHunter/bloodHunterRests.js';
import { quickStudy } from '../macros/classFeatures/savant/quickStudy.js';

export async function rest(actor) {
    await bloodHunterRests.rest(actor);
    await quickStudy(actor);
}

export async function preRest() {
    await bloodHunterRests.spectralNatureHandler();
}