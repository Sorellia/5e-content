import { helpers } from "../../../helpers.js";

export async function harnessDivinePower({speaker, actor, token, character, item, args, scope, workflow}) {
    let maxLevel = Math.ceil(actor.system.attributes.prof/2);
    let validLevels = [];
    for (let i = 1; i <= maxLevel; i++ ) {
        let key2 = 'spell' + i;
        let key = 'system.spells.' + key2 + '.value';
        if ((actor.system.spells[key2].value < actor.system.spells[key2].max) && actor.system.spells[key2].max > 0) validLevels.push({'level': i, 'key': key});
    }
    let pact = actor.system.spells.pact;
    if (pact.max > 0 && pact.level <= maxLevel && pact.value < pact.max) validLevels.push({'level': 'p', 'key': 'system.spells.pact.value'});

    if (!validLevels.length) {
        ui.notifications.info('You have no valid spell slots to regain!');
        return;
    }

    let options = validLevels.map(i => [(i.level != 'p' ? helpers.nth(i.level) + ' Level' : 'Pact Slot'), i.key]);
    let selection = options.length > 1 ? await helpers.dialog(workflow.item.name, options, 'Regan which spell slot?', 'column') : options[0][1];
    if (!selection) return;

    let value = getProperty(actor, selection);
    if (isNaN(value)) return;
    actor.update({[selection]: value + 1});
}