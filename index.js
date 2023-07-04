const {app,BrowserWindow} = require('electron');
let mainWindow;

app.on('ready', () => {

    mainWindow = new BrowserWindow({
        width: 700,
        height: 700,
        resizable: true,
        title: "PDV - Automatize",
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadURL(`File://${__dirname}/index.html`)

});