import Phaser from "phaser";

function cube2offset([q, r, s]) {
  return [q + (r - (r & 1)) / 2, r]
}

function cubeHexGrid(size) {
  const points = []
  for (let q = -size; q <= size; q++) {
    const r1 = Math.max(-size, -q - size);
    const r2 = Math.min(size, -q + size);
    for (let r = r1; r <= r2; r++) {
      points.push([q, r, -q - r]);
    }
  }
  return points
}

function offsetHexGrid(size) {
  return cubeHexGrid(size).map(p => cube2offset(p))
}

const DELTA = [
  [[+1, 0], [0, -1], [-1, -1],
  [-1, 0], [-1, +1], [0, +1]],
  [[+1, 0], [+1, -1], [0, -1],
  [-1, 0], [0, +1], [+1, +1]],
]

function neighbor([x, y], direction) {
  const parity = y & 1
  const [dx, dy] = DELTA[parity][direction]
  return [x + dx, y + dy]
}

class Player {
  constructor({ scene, pos, dir }) {
    this.scene = scene
    this.pos = pos
    this.dir = dir

    this.lastTime = 0

    this.head = new Phaser.GameObjects.Sprite(this.scene, 0 + 53/2, 0 + 62/2, 'hex')
    this.head.tint = '0x333333';
    this.scene.hexagonContainer.add(this.head);

    this.body = []
    this.bodySize = 1
  }

  reset() {
    this.scene.hexagonContainer.remove(this.head)
    for(const b of this.body) {
      this.scene.hexagonContainer.remove(b)
    }

    this.pos = [0,0]
    this.dir = 0

    this.head = new Phaser.GameObjects.Sprite(this.scene, 0 + 53/2, 0 + 62/2, 'hex')
    this.head.tint = '0x333333';
    this.scene.hexagonContainer.add(this.head);

    this.body = []
  }

  goLeft() {
    this.dir = (this.dir + 1 + 6) % 6
  }

  goRight() {
    this.dir = (this.dir - 1 + 6) % 6
  }

  update(time) {
    if (time - this.lastTime > 200) {
      console.log(this.pos, this.dir)

      const body = new Phaser.GameObjects.Sprite(this.scene, this.head.x, this.head.y, 'hex')
      body.tint = '0x555555';
      this.body.push(body)
      this.scene.hexagonContainer.add(body)

      this.pos = neighbor(this.pos, this.dir)
      this.head.x = this.pos[0] * 53 + 53/2
      this.head.y = this.pos[1] * 62 * 3/4 + 62/2

      if (this.pos[1] & 1 == 1) {
        this.head.x += 53 / 2;
      }

      if (this.scene.hexagonMap[this.pos] == null) {
        this.reset()
      }

      for(const b of this.body) {
        if (this.head.x == b.x && this.head.y == b.y) {
          this.reset()
          break
        }
      }

      this.lastTime = time
    }
  }
}

class Scene extends Phaser.Scene {
  constructor() {
    super('ascene')
  }

  init() {
    this.gridSize = 15
    this.hexagonMap = {};
  }

  preload() {
    this.load.image('hex', 'assets/hex.png');
    this.hexagonWidth = 53;
    this.hexagonHeight = 62;
  }

  create() {
    this.hexagonContainer = this.add.container();
    const pts = offsetHexGrid(this.gridSize)
    for (let [x, y] of pts) {
      let hexagonX = this.hexagonWidth * x;
      let hexagonY = this.hexagonHeight * y * 3 / 4;
      if (y & 1 == 1) {
        hexagonX += this.hexagonWidth / 2;
      }

      var hexagon = this.add.sprite(hexagonX + this.hexagonWidth / 2, hexagonY + this.hexagonHeight / 2, "hex");

      if (y % 2) {
        hexagon.tint = '0xdddddd';
      }
      this.hexagonMap[[x, y]] = hexagon;
      this.hexagonContainer.add(hexagon);
    }
    this.hexagonContainer.x = this.game.scale.width / 2
    this.hexagonContainer.y = this.game.scale.height / 2 - this.hexagonHeight * 3 / 4 / 2;

    this.player = new Player({
      scene: this,
      pos: [0, 0],
      dir: 0
    })

    this.cameras.main.setZoom(0.5);
    // this.cameras.main.startFollow(this.player.head);//, true, 0.05, 0.05);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown', this.handleKey.bind(this));
  }

  update(time, delta) {
    if (this.cursors.left.isDown) {

    }
    else if (this.cursors.right.isDown) {

    }

    this.player.update(time)
  }

  handleKey(event) {
    if (event.keyCode == 37) {
      this.player.goLeft();
    }
    if (event.keyCode == 39) {
      this.player.goRight();
    }
  }
}


const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  backgroundColor: '#333',
  scene: [Scene]
};

(() => {
  window.game = new Phaser.Game(config);
})();
