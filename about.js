"use strict";

class AboutScene extends Phaser.Scene {
  constructor() {
    super("About");
    this.panelListeners = new Set();
  }
  preload() {
    console.log("About preload");
    console.log("Preload all the game assets");
    for (let [name, value] of Object.entries(assetPack)) {
      if (value.src) {
        this.load.image(name, value.src);
      }
    }
  }
  create() {
    window.currentScene = this;
    console.log("About create");
    let game = this.game;
    let panelBounds = {
      top: 15,
      right: 15,
      bottom: 15, // gameBounds.height / 2,
      left: 15,
    };
    uiUtils.showPanel("about", panelBounds);
    let listener = uiUtils.handlePanelEvent("about", "button", "click", () => {
      console.log("button click");
      this.scene.launch("Menu");
    });
    this.panelListeners.add(listener);
  }
  shutdown() {
    console.log("About shutdown, removing panel listeners");
    for (let listener of this.panelListeners) {
      listener.remove();
    }
    this.panelListeners.clear();
    uiUtils.hidePanel("about");
  }
};

