"use strict";
/*global Phaser, assetPack */
/*eslint quotes: [2, "double"]*/

let player1;
let computerPlayer;
let ball;
let levelLabel;
let statusLabel;
let emitter;
let activeInputs = {};

let computerPlayerSpeed = 230;
let ballSpeed = 185;
let ballReleased = false;

let level = 1;

let hits = 0;
let game;
let stageHeight;
let stageWidth;

let Pong = window.Pong || {};
Pong.Boot = function() {};
Pong.Boot.prototype = {
  preload() {
    console.log("Boot preload");
    let game = this.game;
    for (let [name, value] of Object.entries(assetPack)) {
      if (value.src) {
        game.load.image(name, value.src);
      }
    }
  },
  create() {
    console.log("Boot create");
    let game = this.game;
    game.canvas.style.cursor = "none";
    //loading screen will have a white background
    game.stage.backgroundColor = "#666";

    let label = game.add.text(game.world.centerX, game.world.centerY, "Boot scene", assetPack.levelLabel.style);
    label.anchor.setTo(0.5, 0.5);

    game.physics.startSystem(Phaser.Physics.ARCADE);

    console.log("Boot create, enter Options state");
    setTimeout(() => {
      this.state.start("Options");
    }, 1000);
  }
};

Pong.Options = function() {};
Pong.Options.prototype = {
  create() {
    let game = this.game;
    console.log("Options state create");
    this.configureInputs();

    let label = game.add.text(game.world.centerX, game.world.centerY, "Options scene", assetPack.levelLabel.style);
    label.anchor.setTo(0.5, 0.5);

    setTimeout(() => {
      this.state.start("Game");
    }, 2000);
  },
  configureInputs() {
    let game = Pong.game;
    activeInputs.arrowKeys = {
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

    activeInputs.wasdKeys = {
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

    activeInputs.mouse = {
      get x() {
        return game.input.x;
      }
    };
    activeInputs.auto = {
      get x() {
        return ball.x;
      }
    };
  }
};

Pong.Game = function() {};
Pong.Game.prototype = {
  create() {
    let game = this.game;
    game.add.tileSprite(0, 0, stageWidth, stageHeight, "background");

    levelLabel = game.add.text(0, 0, "Level: " + level, assetPack.levelLabel.style);
    statusLabel = game.add.text(game.world.centerX, game.world.centerY, "", assetPack.statusLabel.style);
    statusLabel.anchor.setTo(0.5, 0.5);

    computerPlayer = createPlayer(game.world.centerX, 20, {
      inputType: "arrowKeys",
    });
    player1 = createPlayer(game.world.centerX, stageHeight-40, {
      inputType: "wasdKeys"
    });
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
    for(let input of Object.values(activeInputs)) {
      if (typeof input.update == "function") {
        input.update();
      }
    }

    // Manage each racket
    for (let player of [player1, computerPlayer]) {
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
    if (ballReleased) {
      ball.x = this.game.world.centerX;
      ball.y = this.game.world.centerY;
      ball.body.velocity.x = 0;
      ball.body.velocity.y = 0;
      ballReleased = false;
    }
  },
  ballHitsBet(_ball, paddle) {
    // Increase the ball hit counter
    hits++;
    // every third hit move to the next level
    if (hits == 3) {
      this.nextLevel();
    }
    // Impact effect
    if (ball.y < 60) {
      emitter.gravity = 5;
    } else if (ball.y > stageHeight - 60) {
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
    } else if (ball.y > (stageHeight - 15)) {
      this.gameOver();
      this.setBall();
    }
  },
  releaseBall() {
    if (!ballReleased) {
      //Увеличиваем скорость мячика с каждым ударом
      ball.body.velocity.x = ballSpeed + level * 20;
      ball.body.velocity.y = -ballSpeed - level * 20;
      ballReleased = true;
    }
  },
  showText(txt, timeout) {
    statusLabel.setText(txt);
    setTimeout(function() {
      statusLabel.setText("");
    }, timeout);
  },
  nextLevel() {
    level += 1;
    hits = 0;
    levelLabel.setText("Level: " + level);
    this.showText("Level: " + level, 2000);
    computerPlayerSpeed += level * 2;
  },
  gameOver() {
    level = 1;
    hits = 0;
    levelLabel.setText("Level: " + level);
    this.showText("You lose ", 2000);
    computerPlayerSpeed = 250;
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

function kickItOff() {
  stageHeight = document.documentElement.clientHeight;
  stageWidth = stageHeight * 0.75;
  console.log(`init with stageWidth: ${stageWidth}, stageHeight: ${stageHeight}`);
  Pong.game = new Phaser.Game(stageWidth, stageHeight,
                             Phaser.AUTO, "");
  Pong.game.state.add("Boot", Pong.Boot);
  Pong.game.state.add("Options", Pong.Options);
  Pong.game.state.add("Game", Pong.Game);
  console.log("Enter state Boot");
  Pong.game.state.start("Boot");
}
document.addEventListener("DOMContentLoaded", kickItOff, { once: true });

function createPlayer(x, y, props) {
  let game = Pong.game;
  let player = Object.assign({
    get input() {
      return activeInputs[this.inputType];
    },
    paddle: null,
  }, props);
  let paddle = player.paddle = game.add.sprite(x, y, "paddle");
  console.log("createPlayer, got paddle: ", paddle);
  paddle.anchor.setTo(0.5, 0.5);

  game.physics.arcade.enable(paddle);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.setTo(1, 1);
  paddle.body.immovable = true;

  return player;
}
