import { constants } from "../../../constants.js";
import { helpers } from "../../../helpers.js";

export async function tactician({token, item}) {
    if (!helpers.inCombat() || !item.system.uses.value) return false;
    let nearbyAllies = helpers.findNearby(token, 60, 'ally', true).filter(i => helpers.getCombatant(i.document) && helpers.getCombatant(i.document).initiative <= helpers.getCombatant(token).initiative);

    if (!nearbyAllies.length || nearbyAllies.length < 2) {
        ui.notifications.info('Insufficient nearby allies found!');
        return false;
    }

    let targets;
    if (nearbyAllies.length > 2) {
        let selectedAllies = await helpers.selectTarget('Select 2 allies to affect', constants.okCancelButton, nearbyAllies, true, 'multiple');
        if (!selectedAllies.buttons) return false;
        if (selectedAllies.inputs.filter(i => !!i).length != 2) {
            ui.notifications.info('You MUST select exactly two allies!');
            return false;
        }
        targets = selectedAllies.inputs;
        targets = targets.filter(element => element != false);
    } else {
        ui.notifications.info('Only two valid allies found! Swapping their positions automatically.');
        targets = nearbyAllies.map(i => i.document.uuid);
    }

    let mainTarget = helpers.getCombatant(fromUuidSync(targets[0]));
    let secondaryTarget = helpers.getCombatant(fromUuidSync(targets[1]));
    let mainInit = mainTarget.initiative, secondaryInit = secondaryTarget.initiative;

    await helpers.updateCombatant(mainTarget, {'initiative': secondaryInit});
    await helpers.updateCombatant(secondaryTarget, {'initiative': mainInit});
}
