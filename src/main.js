const {app, ipcMain, BrowserWindow, nativeImage, Menu, Tray, session} = require('electron');
const {Settings} = require('./settings');
const path = require('path')
const contextMenu = require('electron-context-menu');
const player = require('play-sound')(opts = {});

const settings = new Settings();
const messages = {
  title: 'Google Messages',
  window: null,
  tray: null,
  debug: false,
}

function setTray(win) {
  const tray = new Tray(nativeImage.createFromPath(path.join(app.getAppPath(), `resources/icons/32.png`)));

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        win.show();
      }
    },
    {
      label: 'Minimize on close',
      type: 'checkbox',
      checked: settings.minimize,
      click: (e) => {
        settings.minimize = e.checked;
      }
    },
    {
      label: 'Start hidden',
      type: 'checkbox',
      checked: settings.startHidden,
      click: (e) => {
        settings.startHidden = e.checked;
      }
    },
    {
      label: 'PLay sound',
      type: 'checkbox',
      checked: settings.playSound,
      click: (e) => {
        settings.playSound = e.checked;
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.exit();
      }
    }
  ]));
  tray.setToolTip(messages.title);
  tray.setTitle(messages.title);

  return tray;
}


function createWindow() {
  const window = new BrowserWindow({
    webPreferences: {
      autoplayPolicy: 'user-gesture-required',
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
      disableBlinkFeatures: 'Auxclick', // Security
      preload: path.join(app.getAppPath(), 'src/preload.js'),
      spellcheck: true,
    },
    show: false,
    icon: nativeImage.createFromPath(path.join(app.getAppPath(), 'resources/icons/256.png')),
    minHeight: 570,
    minWidth: 480,
    center: true,
    title: messages.title,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
  });

  contextMenu({
    showSaveImage: true,
    showCopyImageAddress: true,
  });

  session.defaultSession.setSpellCheckerLanguages([
    "fr-FR",
    "en-US"
  ]);

  if (messages.debug) {
    window.webContents.openDevTools()
  }

  window.once('ready-to-show', () => {
    if (!settings.startHidden) {
      window.show();
    }
  });

  window.loadURL('https://messages.google.com/web/').then(() => {
    console.log("loadURL() done.");
  });

  window.on('close', function (event) {
    if (settings.minimize) {
      event.preventDefault();
      window.hide();
      return false;
    }
    return true;
  });

  messages.window = window;
  messages.tray = setTray(window);
}

if (!app.requestSingleInstanceLock()) {
  console.error("already running !");
  app.quit();
} else {
  if (settings.lang) {
    app.commandLine.appendSwitch('lang', settings.lang);
  }

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    ipcMain.on('unread', (event, count) => {
      console.log(`receive unread count : ${count}`);
      const icon = nativeImage.createFromPath(
        path.join(app.getAppPath(), count <= 0 ?
          'resources/icons/32.png' :
          'resources/icons/unread/32.png'
        )
      );
      messages.tray.setImage(icon);
      if (settings.playSound && count > 0) {
        player.play(path.join(app.getAppPath(), 'resources/sound.mp3'), function (err) {
          if (err) {
            console.log(err);
          }
        })
      }
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
