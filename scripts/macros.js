// Blood Hunter Freatures
import { crimsonOffering } from './macros/classFeatures/bloodHunter/crimsonOffering.js';
import { riteOfAgony } from './macros/classFeatures/bloodHunter/rites/riteOfAgony.js';
import { riteOfBlindness } from './macros/classFeatures/bloodHunter/rites/riteOfBlindness.js';
import { riteOfDecay } from './macros/classFeatures/bloodHunter/rites/riteOfDecay.js';
import { riteOfMarking } from './macros/classFeatures/bloodHunter/rites/riteOfMarking.js';
import { riteOfSiphoning } from './macros/classFeatures/bloodHunter/rites/riteOfSiphoning.js';
import { sacrificialOffering } from './macros/classFeatures/bloodHunter/orderOfSaltAndIron/sacrificialOffering.js';
import { spectralNature } from './macros/classFeatures/bloodHunter/orderOfSaltAndIron/spectralNature.js';
import { warriorExorcist } from './macros/classFeatures/bloodHunter/orderOfSaltAndIron/warriorExorcist.js';
// Savant Features
import { savant } from './macros/classFeatures/savant/savant.js';
import { linguistics } from './macros/classFeatures/savant/scholarlyPursuits/linguistics.js';
import { instruction } from './macros/classFeatures/savant/scholarlyPursuits/instruction.js';
// Cleric Features
import { harnessDivinePower } from './macros/classFeatures/cleric/harnessDivinePower.js';
import { turnUndead } from './macros/classFeatures/cleric/turnUndead.js';
// Baldurs Gate 3
import { bg3 } from './macros/variantRules/bg3/bg3.js';
// Talents
import { talents } from './macros/variantRules/talentTrees.js';


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
    'instruction': instruction,
    // Cleric macro exports
    'harnessDivinePower': harnessDivinePower,
    'turnUndead': turnUndead,
    // BG3
    'bg3': bg3,
    // Talents
    'talents': talents
}