const settings = require('electron-settings');

const SETTING_MINIMIZE = 'minimize';
const SETTING_START_HIDDEN = 'starthidden';
const SETTING_LANG = 'lang';
const SETTING_PLAY_SOUND = 'playsound';

class Settings {
  _startHidden = false;
  _minimize = true;
  _lang = undefined;
  _playSound = true;

  constructor() {
    if (settings.hasSync(SETTING_MINIMIZE))
      this._minimize = settings.getSync(SETTING_MINIMIZE);
    if (settings.hasSync(SETTING_LANG))
      this._lang = settings.getSync(SETTING_LANG);
    if (settings.hasSync(SETTING_START_HIDDEN))
      this._startHidden = settings.getSync(SETTING_START_HIDDEN);
    if (settings.hasSync(SETTING_PLAY_SOUND))
      this._playSound = settings.getSync(SETTING_PLAY_SOUND);
  }

  set startHidden(value) {
    this._startHidden = value;
    settings.setSync(SETTING_START_HIDDEN, value);
  }

  get startHidden() {
    return this._startHidden;
  }

  set minimize(value) {
    this._minimize = value;
    settings.setSync(SETTING_MINIMIZE, value);
  }

  get minimize() {
    return this._minimize;
  }

  set playSound(value) {
    this._playSound = value;
    settings.setSync(SETTING_MINIMIZE, value);
  }

  get playSound() {
    return this._playSound;
  }

  get lang() {
    return this._lang;
  }

  set lang(value) {
    this._lang = value;
    settings.setSync(SETTING_LANG, value);
  }
}

module.exports.Settings = Settings;
