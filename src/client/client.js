import Phaser from "phaser";
import LeaderBoard from "./leaderboard";
import HexTile from "./hextile"

class Game extends Phaser.Game {
  constructor(config) {
    super(config);
    this.state = {};
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: "100%",
    height: "100%"
  },
  backgroundColor: "#333",
  scene: [HexTile, LeaderBoard]
};

(() => {
  window.game = new Game(config);
})();
