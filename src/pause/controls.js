import React from 'react';

import { ControlsTab } from '@webrcade/app-common';

export class GamepadControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {/* {this.renderControl('lanalog', 'Move Cursor')}
        {this.renderControl('dpad', 'Move Cursor')}
        {this.renderControl('a', 'Button 1 (Z)')}
        {this.renderControl('b', 'Button 2 (X)')}
        {this.renderControl('x', 'Button 3 (S)')} */}
      </>
    );
  }
}

export class KeyboardControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {/* {this.renderKey('ArrowUp', 'Move Cursor Up')}
        {this.renderKey('ArrowDown', 'Move Cursor Down')}
        {this.renderKey('ArrowLeft', 'Move Cursor Left')}
        {this.renderKey('ArrowRight', 'Move Cursor Right')}
        {this.renderKey('KeyZ', 'Button 1 (Z)')}
        {this.renderKey('KeyX', 'Button 2 (X)')}
        {this.renderKey('KeyC', 'Button 3 (S)')} */}
      </>
    );
  }
}
