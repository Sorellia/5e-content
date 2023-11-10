import { helpers } from "../../../helpers.js";
import { actorEditorHelpers } from "../../../utility/actorEditorHelpers.js";

export async function quickStudy(actor) {
    let quickStudy = helpers.getFeature(actor, 'Quick Study');
    if (!quickStudy) return;
    let keepPrev, previousProf = actor.getFlag('5e-content', 'savant.quickStudy.prof') ?? false;
    if (previousProf) {
        let previousProfLabel = actor.getFlag('5e-content', 'savant.quickStudy.label'); 
        keepPrev = await helpers.dialog('Quick Study: Previous Proficiency Found', [['Keep It', true], ['Choose a New Proficiency', false]], `Your previous Quick Study choice was ${previousProfLabel}. Would you like to keep this proficiency, or choose a new one?`);
        if (!keepPrev) {
            let previousProfType = actor.getFlag('5e-content', 'savant.quickStudy.type');
            switch (previousProfType) {
                case 'skill':
                    await helpers.updateSkillProf(actor, previousProf, 'untrained');
                    break;
                case 'weapon':
                    await helpers.updateWeaponProf(actor, previousProf, 'remove');
                    break;
                case 'tool':
                    await helpers.updateToolProf(actor, previousProf, 'remove');
                    break;
                case 'language':
                    await helpers.updateLanguages(actor, previousProf, true);
                default:
                    break;
            }
            actor.unsetFlag('5e-content', 'savant.quickStudy.type');
            actor.unsetFlag('5e-content', 'savant.quickStudy.prof');
            actor.unsetFlag('5e-content', 'savant.quickStudy.label');
            actor.unsetFlag('5e-content', 'savant.quickStudy');
        }
    }
    if (!keepPrev) {
        let returnData, choices = await helpers.dialog('Quick Study', [['Language', 'language'], ['Skill', 'skill'], ['Tool', 'tool'], ['Weapon', 'weapon']], 'You may learn a single type of proficiency. Which would you like to choose from?', 'column');

        switch (choices) {
            case 'language':
                if (helpers.getFeature(actor, 'Student of Runes')) returnData = await actorEditorHelpers.selectLanguage(actor, [], ['cant']);
                else returnData = await actorEditorHelpers.selectLanguage(actor, []);
                break;
            case 'skill':
                returnData = await actorEditorHelpers.selectSkill(actor);
                break;
            case 'tool':
                returnData = await actorEditorHelpers.selectTool(actor);
                break;
            case 'weapon':
                returnData = await actorEditorHelpers.selectWeapon(actor, [], ['simpleR', 'simpleM', 'Shortsword']);
                break;
            default:
                break;
        }
        actor.setFlag('5e-content', 'savant.quickStudy.type', choices);
        actor.setFlag('5e-content', 'savant.quickStudy.prof', returnData[0]);
        actor.setFlag('5e-content', 'savant.quickStudy.label', returnData[1]);
    }
}