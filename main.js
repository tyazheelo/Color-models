const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        show: false // Сначала скрываем окно
    });

    mainWindow.loadFile('colorModels.html');
    mainWindow.setMenu(null);

    // Ждем полной загрузки контента перед показом
    mainWindow.webContents.once('ready-to-show', () => {
        console.log('Window is ready to show');
        mainWindow.show();
        
        // Даем дополнительное время на рендеринг
        setTimeout(() => {
            mainWindow.focus();
        }, 100);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});