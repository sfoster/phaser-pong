"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

window.onload = function() {
  let stageWidth = document.documentElement.clientWidth;
  let stageHeight = stageWidth * 0.75;
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

  Pong.player1 = {};
  Pong.player2 = {};

  console.log("Enter state About");
  game.state.start("About");
}

