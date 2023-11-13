export let bloodHunterHelpers = {
    'curseSpecialist': async function curseSpecialist(actor) {
        let previousRite = actor.getFlag('5e-content', 'curseSpecialist');
        let token = actor.getActiveTokens()[0].document;
        if (!token) return;
        actor.unsetFlag('5e-content', 'curseSpecialist');
        if (previousRite) {
            previousRite = actor.items.get(previousRite).toObject();
            await helpers.updateItemUses(token, previousRite, -1, true);
        }
        let foundRites = [];
        actor.items.forEach(item => {
            if (item.type === 'feat' && item.system.type.subtype === 'bloodRites') {
                foundRites.push([item.name, item.id]);
            }
        });

        let selection;
        if (foundRites.length === 0) return;
        if (foundRites.length === 1) selection = foundRites[0][1];
        if (!selection) selection = await helpers.dialog('Choose a Blood Rite', foundRites, 'Which rite would you like to imbue with curse specialist to grant a second use?', 'column');
        if (!selection) return;

        let riteData = actor.items.get(selection).toObject();

        await helpers.updateItemUses(token, riteData, 1, true);
        actor.setFlag('5e-content', 'curseSpecialist', selection);
    }
}