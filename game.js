"use strict";
/*global Phaser, Pong, assetPack */
/*eslint quotes: [2, "double"]*/

class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
    this.autoPlayerSpeed = 230;
    this.ballSpeed = 185;
    this.ballReleased = false;
    this.level = 1;
    this.hits = 0;

    this.levelLabel = null;
    this.statusLabel = null;
    this.ball = null;
    this.emitter = null;
  }
  get activeInputs() {
    return Pong.activeInputs;
  }
  get worldBounds() {
    let bounds = this.sys.arcadePhysics.world.bounds;
    return Object.assign({
      centerX: bounds.x + bounds.width/2,
      centerY: bounds.y + bounds.height/2,
    }, bounds);
  }
  preload() {
    this.load.image("star", assetPack.star);
    this.load.image("bat", assetPack.paddle);
    this.load.image("ball", assetPack.paddle);
    // this.load.image("background", assetPack.background);
  }
  create() {
    window.currentScene = this;
    console.log("Game scene create");
    let panelBounds = {
      top: 15,
      right: 15,
      bottom: 15, // gameBounds.height / 2,
      left: 15,
    };
    uiUtils.hideAllPanels();

    // this.physics.world.setBounds(0, 0, 800 * 4, 600 * 4);
    const dims = this.worldBounds;
    this.add.image(0, 0, dims.width, dims.width, "background");

    this.levelLabel = this.add.text(0, 0, "Level: " + this.level, assetPack.levelLabel.style);
    // this.levelLabel.displayWidth = dims.width;
    // this.levelLabel.displayHeight = dims.height;
    this.statusLabel = this.add.text(dims.centerX, dims.centerY, "", assetPack.statusLabel.style);
    // this.statusLabel.anchor.setTo(0.5, 0.5);

    let player1 = this.placePlayerInGame("player1", 20, dims.centerY);
    let player2 = this.placePlayerInGame("player2", dims.width-20, dims.centerY);
    console.log("player1.input: ", player1.input);

    let ball = this.ball = this.physics.add.sprite(dims.centerX, dims.centerY, "ball");
    // this.physics.arcade.enable(this.ball);

    ball.body.collideWorldBounds = true;
    ball.body.bounce.setTo(1, 1);

    // Initialize particle emitter manager and the emitter
    this._starParticles = this.add.particles("star");
    this.emitter = this._starParticles.createEmitter({
        x: 400,
        y: 300,
        angle: { min: -95, max: 90 },
        speed: 400,
        gravityY: 0,
        lifespan: { min: 50, max: 200 },
        quantity: 7,
        frequency: 100,
        alpha: { start: 1, end: 0.1 },
        scale: 1, // { start: 0.5, end: 1.0 },
        // blendMode: 'ADD'
    });
    this.emitter.stop();

    this.input.on('pointerdown', this.releaseBall, this);
    this.input.keyboard.on('keydown-SPACE', this.releaseBall, this);
  }
  update() {
    let dims = this.worldBounds;
    for(let input of Object.values(this.activeInputs)) {
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
      else if (paddle.y > dims.height - paddleHalfHeight) {
        paddle.y = dims.height - paddleHalfHeight;
      }
      // Check and handle ball and racket collisions
      this.sys.arcadePhysics.collide(this.ball, paddle,
                                  (_ball, _paddle) => this.ballHitsBet(_ball, _paddle),
                                  null, this);
    }

    //Check if someone has scored a goal
    this.checkGoal();
  }
  setBall() {
    const dims = this.worldBounds;
    if (this.ballReleased) {
      this.ball.x = dims.centerX;
      this.ball.y = dims.centerY;
      this.ball.body.velocity.x = 0;
      this.ball.body.velocity.y = 0;
      this.ballReleased = false;
    }
  }
  ballHitsBet(_ball, paddle) {
    // Increase the ball hit counter
    this.hits++;
    // every third hit move to the next level
    if (this.hits == 3) {
      this.nextLevel();
    }

    let ball = this.ball;
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
    this.particleBurst(ball, 1);
  }
  checkGoal() {
    if (this.ball.x < 15) {
      this.nextLevel();
      this.setBall();
    } else if (this.ball.x > (this.worldBounds.width - 15)) {
      this.gameOver();
      this.setBall();
    }
  }
  releaseBall() {
    if (!this.ballReleased) {
      let directionX = Phaser.Math.RND.frac() > 0.5 ? 1 : -1;
      let directionY = Phaser.Math.RND.frac() > 0.5 ? 1 : -1;
      //Увеличиваем скорость мячика с каждым ударом
      this.ball.body.velocity.x = (this.ballSpeed + this.level * 20) * directionX;
      this.ball.body.velocity.y = (-this.ballSpeed - this.level * 20) * directionY;
      console.log("releaseBall direction: ", this.ball.body.velocity, directionX, directionY);
      this.ballReleased = true;
    }
  }
  showText(txt, timeout) {
    this.statusLabel.text = txt;
    setTimeout(() => {
      this.statusLabel.text = "";
    }, timeout);
  }
  nextLevel() {
    this.level += 1;
    this.hits = 0;
    this.levelLabel.text = "Level: " + this.level;
    this.showText("Level: " + this.level, 2000);
    this.autoPlayerSpeed += this.level * 2;
  }
  gameOver() {
    this.level = 1;
    this.hits = 0;
    this.levelLabel.text = "Level: " + this.level;
    this.showText("You lose ", 2000);
    this.autoPlayerSpeed = 250;
  }
  particleBurst(coord, directionSign) {
    if (this._particleBurstTimer) {
      this._particleBurstTimer.destroy();
      this._particleBurstTimer = null;
      this.emitter.stop();
    }
    this.emitter.setPosition(coord.x, coord.y);
    // this.emitter.setEmitterAngle({ min: -45 * directionSign, max: 45 * directionSign });
    this.emitter.start();
    this._particleBurstTimer = this.time.addEvent({
      delay: 60,
      callback: () => {
        this.emitter.stop();
      }
    });
  }
  placePlayerInGame(id, x, y, props) {
    let game = Pong.game;
    let player = Pong[id];
    let inputType = player.inputType;
    console.log("placePlayerInGame, id: %s, inputType: %s, activeInputs",
                id, player.inputType, this.activeInputs);
    Object.assign(player, props, {
      get input() {
        return Pong.activeInputs[inputType];
      },
      paddle: null,
    }, props);

    let paddle = player.paddle = this.physics.add.sprite(x, y, "paddle");
    paddle.setCollideWorldBounds(true);
    paddle.setBounce(1, 1);
    paddle.body.immovable = true;

    return player;
  }
};
