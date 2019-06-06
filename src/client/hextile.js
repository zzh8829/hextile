import Phaser from "phaser";

import BotRenderer from "./botRenderer";
import Bot from "../common/bot";

function cube2offset([q, r, s]) {
  return [q + (r - (r & 1)) / 2, r];
}

function cubeHexGrid(size) {
  const points = [];
  for (let q = -size; q <= size; q++) {
    const r1 = Math.max(-size, -q - size);
    const r2 = Math.min(size, -q + size);
    for (let r = r1; r <= r2; r++) {
      points.push([q, r, -q - r]);
    }
  }
  return points;
}

function offsetHexGrid(size) {
  return cubeHexGrid(size).map(p => cube2offset(p));
}

const DELTA = [
  [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]],
  [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]]
];

function neighbor([x, y], direction) {
  const parity = y & 1;
  const [dx, dy] = DELTA[parity][direction];
  return [x + dx, y + dy];
}

class Player {
  constructor({ scene, pos, dir }) {
    this.scene = scene;
    this.initPos = pos;
    this.initDir = dir;

    this.speedUp = false;
    this.lastTime = 0;

    this.container = this.scene.add.container();
    this.initSnake();
  }

  die() {
    this.container.destroy()
    this.container = this.scene.add.container();
    for (const { pos } of this.body) {
      delete this.scene.snakeMap[pos];
    }
    this.initSnake();
  }

  initSnake() {
    this.pos = this.initPos;
    this.dir = this.initDir;

    this.head = new Phaser.GameObjects.Sprite(
      this.scene,
      ...this.getXY(...this.pos),
      "hex"
    );
    this.head.tint = "0x333333";
    this.container.add(this.head);
    this.scene.snakeMap[this.pos] = 1;

    this.body = [];

    this.scene.cameras.main.startFollow(this.head, false, 0.1, 0.1);
  }

  getXY(px, py) {
    let x = px * 53 + 53 / 2;
    let y = (py * 62 * 3) / 4 + 62 / 2;
    if (py & (1 == 1)) {
      x += 53 / 2;
    }
    return [x, y];
  }

  goLeft() {
    this.dir = (this.dir + 1 + 6) % 6;
  }

  goRight() {
    this.dir = (this.dir - 1 + 6) % 6;
  }

  update(time) {
    const moveInterval = this.speedUp ? 100 : 200;

    if (time - this.lastTime > moveInterval) {
      // console.log(this.pos, this.dir);

      const body = new Phaser.GameObjects.Sprite(
        this.scene,
        this.head.x,
        this.head.y,
        "hex"
      );
      body.tint = "0x555555";
      this.container.add(body);
      this.body.push({ sprite: body, pos: [...this.pos] });

      this.pos = neighbor(this.pos, this.dir);
      if (this.scene.hexagonMap[this.pos] == null) {
        this.die();
      }
      if (this.scene.snakeMap[this.pos] != null) {
        this.die();
      }
      this.scene.snakeMap[this.pos] = true;

      [this.head.x, this.head.y] = this.getXY(...this.pos);

      this.lastTime = time;
    }
  }
}

export default class HexTile extends Phaser.Scene {
  constructor() {
    super({ key: "HexTile", active: true });
  }

  init() {
    this.gridSize = 40;
    this.width = 5000;
    this.height = 5000;
    this.hexagonMap = {};
    this.snakeMap = {};
    this.debug = false;

    this.bots = [];
  }

  preload() {
    this.load.image("hex", "assets/hex.png");
    this.hexagonWidth = 53;
    this.hexagonHeight = 62;
  }

  create() {
    this.cameras.main.setBounds(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    this.cameras.main.setZoom(0.5);
    this.cameras.main.setDeadzone(500, 300);

    this.hexagonContainer = this.add.container();
    const pts = offsetHexGrid(this.gridSize);
    for (let [x, y] of pts) {
      let hexagonX = this.hexagonWidth * x;
      let hexagonY = (this.hexagonHeight * y * 3) / 4;
      if (y & (1 == 1)) {
        hexagonX += this.hexagonWidth / 2;
      }

      var hexagon = this.add.sprite(
        hexagonX + this.hexagonWidth / 2,
        hexagonY + this.hexagonHeight / 2,
        "hex"
      );

      if (y % 2) {
        hexagon.tint = 0x91dfff;
      } else {
        hexagon.tint = 0x7abedb;
      }

      this.hexagonMap[[x, y]] = hexagon;
      this.hexagonContainer.add(hexagon);
    }

    this.player = new Player({
      scene: this,
      pos: [0, 0],
      dir: 0
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown", this.handleKey.bind(this));

    if (this.cameras.main.deadzone) {
      this.cameraDeadZone = this.add.graphics().setScrollFactor(0);
      this.cameraDeadZone.lineStyle(2, 0x00ff00, 1);
      this.cameraDeadZone.strokeRect(
        (this.game.scale.width - this.cameras.main.deadzone.width) / 2,
        (this.game.scale.height - this.cameras.main.deadzone.height) / 2,
        this.cameras.main.deadzone.width,
        this.cameras.main.deadzone.height
      );
    }

    this.text = this.add
      .text(0, 0)
      .setScrollFactor(0)
      .setFontSize(32)
      .setColor("#ffffff");

    this.spawnBots();
    setInterval(this.spawnBots.bind(this), 2000);
  }

  spawnBots() {
    for (let i = 0; i < 20 - this.bots.length; i++) {
      const x = Math.floor(Math.random() * 80) - 40;
      const y = Math.floor(Math.random() * 80) - 40;
      const dir = Math.floor(Math.random() * 6);
      this.bots.push(new BotRenderer(this, new Bot(this, [x, y], dir)));
    }
  }

  update(time, delta) {
    if (this.cursors.left.isDown) {
    } else if (this.cursors.right.isDown) {
    }

    if (this.cursors.space.isDown) {
      this.player.speedUp = true;
    } else {
      this.player.speedUp = false;
    }

    this.player.update(time);

    if (this.debug) {
      this.text.setText([
        "ScrollX: " + this.cameras.main.scrollX,
        "ScrollY: " + this.cameras.main.scrollY,
        "MidX: " + this.cameras.main.midPoint.x,
        "MidY: " + this.cameras.main.midPoint.y
        // 'deadzone left: ' + cam.deadzone.left,
        // 'deadzone right: ' + cam.deadzone.right,
        // 'deadzone top: ' + cam.deadzone.top,
        // 'deadzone bottom: ' + cam.deadzone.bottom
      ]);

      this.cameraDeadZone.setVisible(true);
      this.text.setVisible(true);
    } else {
      this.cameraDeadZone.setVisible(false);
      this.text.setVisible(false);
    }

    const players = [
      { name: "[Player]", score: this.player.body.length },
      ...this.bots.map(b => ({
        name: b.bot.name,
        score: b.bot.body.length
      }))
    ];
    players.sort((a, b) => b.score - a.score);
    this.game.state.leaderboard = players;

    for (const botr of this.bots) {
      botr.update(time);
    }
  }

  handleKey(event) {
    if (event.code == "ArrowLeft") {
      this.player.goLeft();
    }
    if (event.code == "ArrowRight") {
      this.player.goRight();
    }
    if (event.code == "F1") {
      this.debug = !this.debug;
    }
  }
}
