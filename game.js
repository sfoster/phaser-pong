"use strict";

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

function init() {
  stageHeight = document.documentElement.clientHeight;
  stageWidth = stageHeight * 0.75;
  console.log(`init with stageWidth: ${stageWidth}, stageHeight: ${stageHeight}`);
  game = new Phaser.Game(stageWidth, stageHeight,
                             Phaser.AUTO, '',
                             {preload: preload, create: create, update: update});
}
document.addEventListener("DOMContentLoaded", init, { once: true });

function preload() {
  for (let [name, value] of Object.entries(assetPack)) {
    if (value.src) {
      game.load.image(name, value.src);
    }
  }
}

function create() {
  configureInputs();
  game.physics.startSystem(Phaser.Physics.ARCADE);

  game.canvas.style.cursor = 'none';
  game.add.tileSprite(0, 0, stageWidth, stageHeight, 'background');
  computerPlayer = createPlayer(game.world.centerX, 20, { inputType: "arrowKeys" });
  player1 = createPlayer(game.world.centerX, stageHeight-40, { inputType: "wasdKeys" });
  levelLabel = game.add.text(0, 0, 'Level: ' + level, assetPack.levelLabel.style);
  statusLabel = game.add.text(game.world.centerX, game.world.centerY, '', assetPack.statusLabel.style);
  statusLabel.anchor.setTo(0.5, 0.5);

  ball = game.add.sprite(game.world.centerX, game.world.centerY, 'ball');
  game.physics.arcade.enable(ball);

  ball.anchor.setTo(0.5, 0.5);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.setTo(1, 1);

  // Initialize particle emitter
  emitter = game.add.emitter(0, 0, 200);
  emitter.makeParticles('star');

  game.input.onDown.add(releaseBall, this);
  let spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  spacebar.onDown.add(releaseBall, this);
}

function configureInputs() {
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

function particleBurst(x, y) {

  // Set the particle emitter to a point x, y
  emitter.x = x;
  emitter.y = y;

  // The first parameter determines whether all particles should be released at one moment (explode mode, explosion)
  // The second parameter sets the particle lifetime in milliseconds.
  // In burst / explode mode, the third parameter is ignored.
  // The last parameter determines how many particles will be released during the "explosion"
  emitter.start(true, 500, null, 5);

}

function createPlayer(x, y, props) {
  let player = Object.assign({
    get input() {
      return activeInputs[this.inputType];
    },
    paddle: null,
  }, props);
  let paddle = player.paddle = game.add.sprite(x, y, 'paddle');
  console.log("createPlayer, got paddle: ", paddle);
  paddle.anchor.setTo(0.5, 0.5);

  game.physics.arcade.enable(paddle);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.setTo(1, 1);
  paddle.body.immovable = true;

  return player;
}

function update() {
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
    game.physics.arcade.collide(ball, paddle, ballHitsBet, null, this);
  }

  //Check if someone has scored a goal
  checkGoal();
}

function ballHitsBet(_ball, paddle) {
  // Increase the ball hit counter
  hits++;
  // every third hit move to the next level
  if (hits == 3) {
    nextLevel();
  }
  // Impact effect
  if (ball.y < 60) {
    emitter.gravity = 5;
  } else if (ball.y > stageHeight - 60) {
    emitter.gravity = -5;
  }
  particleBurst(paddle.x, paddle.y);

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
}

function checkGoal() {
  if (ball.y < 15) {
    nextLevel();
    setBall();
  } else if (ball.y > (stageHeight - 15)) {
    gameOver();
    setBall();
  }
}

function setBall() {
  if (ballReleased) {
    ball.x = game.world.centerX;
    ball.y = game.world.centerY;
    ball.body.velocity.x = 0;
    ball.body.velocity.y = 0;
    ballReleased = false;
  }
}

function releaseBall() {
  if (!ballReleased) {
    //Увеличиваем скорость мячика с каждым ударом
    ball.body.velocity.x = ballSpeed + level * 20;
    ball.body.velocity.y = -ballSpeed - level * 20;
    ballReleased = true;
  }
}

function showText(txt, timeout) {
  statusLabel.setText(txt);
  setTimeout(function() {
    statusLabel.setText('');
  }, timeout);
}

function nextLevel() {
  level += 1;
  hits = 0;
  levelLabel.setText('Level: ' + level)
  showText('Level: ' + level, 2000);
  computerPlayerSpeed += level * 2;
}

function gameOver() {
  level = 1;
  hits = 0;
  levelLabel.setText('Level: ' + level)
  showText('You lose ', 2000);
  computerPlayerSpeed = 250;
}

