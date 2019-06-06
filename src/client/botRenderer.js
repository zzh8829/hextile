import Phaser from "phaser";

export default class BotRenderer {
  constructor(scene, bot) {
    this.scene = scene;
    this.bot = bot;

    const hue = Math.random();
    this.bodyColor = Phaser.Display.Color.HSLToColor(hue, 1, 0.8).color;
    this.headColor = Phaser.Display.Color.HSLToColor(hue, 1, 0.5).color;

    this.container = this.scene.add.container();
    this.head = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "hex");
    this.head.tint = this.headColor;
    this.container.add(this.head);

    this.body = [];
  }

  die() {
    this.container.destroy();
    this.scene.bots = this.scene.bots.filter(e => e !== this);
  }

  getXY(px, py) {
    let x = px * 53 + 53 / 2;
    let y = (py * 62 * 3) / 4 + 62 / 2;
    if (py & (1 == 1)) {
      x += 53 / 2;
    }
    return [x, y];
  }

  update(time) {
    const oldPos = this.bot.pos;

    if (this.bot.update(time)) {
      if (this.bot.dead) {
        this.die();
        return;
      }

      const body = new Phaser.GameObjects.Sprite(
        this.scene,
        ...this.getXY(...oldPos),
        "hex"
      );
      body.tint = this.bodyColor;
      this.container.add(body);
      this.body.push({ sprite: body });

      this.bot.update(time);

      const pos = this.getXY(...this.bot.pos);
      this.head.x = pos[0];
      this.head.y = pos[1];
    }
  }
}
