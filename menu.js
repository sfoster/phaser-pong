"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

function MenuState() {
  this.panelListeners = new Set();
  this.name = "menu";
}
MenuState.prototype = {
  preload() {
    uiUtils.hideAllPanels();
    this.game.activeInputs = {};
  },
  create() {
    let game = this.game;
    console.log("MenuState create");
    showPanel('menu', {
      top: 15, right: 15, bottom: 15, left: 15
    });
    let listener = uiUtils.handlePanelEvent("menu", "button", "click", () => {
      console.log("button click");
      this.state.start("Game");
    });
    this.panelListeners.add(listener);
    // TODO: some UI to pick/indicate controller for each player
    // player 1: pick controller [wasd, arrow, mouse, websocket-channel-a, websocket-channel-b]
    // player 2: pick controller [wasd, arrow, mouse, websocket-channel-a, websocket-channel-b]

    // add listeners, open websockets etc.
    this.prepareInputs();

    // this is what the UI / input detection would do:
    this.configureInputForPlayer("player1", "arrowKeys");
    this.configureInputForPlayer("player2", "wasdKeys");
  },
  prepareInputs() {
    let game = Pong.game;
    game.activeInputs.arrowKeys = {
      x: game.world.centerX,
      y: game.world.centerY,
      _left: game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
      _right: game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
      update() {
        if (this._left.isDown) {
          this.x = Math.max(this.x - 8, 0);
        }
        if (this._right.isDown) {
          this.x = Math.min(this.x + 8, game.world.width);
        }
      }
    };

    // maybe we can do this directly into game.input?
    // might want to go to phaser3 before putting time into extending it tho'
    game.activeInputs.wasdKeys = {
      x: game.world.centerX,
      y: game.world.centerY,
      _left: game.input.keyboard.addKey(Phaser.Keyboard.A),
      _right: game.input.keyboard.addKey(Phaser.Keyboard.D),
      update() {
        if (this._left.isDown) {
          this.x = Math.max(this.x - 8, 0);
        }
        if (this._right.isDown) {
          this.x = Math.min(this.x + 8, game.world.width);
        }
      }
    };

    game.activeInputs.mouse = {
      get x() {
        return game.input.x;
      }
    };
    game.activeInputs.auto = {
      get x() {
        return ball.x;
      }
    };
  },
  configureInputForPlayer(id, inputType) {
    let player = Pong[id];
    if (!player) {
      console.warn("Missing player with id: ", id, Pong);
      throw new Error("No such player with id: " + id);
    }
    player.inputType = inputType;
  },
  shutdown() {
    console.log("About shutdown, removing panel listeners");
    for (let listener of this.panelListeners) {
      listener.remove();
    }
    this.panelListeners.clear();
    uiUtils.hidePanel("menu");
  }
};
