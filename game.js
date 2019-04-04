"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

function GameState() {
  this.autoPlayerSpeed = 230;
  this.ballSpeed = 185;
  this.ballReleased = false;
  this.level = 1;
  this.hits = 0;

  this.levelLabel = null;
  this.statusLabel = null;
  this.ball = null;
  this.emitter = null;
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
    this.levelLabel.setTextBounds(0, 0, game.world.width, 100);
    this.statusLabel = game.add.text(game.world.centerX, game.world.centerY, "", assetPack.statusLabel.style);
    this.statusLabel.anchor.setTo(0.5, 0.5);

    let player1 = placePlayerInGame("player1", 20, game.world.centerY);
    let player2 = placePlayerInGame("player2", worldWidth-20, game.world.centerY);
    console.log("player1.input: ", player1.input);

    let ball = this.ball = game.add.sprite(game.world.centerX, game.world.centerY, "ball");
    game.physics.arcade.enable(this.ball);

    ball.anchor.setTo(0.5, 0.5);
    ball.body.collideWorldBounds = true;
    ball.body.bounce.setTo(1, 1);

    // Initialize particle emitter
    this.emitter = game.add.emitter(0, 0, 200);
    this.emitter.makeParticles("star");

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
      paddle.y = player.input.y;
      let paddleHalfHeight = paddle.height / 2;

      if (paddle.y < paddleHalfHeight) {
        paddle.y = paddleHalfHeight;
      }
      else if (paddle.y > game.height - paddleHalfHeight) {
        paddle.y = game.height - paddleHalfHeight;
      }
      // Check and handle ball and racket collisions
      game.physics.arcade.collide(this.ball, paddle,
                                  (_ball, _paddle) => this.ballHitsBet(_ball, _paddle),
                                  null, this);
    }

    //Check if someone has scored a goal
    this.checkGoal();
  },
  setBall() {
    if (this.ballReleased) {
      this.ball.x = this.game.world.centerX;
      this.ball.y = this.game.world.centerY;
      this.ball.body.velocity.x = 0;
      this.ball.body.velocity.y = 0;
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

    let ball = this.ball;
    // Impact effect
    if (ball.x < 60) {
      this.emitter.gravity = 5;
    } else if (ball.x > worldWidth - 60) {
      this.emitter.gravity = -5;
    }
    this.particleBurst(paddle.x, paddle.y);

    let diff = 0;

    if (_ball.x < paddle.x) {
      // The ball is on the top side of the racket
      diff = paddle.y - _ball.y;
      _ball.body.velocity.y = (-12 * diff);
    }
    else if (_ball.y > paddle.y) {
      // The ball is on the bottom side of the racket
      diff = _ball.y - paddle.y;
      _ball.body.velocity.y = (12 * diff);
    }
    else {
      //The ball hit the center of the racket, we add a little tragic randomness to its movement
      _ball.body.velocity.y = 2 + Math.random() * 8;
    }
  },
  checkGoal() {
    if (this.ball.x < 15) {
      this.nextLevel();
      this.setBall();
    } else if (this.ball.x > (this.game.world.width - 15)) {
      this.gameOver();
      this.setBall();
    }
  },
  releaseBall() {
    if (!this.ballReleased) {
      let directionX = Pong.game.rnd.frac() > 0.5 ? 1 : -1;
      let directionY = Pong.game.rnd.frac() > 0.5 ? 1 : -1;
      //Увеличиваем скорость мячика с каждым ударом
      this.ball.body.velocity.x = (this.ballSpeed + this.level * 20) * directionX;
      this.ball.body.velocity.y = (-this.ballSpeed - this.level * 20) * directionY;
      console.log("releaseBall direction: ", this.ball.body.velocity, directionX, directionY);
      this.ballReleased = true;
    }
  },
  showText(txt, timeout) {
    this.statusLabel.setText(txt);
    setTimeout(() => {
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
    this.emitter.x = x;
    this.emitter.y = y;

    // The first parameter determines whether all particles should be released at one moment (explode mode, explosion)
    // The second parameter sets the particle lifetime in milliseconds.
    // In burst / explode mode, the third parameter is ignored.
    // The last parameter determines how many particles will be released during the "explosion"
    this.emitter.start(true, 500, null, 5);
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
