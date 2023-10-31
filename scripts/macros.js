// Blood Hunter Freatures
import { crimsonOffering } from './macros/classFeatures/bloodHunter/crimsonOffering.js';
import { riteOfAgony } from './macros/classFeatures/bloodHunter/rites/riteOfAgony.js';
import { riteOfBlindness } from './macros/classFeatures/bloodHunter/rites/riteOfBlindness.js';
import { riteOfDecay } from './macros/classFeatures/bloodHunter/rites/riteOfDecay.js';
import { riteOfMarking } from './macros/classFeatures/bloodHunter/rites/riteOfMarking.js';
import { riteOfSiphoning } from './macros/classFeatures/bloodHunter/rites/riteOfSiphoning.js';
import { sacrificialOffering } from './macros/classFeatures/bloodHunter/orderOfSaltAndIron/sacrificialOffering.js';
import { savant } from './macros/classFeatures/savant/savant.js';
import { spectralNature } from './macros/classFeatures/bloodHunter/orderOfSaltAndIron/spectralNature.js';
import { warriorExorcist } from './macros/classFeatures/bloodHunter/orderOfSaltAndIron/warriorExorcist.js';
import { linguistics } from './macros/classFeatures/savant/scholarlyPursuits/linguistics.js';
import { instruction } from './macros/classFeatures/savant/scholarlyPursuits/instruction.js';

export let macros = {
    // Blood Hunter macro exports
    'crimsonOffering': crimsonOffering,
    'riteOfAgony': riteOfAgony,
    'riteOfBlindness': riteOfBlindness,
    'riteOfDecay': riteOfDecay,
    'riteOfMarking': riteOfMarking,
    'riteOfSiphoning': riteOfSiphoning,
    'sacrificialOffering': sacrificialOffering,
    'spectralNature': spectralNature,
    'warriorExorcist': warriorExorcist,
    // Savant macro exports
    'savant': savant,
    'linguistics': linguistics,
    'instruction': instruction
}