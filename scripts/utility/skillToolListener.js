import { onSkillToolRollMastery } from "../macros/classFeatures/savant/scholarlyPursuits/skillMastery.js";

export async function skillToolRoll(actor, rollData, skillName) {
    await onSkillToolRollMastery(actor, rollData, skillName);
}