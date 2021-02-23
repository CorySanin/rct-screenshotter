var params = ['filename', 'width', 'height', 'x', 'y', 'zoom', 'rotation', 'transparent'];
function main() {
    var options = {
        zoom: 1,
        rotation: ui.mainViewport.rotation
    };
    var position = {};
    params.forEach(function (param) {
        var value = context.sharedStorage.get("screenshotter." + param, null);
        if (value !== null) {
            options[param] = value;
        }
    });
    if ('x' in position && 'y' in position) {
        options.position = position;
    }
    context.captureImage(options);
    if (context.sharedStorage.get('screenshotter.quitwhendone', false)) {
        console.executeLegacy('abort');
    }
}
registerPlugin({
    name: 'screenshotter',
    version: '1.0.0',
    authors: ['Cory Sanin'],
    type: 'local',
    licence: 'MIT',
    main: main
});
