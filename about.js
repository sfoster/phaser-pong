"use strict";

function AboutState() {
  this.panelListeners = new Set();
};
AboutState.prototype = {
  preload() {
    console.log("About preload");
    console.log("Preload all the game assets");
    let game = Pong.game;
    for (let [name, value] of Object.entries(assetPack)) {
      if (value.src) {
        game.load.image(name, value.src);
      }
    }
  },
  create() {
    console.log("About create");
    let game = this.game;
    //loading screen will have a plain background
    game.stage.backgroundColor = "#666";
    let gameBounds = Object.assign({}, game.world.bounds);
    let panelBounds = {
      top: 15,
      right: 15,
      bottom: gameBounds.height / 2,
      left: 15,
    };
    uiUtils.showPanel("about", panelBounds);
    let listener = uiUtils.handlePanelEvent("about", "button", "click", () => {
      console.log("button click");
      this.state.start("Menu");
    });
    this.panelListeners.add(listener);
  },
  shutdown() {
    console.log("About shutdown, removing panel listeners");
    for (let listener of this.panelListeners) {
      listener.remove();
    }
    this.panelListeners.clear();
    uiUtils.hidePanel("about");
  }
};

