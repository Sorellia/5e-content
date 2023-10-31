import { bloodHunterRests } from '../macros/classFeatures/bloodHunter/bloodHunterRests.js';
import { quickStudy } from '../macros/classFeatures/savant/quickStudy.js';
import { astrology } from '../macros/classFeatures/savant/scholarlyPursuits/astrology.js';
import { instruction } from '../macros/classFeatures/savant/scholarlyPursuits/instruction.js';

export async function rest(actor, details) {
    await quickStudy(actor);
    if (details.longRest) {
        await bloodHunterRests.rest(actor);
        await instruction.instructionRest(actor); 
        await astrology.longRest(actor);
    }
}

export async function preRest() {
    await bloodHunterRests.spectralNatureHandler();
}