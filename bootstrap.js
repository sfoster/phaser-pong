"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

window.onload = function() {
  let stageHeight = document.documentElement.clientHeight;
  let stageWidth = stageHeight * 0.75;
  console.log(`init with stageWidth: ${stageWidth}, stageHeight: ${stageHeight}`);

  let gameConfig = {
     type: Phaser.AUTO,
     width: stageWidth,
     height: stageHeight,
     backgroundColor: 0x000000,
     parent: 'pong-container',
  };
  let game = Pong.game = new Phaser.Game(gameConfig);
  game.state.add("About", AboutState);
  game.state.add("Menu", MenuState);
  game.state.add("Game", GameState);
  console.log("Enter state About");
  game.state.start("About");
}

