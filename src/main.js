const {app, ipcMain, BrowserWindow, nativeImage, Menu, Tray, session} = require('electron');
const {Settings} = require('./settings');
const path = require('path')
const contextMenu = require('electron-context-menu');
const player = require('play-sound')(opts = {});
const {dialog} = require('electron');

const settings = new Settings();

const icon_32 = path.join(app.getAppPath(), 'resources/icons/32.png');
const icon_unread_32 = path.join(app.getAppPath(), 'resources/icons/unread/32.png');
const icon_256 = path.join(app.getAppPath(), 'resources/icons/256.png');

const LANGUAGES = [
  'AM', 'AR', 'BG', 'BN', 'CA', 'CS', 'DA', 'DE', 'EL', 'ES',
  'ET', 'FA', 'FI', 'FR', 'GU', 'HE', 'HI', 'HR', 'HU', 'ID', 'IT',
  'JA', 'KN', 'KO', 'LT', 'LV', 'ML', 'MR', 'MS', 'NB', 'NL', 'PL',
  'RO', 'RU', 'SK', 'SL', 'SR', 'SV', 'SW', 'TA', 'TE', 'TH', 'TR',
  'UK', 'UR', 'VI',
];

const messages = {
  title: 'Google Messages',
  window: null,
  tray: null,
  debug: false,
}

function setLang(lang) {
  settings.lang = lang;
  dialog.showMessageBox({
    type: 'warning',
    buttons: ['Not now', 'Restart'],
    title: 'Restart',
    message: 'You need to restart to apply new lang, exit now?',
  }).then((r) => {
    if (r.response === 1) {
      process.exit();
    }
  });
}

function setTray(win) {
  const tray = new Tray(nativeImage.createFromPath(icon_32));
  const lang = settings.lang;

  const subMenu = [
    {
      label: 'Default',
      type: 'checkbox',
      checked: !lang || lang === '',
      click: () => {
        setLang(undefined);
      }
    }
  ];
  for (const language of LANGUAGES) {
    subMenu.push({
      label: language,
      type: 'checkbox',
      checked: lang === language,
      click: () => {
        setLang(language);
      }
    });
  }
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
      label: 'Play sound',
      type: 'checkbox',
      checked: settings.playSound,
      click: (e) => {
        settings.playSound = e.checked;
      }
    },
    {
      label: 'Language',
      type: 'submenu',
      submenu: subMenu,
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
    icon: nativeImage.createFromPath(icon_256),
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

  if (settings.lang) {
    const ll = settings.lang.toLowerCase();
    const lu = settings.lang.toUpperCase();
    const iso = `${ll}-${lu}`;

    console.log(`setSpellCheckerLanguages : [ ${iso}, ${ll}, en-US ]`);
    try {
      session.defaultSession.setSpellCheckerLanguages([iso, ll, "en-US"]);
    } catch (e) {
      console.error(e);
      try {
        session.defaultSession.setSpellCheckerLanguages([ll, "en-US"]);
      } catch (e) {
        console.error(e);
      }
    }
  }

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


  console.log(`icon_32 : ${icon_32}`);
  console.log(`icon_256 : ${icon_256}`);

  messages.window = window;
  messages.tray = setTray(window);
  messages.tray.setImage(nativeImage.createFromPath(icon_32));
}

if (!app.requestSingleInstanceLock()) {
  console.error("already running !");
  app.quit();
} else {
  console.log(`Lang Setting : ${settings.lang}`);

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
      const icon = nativeImage.createFromPath(count <= 0 ? icon_32 : icon_unread_32);

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
