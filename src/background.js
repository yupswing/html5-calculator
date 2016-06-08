chrome.app.runtime.onLaunched.addListener(function() {
    chrome.storage.local.get('bounds', function(obj) {
        console.log('storage get');
        console.log(obj);
        var bounds = {
            'width': 550,
            'height': 400,
            'minWidth': 200,
            'minHeight': 160,
        };
        if (obj.bounds) {
            bounds.width = obj.bounds.width;
            bounds.height = obj.bounds.height;
            bounds.top = obj.bounds.top;
            bounds.left = obj.bounds.left;
        }
        console.log(obj.bounds);
        chrome.app.window.create('index.html', {
            'id': 'quickalc',
            'outerBounds': bounds
        });
    });

});

chrome.app.window.onClosed.addListener(function() {
    var outerBounds = chrome.app.window.get('quickalc');
    var bounds = {
        width: outerBounds.width,
        height: outerBounds.height,
        top: outerBounds.top,
        left: outerBounds.left
    };
    console.log(outerBounds);
    chrome.storage.local.set({
        'bounds': bounds,
    });
})
