"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

let ball;
let emitter;

let game;

function GameState() {
  this.autoPlayerSpeed = 230;
  this.ballSpeed = 185;
  this.ballReleased = false;
  this.level = 1;
  this.hits = 0;

  this.levelLabel = null;
  this.statusLabel = null;
};
GameState.prototype = {
  preload() {
    let game = this.game;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.canvas.style.cursor = "none";
  },
  create() {
    const game = this.game;
    const worldWidth = game.world.width;
    const worldHeight = game.world.height;

    game.add.tileSprite(0, 0, worldWidth, worldHeight, "background");

    this.levelLabel = game.add.text(0, 0, "Level: " + this.level, assetPack.levelLabel.style);
    this.statusLabel = game.add.text(game.world.centerX, game.world.centerY, "", assetPack.statusLabel.style);
    this.statusLabel.anchor.setTo(0.5, 0.5);

    let player1 = placePlayerInGame("player1", game.world.centerX, 20);
    let player2 = placePlayerInGame("player2", game.world.centerX, worldHeight-40);
    console.log("player1.input: ", player1.input);

    ball = game.add.sprite(game.world.centerX, game.world.centerY, "ball");
    game.physics.arcade.enable(ball);

    ball.anchor.setTo(0.5, 0.5);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.setTo(1, 1);

    // Initialize particle emitter
    emitter = game.add.emitter(0, 0, 200);
    emitter.makeParticles("star");

    game.input.onDown.add(this.releaseBall, this);
    let spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    spacebar.onDown.add(this.releaseBall, this);
  },
  update() {
    let game = this.game;
    for(let input of Object.values(game.activeInputs)) {
      if (typeof input.update == "function") {
        input.update();
      }
    }

    // Manage each racket
    for (let player of [Pong.player1, Pong.player2]) {
      let paddle = player.paddle;
      paddle.x = player.input.x;
      let paddleHalfWidth = paddle.width / 2;

      if (paddle.x < paddleHalfWidth) {
        paddle.x = paddleHalfWidth;
      }
      else if (paddle.x > game.width - paddleHalfWidth) {
        paddle.x = game.width - paddleHalfWidth;
      }
      // Check and handle ball and racket collisions
      game.physics.arcade.collide(ball, paddle,
                                  (_ball, _paddle) => this.ballHitsBet(_ball, _paddle),
                                  null, this);
    }

    //Check if someone has scored a goal
    this.checkGoal();
  },
  setBall() {
    if (this.ballReleased) {
      ball.x = this.game.world.centerX;
      ball.y = this.game.world.centerY;
      ball.body.velocity.x = 0;
      ball.body.velocity.y = 0;
      this.ballReleased = false;
    }
  },
  ballHitsBet(_ball, paddle) {
    let worldWidth = this.game.world.width;
    let worldHeight = this.game.world.height;
    // Increase the ball hit counter
    this.hits++;
    // every third hit move to the next level
    if (this.hits == 3) {
      this.nextLevel();
    }

    // Impact effect
    if (ball.y < 60) {
      emitter.gravity = 5;
    } else if (ball.y > worldHeight - 60) {
      emitter.gravity = -5;
    }
    this.particleBurst(paddle.x, paddle.y);

    let diff = 0;

    if (_ball.x < paddle.x) {
      // The ball is on the left side of the racket
      diff = paddle.x - _ball.x;
      _ball.body.velocity.x = (-12 * diff);
    }
    else if (_ball.x > paddle.x) {
      // The ball is on the right side of the racket
      diff = _ball.x - paddle.x;
      _ball.body.velocity.x = (12 * diff);
    }
    else {
      //The ball hit the center of the racket, we add a little tragic randomness to its movement
      _ball.body.velocity.x = 2 + Math.random() * 8;
    }
  },
  checkGoal() {
    if (ball.y < 15) {
      this.nextLevel();
      this.setBall();
    } else if (ball.y > (this.game.world.height - 15)) {
      this.gameOver();
      this.setBall();
    }
  },
  releaseBall() {
    if (!this.ballReleased) {
      //Увеличиваем скорость мячика с каждым ударом
      ball.body.velocity.x = this.ballSpeed + this.level * 20;
      ball.body.velocity.y = -this.ballSpeed - this.level * 20;
      this.ballReleased = true;
    }
  },
  showText(txt, timeout) {
    this.statusLabel.setText(txt);
    setTimeout(function() {
      this.statusLabel.setText("");
    }, timeout);
  },
  nextLevel() {
    this.level += 1;
    this.hits = 0;
    this.levelLabel.setText("Level: " + this.level);
    this.showText("Level: " + this.level, 2000);
    this.autoPlayerSpeed += this.level * 2;
  },
  gameOver() {
    this.level = 1;
    this.hits = 0;
    this.levelLabel.setText("Level: " + this.level);
    this.showText("You lose ", 2000);
    this.autoPlayerSpeed = 250;
  },
  particleBurst(x, y) {
    // Set the particle emitter to a point x, y
    emitter.x = x;
    emitter.y = y;

    // The first parameter determines whether all particles should be released at one moment (explode mode, explosion)
    // The second parameter sets the particle lifetime in milliseconds.
    // In burst / explode mode, the third parameter is ignored.
    // The last parameter determines how many particles will be released during the "explosion"
    emitter.start(true, 500, null, 5);
  },
};

function placePlayerInGame(id, x, y, props) {
  let game = Pong.game;
  let player = Pong[id];
  let inputType = player.inputType;
  console.log("placePlayerInGame, id: %s, inputType: %s, activeInputs",
              id, player.inputType, game.activeInputs);
  Object.assign(player, props, {
    get input() {
      return Pong.game.activeInputs[inputType];
    },
    paddle: null,
  }, props);
  let paddle = player.paddle = game.add.sprite(x, y, "paddle");
  paddle.anchor.setTo(0.5, 0.5);

  game.physics.arcade.enable(paddle);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.setTo(1, 1);
  paddle.body.immovable = true;

  return player;
}
