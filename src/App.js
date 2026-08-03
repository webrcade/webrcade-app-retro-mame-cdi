import React from "react";

import {
  WebrcadeRetroApp
} from '@webrcade/app-common';

import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';

import './App.scss';

class App extends WebrcadeRetroApp {
  createEmulator(app, isDebug) {
    return new Emulator(app, isDebug);
  }

  isDiscBased() {
    return true;
  }

  isBiosRequired() {
    return true;
  }

  getBiosMap() {
    return {
      'c59f92647701428bc453976740eb75cf': 'cdimono1.zip',
    };
  }

  getBiosUrls(appProps) {
    const bios = appProps.philipscdi_bios;
    if (!bios) return [];
    return Array.isArray(bios) ? bios : [bios];
  }

  renderPauseScreen() {
    const { appProps, emulator } = this;

    return (
      <EmulatorPauseScreen
        emulator={emulator}
        appProps={appProps}
        closeCallback={() => this.resume()}
        exitCallback={() => {
          this.exitFromPause();
        }}
        isEditor={this.isEditor}
        isStandalone={this.isStandalone}
      />
    );
  }
}

export default App;
