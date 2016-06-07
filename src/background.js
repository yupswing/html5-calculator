chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        'outerBounds': {
            'width': 550,
            'height': 400,
            'minWidth': 200,
            'minHeight': 160,
        }
    });

});
