const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Create application menu
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Export to Excel (CSV)',
                    click: () => {
                        mainWindow.webContents.send('export-excel');
                    }
                },
                {
                    label: 'Export to PDF',
                    click: () => {
                        mainWindow.webContents.send('export-pdf');
                    }
                },
                {
                    label: 'Export to JSON',
                    click: () => {
                        mainWindow.webContents.send('export-json');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Create Backup',
                    click: () => {
                        mainWindow.webContents.send('create-backup');
                    }
                },
                {
                    label: 'Import Backup',
                    click: () => {
                        mainWindow.webContents.send('import-backup');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Supply Office Inventory System',
                            message: 'Supply Office Inventory System',
                            detail: 'Version 4.20.69\n\nA simple inventory management system for the supply office.\n\nÂ© 2026 HSO Supply Office'
                        });
                    }
                },
                {
                    label: 'Documentation',
                    click: () => {
                        const readmePath = path.join(__dirname, 'README.md');
                        if (fs.existsSync(readmePath)) {
                            require('electron').shell.openPath(readmePath);
                        }
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle any errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
