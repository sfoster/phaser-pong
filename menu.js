"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
    this.panelListeners = new Set();
    this.name = "menu";
  }
  get activeInputs() {
    return Pong.activeInputs;
  }
  preload() {
    uiUtils.hideAllPanels();
  }
  create() {
    console.log("MenuState create");
    showPanel('menu', {
      top: 15, right: 15, bottom: 15, left: 15
    });
    let listener = uiUtils.handlePanelEvent("menu", "button", "click", () => {
      console.log("button click");
      this.scene.launch("Game");
    });
    this.panelListeners.add(listener);
    // TODO: some UI to pick/indicate controller for each player
    // player 1: pick controller [wasd, arrow, mouse, websocket-channel-a, websocket-channel-b]
    // player 2: pick controller [wasd, arrow, mouse, websocket-channel-a, websocket-channel-b]

    // add listeners, open websockets etc.
    this.prepareInputs();

    // this is what the UI / input detection would do:
    this.configureInputForPlayer("player1", "wasdKeys");
    this.configureInputForPlayer("player2", "arrowKeys");
  }
  prepareInputs() {
    let game = Pong.game;
    let dims = {
      centerX: this.cameras.main.midPoint.x,
      centerY: this.cameras.main.midPoint.y,
      width: this.cameras.main.width,
      height: this.cameras.main.height,
    };
    this.activeInputs.arrowKeys = {
      x: dims.centerX,
      y: dims.centerY,
      _cursors: this.input.keyboard.createCursorKeys(),
      update() {
        if (this._cursors.left.isDown) {
          this.x = Math.max(this.x - 8, 0);
        }
        if (this._cursors.right.isDown) {
          this.x = Math.min(this.x + 8, dims.width);
        }
        if (this._cursors.up.isDown) {
          this.y = Math.max(this.y - 8, 0);
        }
        if (this._cursors.down.isDown) {
          this.y = Math.min(this.y + 8, dims.height);
        }
      }
    };

    // maybe we can do this directly into this.input?
    // might want to go to phaser3 before putting time into extending it tho'
    this.activeInputs.wasdKeys = {
      x: dims.centerX,
      y: dims.centerY,
      _left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      _right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      _up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      _down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      update() {
        console.log("activeInputs wasdKeys update")
        if (this._left.isDown) {
          this.x = Math.max(this.x - 8, 0);
        }
        if (this._right.isDown) {
          this.x = Math.min(this.x + 8, dims.width);
        }
        if (this._up.isDown) {
          this.y = Math.max(this.y - 8, 0);
        }
        if (this._down.isDown) {
          this.y = Math.min(this.y + 8, dims.height);
        }
      }
    };

    this.activeInputs.mouse = {
      get x() {
        return this.input.x;
      },
      get y() {
        return this.input.y;
      }
    };
    this.activeInputs.auto = {
      get x() {
        return ball.x;
      },
      get y() {
        return ball.y;
      }
    };
  }
  configureInputForPlayer(id, inputType) {
    let player = Pong[id];
    if (!player) {
      console.warn("Missing player with id: ", id, Pong);
      throw new Error("No such player with id: " + id);
    }
    player.inputType = inputType;
  }
  shutdown() {
    console.log("About shutdown, removing panel listeners");
    for (let listener of this.panelListeners) {
      listener.remove();
    }
    this.panelListeners.clear();
    uiUtils.hidePanel("menu");
  }
};
