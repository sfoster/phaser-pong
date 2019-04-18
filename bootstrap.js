"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

window.onload = function() {
  let containerNode = document.getElementById("pong-container");
  let stageWidth = containerNode.clientWidth;
  let stageHeight = stageWidth * 0.66;
  containerNode.style.width = stageWidth + "px";
  containerNode.style.height = stageHeight + "px";

  console.log(`init with stageWidth: ${stageWidth}, stageHeight: ${stageHeight}`);

  let gameConfig = {
    type: Phaser.AUTO,
    width: stageWidth,
    height: stageHeight,
    parent: 'pong-container',
    physics: {
      default: "arcade",
      arcade: {
        fps: 60,
        gravity: { y: 0 },
        //       debug: true,
      }
    },
    scene: [Controller, AboutScene, MenuScene, GameScene]
  };
  let game = Pong.game = new Phaser.Game(gameConfig);

  Pong.player1 = {};
  Pong.player2 = {};
  Pong.activeInputs = {};

  console.log("Enter state About");
}

class Controller extends Phaser.Scene {
  constructor () {
    super('Controller');
  }
  create ()
  {
    this.scene.launch('About');
    // this.scene.bringToTop('About');
  }
}
