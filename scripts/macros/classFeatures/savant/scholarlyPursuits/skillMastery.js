export async function onSkillToolRollMastery(actor, rollData, skillName) {
    let skillMastery = actor.getFlag('5e-content', `savant.skillMastery.${skillName}`) ?? false;
    if (!skillMastery) return;

    let diceType = rollData.dice[0].modifiers;
    if (diceType.includes('kl') || diceType.includes('kh')) {
        let oldResult, difference;
        if (rollData.dice[0].results[0].result < 8 && rollData.dice[0].results[0].active) {
            oldResult = rollData.dice[0].results[0].result;
            difference = 8 - oldResult;
            rollData.dice[0].results[0].result = 8;
        } else if (rollData.dice[0].results[1].result < 8 && rollData.dice[0].results[1].active) {
            oldResult = rollData.dice[0].results[1].result;
            difference = 8 - oldResult;
            rollData.dice[0].results[1].result = 8;
        }
        rollData._total += difference;
    } else {
        if (rollData.dice[0].results[0].result < 8) {
            let oldResult = rollData.dice[0].results[0].result;
            let difference = 8 - oldResult;
            rollData.dice[0].results[0].result = 8;
            rollData._total += difference;
        }
    }
}