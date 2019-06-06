import Phaser from "phaser";

export default class LeaderBoard extends Phaser.Scene {
  constructor() {
    super({ key: "leaderboard", active: true });
  }

  create() {
    this.leaderboard = this.add
      .text(10, 10)
      .setScrollFactor(0)
      .setFontSize(16)
      .setColor("#ffffff")
      .setDepth(99999);
  }

  update() {
    this.leaderboard.setText(
      this.game.state.leaderboard &&
        this.game.state.leaderboard
          .map(({ name, score }) => `${name}: ${score}`)
          .join("\n")
    );
  }
}
