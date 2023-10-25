import { bloodHunterRests } from '../macros/classFeatures/bloodHunter/bloodHunterRests.js';

export async function rest(actor) {
    await bloodHunterRests.rest(actor);
}

export async function preRest() {
    await bloodHunterRests.spectralNatureHandler();
}