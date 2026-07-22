import {
  Controller,
  Controllers,
  RetroAppWrapper,
  KeyCodeToControlMapping,
  DisplayLoop,
  CIDS,
  KCODES,
  LOG,
} from '@webrcade/app-common';

export class Emulator extends RetroAppWrapper {

  GAME_SRAM_NAME = 'game';
  SAVE_NAME = 'sav';

  // Every CD-i disc is staged to the same local filename ("game.chd"), so
  // MAME's own nvram_filename() can't tell games apart (see machine.cpp).
  // Keep different games' NVRAM isolated here instead, by uid.
  get NVRAM_DIR() {
    return `/home/web_user/retroarch/userdata/saves/mame/nvram/${this.uid}`;
  }

  MOUSE_LEFT = 1;
  MOUSE_MIDDLE = 1 << 1;
  MOUSE_RIGHT = 1 << 2;

  constructor(app, debug = false) {
    super(app, debug);
    window.emulator = this;
    this.frequency = 60;
    this.lastFrequency = 60;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseButtons = 0;
    this.gameRunning = false;

    this.pointerLockHandler = async () => {
      if (!document.pointerLockElement) {
        await this.canvas.requestPointerLock();
      }
    };

    document.onmousemove = (e) => {
      this.mouseX += e.movementX;
      this.mouseY += e.movementY;
    };
    document.onmousedown = (e) => {
      if (e.button === 0) this.mouseButtons |= this.MOUSE_LEFT;
      if (e.button === 1) this.mouseButtons |= this.MOUSE_MIDDLE;
      if (e.button === 2) this.mouseButtons |= this.MOUSE_RIGHT;
    };
    document.onmouseup = (e) => {
      if (e.button === 0) this.mouseButtons &= ~this.MOUSE_LEFT;
      if (e.button === 1) this.mouseButtons &= ~this.MOUSE_MIDDLE;
      if (e.button === 2) this.mouseButtons &= ~this.MOUSE_RIGHT;
    };
    document.oncontextmenu = (e) => e.preventDefault();

    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement) {
        this.mouseX = 0;
        this.mouseY = 0;
      }
    });
  }

  createControllers() {
    return new Controllers([
      new Controller(
        new KeyCodeToControlMapping({
          [KCODES.ARROW_UP]: CIDS.UP,
          [KCODES.ARROW_DOWN]: CIDS.DOWN,
          [KCODES.ARROW_RIGHT]: CIDS.RIGHT,
          [KCODES.ARROW_LEFT]: CIDS.LEFT,
          [KCODES.Z]: CIDS.X,
          [KCODES.X]: CIDS.A,
          [KCODES.C]: CIDS.B,
          [KCODES.SHIFT_RIGHT]: CIDS.SELECT,
          [KCODES.ENTER]: CIDS.START,
          [KCODES.ESCAPE]: CIDS.ESCAPE
        })
      ),
      new Controller(),
      new Controller(),
      new Controller(),
    ]);
  }

  setPointerLock(lock) {
    if (!this.canvas) return;
    if (lock) {
      this.canvas.addEventListener('click', this.pointerLockHandler);
    } else {
      this.canvas.removeEventListener('click', this.pointerLockHandler);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }

  setIsNtsc(ntsc) {
    this.frequency = ntsc ? 60 : 50;
    LOG.info('CDI frequency set to: ' + this.frequency + 'Hz');
  }

  getDisplayLoopReturn() {
    if (this.lastFrequency !== this.frequency) {
      this.lastFrequency = this.frequency;
      return this.frequency;
    }
    return undefined;
  }

  setGameRunning(running) {
    this.gameRunning = running;
    this.setPointerLock(running);
  }

  onPause(p) {
    this.setPointerLock(!p && this.gameRunning);
    super.onPause(p);
  }

  onFrame() {
    if (!this.gameRunning) {
      this.setGameRunning(true);
    }
  }

  getScriptUrl() {
    return 'js/cdi_libretro.js';
  }

  getPrefs() {
    return this.prefs;
  }

  getHashFileExtension() {
    return 'chd';
  }

  setRoms(uid, frontendArray, biosBuffers, romBytes, ext) {
    super.setRoms(uid, frontendArray, biosBuffers, romBytes, ext);
    this.game = this.RA_DIR + 'cdimono1/game.chd';
  }

  pollControls() {
    if (window.Module && window.Module._wrc_update_mouse) {
      window.Module._wrc_update_mouse(this.mouseX, this.mouseY, this.mouseButtons);
    }
    this.mouseX = 0;
    this.mouseY = 0;
    super.pollControls();
  }

  isEscapeHackEnabled() {
    return false;
  }

  async applyGameSettings() {
  }

  async onWriteAdditionalFiles() {
    await super.onWriteAdditionalFiles();
    const { FS } = window;

    try { FS.mkdir('/home/web_user/retroarch/userdata/system/mame'); } catch (e) {}
    try { FS.mkdir('/home/web_user/retroarch/userdata/system/mame/bios'); } catch (e) {}
    try { FS.mkdir(this.RA_DIR + 'cdimono1'); } catch (e) {}
    try { FS.mkdir('/home/web_user/retroarch/userdata/saves/mame'); } catch (e) {}
    try { FS.mkdir('/home/web_user/retroarch/userdata/saves/mame/nvram'); } catch (e) {}
    try { FS.mkdir(this.NVRAM_DIR); } catch (e) {}

    // Write MAME.opt config
    const mameOpt =
      'mame_alternate_renderer = "disabled"\n' +
      'mame_altres = "640x480"\n' +
      'mame_auto_save = "disabled"\n' +
      'mame_autoloadfastforward = "disabled"\n' +
      'mame_boot_to_bios = "disabled"\n' +
      'mame_boot_to_osd = "disabled"\n' +
      'mame_buttons_profiles = "disabled"\n' +
      'mame_cheats_enable = "disabled"\n' +
      'mame_coin_limit = "0"\n' +
      'mame_cpu_overclock = "default"\n' +
      'mame_cpu_sound_overclock = "default"\n' +
      'mame_joystick_deadzone = "0.15"\n' +
      'mame_joystick_saturation = "0.85"\n' +
      'mame_joystick_threshold = "0.30"\n' +
      'mame_lightgun_mode = "none"\n' +
      'mame_lightgun_offscreen_mode = "free"\n' +
      'mame_mame_4way_enable = "disabled"\n' +
      'mame_mame_paths_enable = "disabled"\n' +
      'mame_media_type = "cdrm"\n' +
      'mame_mouse_enable = "enabled"\n' +
      'mame_read_config = "disabled"\n' +
      'mame_rotation_mode = "libretro"\n' +
      'mame_saves = "game"\n' +
      'mame_softlists_auto_media = "enabled"\n' +
      'mame_softlists_enable = "disabled"\n' +
      'mame_thread_mode = "disabled"\n' +
      'mame_throttle = "disabled"\n' +
      'mame_write_config = "disabled"\n';

    try {
      FS.writeFile('/home/web_user/retroarch/userdata/config/MAME/MAME.opt', mameOpt);
    } catch (e) {
      LOG.error('Error writing MAME.opt config: ' + e);
    }

    // Write CDI BIOS zip to MAME bios path
    const biosBuffers = this.biosBuffers;
    LOG.info('biosBuffers keys: ' + (biosBuffers ? Object.keys(biosBuffers).join(', ') : 'null'));
    if (biosBuffers && biosBuffers['cdimono1.zip']) {
      try {
        FS.writeFile(
          '/home/web_user/retroarch/userdata/system/mame/bios/cdimono1.zip',
          biosBuffers['cdimono1.zip'],
        );
        const verify = FS.readFile('/home/web_user/retroarch/userdata/system/mame/bios/cdimono1.zip');
        LOG.info('Wrote cdimono1.zip BIOS, size: ' + verify.length);
      } catch (e) {
        LOG.error('Error writing CDI BIOS: ' + e);
      }
    }
  }

  isForceAspectRatio() {
    return false;
  }

  getDefaultAspectRatio() {
    return 1.333;
  }

  resizeScreen(canvas) {
    this.canvas = canvas;
    this.updateScreenSize();
  }

  createDisplayLoop(debug) {
    return new DisplayLoop(
      this.frequency,
      true,
      debug,
      false,
    );
  }

  getShotAspectRatio() { return this.getDefaultAspectRatio(); }

  async saveState() {
    const { saveStatePath, started } = this;
    const { FS, Module } = window;

    try {
      if (!started) return;

      Module._cmd_savefiles();

      const path = `${this.NVRAM_DIR}/${this.GAME_SRAM_NAME}`;
      LOG.info('Checking: ' + path);
      const files = [];
      try {
        const s = FS.readFile(path);
        if (s) {
          LOG.info('Found save file: ' + path);
          files.push({ name: this.SAVE_NAME, content: s });
        }
      } catch (e) {}

      if (files.length > 0) {
        if (await this.getSaveManager().checkFilesChanged(files)) {
          await this.getSaveManager().save(saveStatePath, files, this.saveMessageCallback);
        }
      } else {
        await this.getSaveManager().delete(path);
      }
    } catch (e) {
      LOG.error('Error persisting save state: ' + e);
    }
  }

  async loadState() {
    const { saveStatePath } = this;
    const { FS } = window;

    // // Warm the cloud check cache to eliminate delay when opening settings
    // try {
    //   await this.getSaveManager().isCloudEnabled(this.loadMessageCallback);
    // } finally {
    //   this.loadMessageCallback(null);
    // }

    try {
      const files = await this.getSaveManager().load(saveStatePath, this.loadMessageCallback);
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          if (f.name === this.SAVE_NAME) {
            const path = `${this.NVRAM_DIR}/${this.GAME_SRAM_NAME}`;
            LOG.info(`writing ${path} file`);
            FS.writeFile(path, f.content);
          }
        }
        await this.getSaveManager().checkFilesChanged(files);
      }
    } catch (e) {
      LOG.error('Error loading save state: ' + e);
    }
  }
}
