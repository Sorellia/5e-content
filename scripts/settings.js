let moduleName = '5e-content';
export function registerSettings() {
    game.settings.register(moduleName, 'LastGM', {
        'name': 'LastGM',
        'hint': 'Last GM to join the game.',
        'scope': 'world',
        'config': false,
        'type': String
    });
}