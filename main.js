let { app, BrowserWindow } = require('electron');

let mainWindow = null;

let createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280, minWidth: 720, maxWidth: 1920,
        height: 720, minHeight: 360, maxHeight: 1080,

        webPreferences : {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        autoHideMenuBar: true
    })

    mainWindow.loadFile(__dirname + '/ui/index.html');

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });
}

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})