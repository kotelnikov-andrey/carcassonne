class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.board = [];
    this.players = [];
    this.status = "waiting";
    this.currentPlayerId = null;
  }
}

module.exports = Game;
