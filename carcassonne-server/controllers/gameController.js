const games = {};
const jwt = require("jsonwebtoken");

function addNeighbors(board, x, y) {
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  directions.forEach(([dx, dy]) => {
    const key = `${x + dx},${y + dy}`;
    if (!(key in board)) {
      board[key] = null;
    }
  });
}

const joinGame = (req, res) => {
  const { gameId } = req.params;
  const { playerName } = req.body;

  if (!games[gameId]) {
    console.log(`Ошибка: Игра с ID ${gameId} не найдена`);
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  const newPlayer = {
    playerId: `player${games[gameId].players.length + 1}`,
    name: playerName,
    meeples: 7,
  };

  games[gameId].players.push(newPlayer);

  console.log(
    `Игрок "${playerName}" подключился к игре ${gameId}. Всего игроков: ${games[gameId].players.length}`
  );

  const token = jwt.sign(
    { playerId: newPlayer.playerId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token, players: games[gameId].players });
};

const startGame = (req, res) => {
  const { gameId } = req.params;
  if (!games[gameId]) {
    console.log(`Ошибка: Игра с ID ${gameId} не найдена`);
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }
  if (games[gameId].status === "active") {
    console.log(`Ошибка: Игра ${gameId} уже активна`);
    return res.status(400).json({ errorMessage: "Игра уже начата" });
  }

  const availableColors = ["yellow", "red", "green", "blue", "black"];
  availableColors.sort(() => Math.random() - 0.5);

  if (games[gameId].players.length > availableColors.length) {
    return res
      .status(400)
      .json({ errorMessage: "Слишком много игроков для доступных цветов" });
  }

  games[gameId].players.forEach((player, index) => {
    player.color = availableColors[index];
  });

  const images = ["photo1.png", "photo2.png"];
  const chosenImage = images[Math.floor(Math.random() * images.length)];

  games[gameId].board = {};
  games[gameId].board["0,0"] = {
    tile: "image",
    image: chosenImage,
    offsetX: 40,
    offsetY: 40,
    rotation: 0,
    owner: "system",
  };

  games[gameId].currentTileImage = chosenImage;

  addNeighbors(games[gameId].board, 0, 0);

  games[gameId].currentMoveMade = false;
  games[gameId].currentTurn = games[gameId].players[0].playerId;
  games[gameId].imageRotation = 0;
  games[gameId].status = "active";
  games[gameId].remainingCards = 20;
  games[gameId].status = "active";
  console.log(`Игра ${gameId} началась! Осталось 20 карт.`);
  return res.status(200).json(games[gameId]);
};

const makeMove = (req, res) => {
  const { gameId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const playerId = decoded.playerId;
    const game = games[gameId];
    if (game.currentTurn !== playerId) {
      return res.status(403).json({ errorMessage: "Сейчас не ваш ход" });
    }
    const player = game.players.find((p) => p.playerId === playerId);
    if (!player) {
      return res.status(404).json({ errorMessage: "Игрок не найден" });
    }
    game.board = { color: player.color };
    let currentIndex = game.players.findIndex((p) => p.playerId === playerId);
    let nextIndex = (currentIndex + 1) % game.players.length;
    game.currentTurn = game.players[nextIndex].playerId;
    console.log(`Игрок ${player.name} сделал ход. Цвет: ${player.color}`);
    return res.status(200).json(game);
  } catch (err) {
    console.error("Ошибка валидации токена:", err);
    return res
      .status(401)
      .json({ errorMessage: "Неверный токен авторизации." });
  }
};

const getGameState = (req, res) => {
  const { gameId } = req.params;

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  return res.status(200).json(games[gameId]);
};

const Game = require("../models/gameModel");
const { getEffectiveSides, matchRules } = require("../helpers/matchRules");

const createGame = (req, res) => {
  const gameId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const newGame = new Game(gameId);

  games[gameId] = newGame;

  console.log(`Игра создана: ${gameId} (Ожидание игроков)`);

  res.status(200).json({ gameId });
};

const leaveGame = (req, res) => {
  const { gameId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const playerId = decoded.playerId;

    const playerIndex = games[gameId].players.findIndex(
      (player) => player.playerId === playerId
    );
    if (playerIndex !== -1) {
      const removedPlayer = games[gameId].players.splice(playerIndex, 1);
      console.log(`Игрок ${removedPlayer[0].name} покинул игру ${gameId}.`);

      if (games[gameId].players.length === 0) {
        delete games[gameId];
        console.log(
          `Игра ${gameId} удалена, так как все игроки покинули лобби.`
        );
      }

      return res.status(200).json({ message: "Вы успешно покинули игру." });
    } else {
      return res
        .status(404)
        .json({ errorMessage: "Игрок не найден в этой игре." });
    }
  } catch (err) {
    console.error("Ошибка валидации токена:", err);
    return res
      .status(401)
      .json({ errorMessage: "Неверный токен авторизации." });
  }
};

/**
 * Функция проверки сопоставления сторон для одного соседа.
 * @param {Object} neighborTile – объект соседней плитки.
 * @param {string} newTileType – тип новой плитки (например, "photo1.png" или "photo2.png").
 * @param {number} dx – смещение по x относительно соседа (например, -1, если сосед слева).
 * @param {number} dy – смещение по y относительно соседа.
 * @returns {boolean} – true, если сопоставление верно, иначе false.
 */
function canPlaceAdjacent(neighborTile, newTileType, dx, dy) {
  let neighborContactDirection;
  let newTileContactSide;
  if (dx === -1) {
    neighborContactDirection = "right";
    newTileContactSide = 1;
  } else if (dx === 1) {
    neighborContactDirection = "left";
    newTileContactSide = 3;
  } else if (dy === -1) {
    neighborContactDirection = "bottom";
    newTileContactSide = 2;
  } else if (dy === 1) {
    neighborContactDirection = "top";
    newTileContactSide = 4;
  }

  const neighborSides = getEffectiveSides(neighborTile);
  let neighborSideNumber;
  if (neighborContactDirection === "left")
    neighborSideNumber = neighborSides[0];
  else if (neighborContactDirection === "top")
    neighborSideNumber = neighborSides[1];
  else if (neighborContactDirection === "right")
    neighborSideNumber = neighborSides[2];
  else if (neighborContactDirection === "bottom")
    neighborSideNumber = neighborSides[3];

  const neighborType = neighborTile.image.includes("photo1")
    ? "photo1"
    : "photo2";
  const newType = newTileType.includes("photo1") ? "photo1" : "photo2";
  const allowed = matchRules[neighborType][newType][neighborSideNumber];
  return allowed.includes(newTileContactSide);
}

const placeTile = (req, res) => {
  const { gameId } = req.params;
  let { x, y, offsetX, offsetY } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  const xNum = parseInt(x, 10);
  const yNum = parseInt(y, 10);
  if (isNaN(xNum) || isNaN(yNum)) {
    return res.status(400).json({ errorMessage: "Неверные координаты плитки" });
  }
  const key = `${xNum},${yNum}`;

  const offsetXNum = parseFloat(offsetX);
  const offsetYNum = parseFloat(offsetY);
  if (isNaN(offsetXNum) || isNaN(offsetYNum)) {
    console.log(`Получены смещения: offsetX=${offsetX}, offsetY=${offsetY}`);
    return res
      .status(400)
      .json({ errorMessage: "Неверные координаты для изображения" });
  }

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const playerId = decoded.playerId;
    const game = games[gameId];

    if (game.currentTurn !== playerId) {
      return res.status(403).json({ errorMessage: "Сейчас не ваш ход" });
    }
    if (game.currentMoveMade) {
      return res
        .status(400)
        .json({ errorMessage: "Вы уже поставили плитку в этом ходе" });
    }
    if (!(key in game.board)) {
      console.log(
        `Ключ ${key} отсутствует в доске. Текущие ключи: ${Object.keys(
          game.board
        )}`
      );
      return res.status(400).json({ errorMessage: "Неверная позиция плитки" });
    }
    if (game.board[key] !== null) {
      return res.status(400).json({ errorMessage: "Плитка уже установлена" });
    }

    const newTileType = game.currentTileImage.includes("photo1")
      ? "photo1"
      : "photo2";

    const neighborChecks = [
      { dx: -1, dy: 0, newSide: 1 },
      { dx: 1, dy: 0, newSide: 3 },
      { dx: 0, dy: -1, newSide: 2 },
      { dx: 0, dy: 1, newSide: 4 },
    ];

    for (let check of neighborChecks) {
      const neighborKey = `${xNum + check.dx},${yNum + check.dy}`;
      if (game.board[neighborKey] && game.board[neighborKey] !== null) {
        const neighborTile = game.board[neighborKey];
        if (!neighborTile.owner || neighborTile.owner === "system") continue;

        const neighborType = neighborTile.image.includes("photo1")
          ? "photo1"
          : "photo2";
        const effectiveSides = getEffectiveSides(neighborTile);
        let neighborEffectiveSide;
        if (check.dx === -1 && check.dy === 0)
          neighborEffectiveSide = effectiveSides[2];
        else if (check.dx === 1 && check.dy === 0)
          neighborEffectiveSide = effectiveSides[0];
        else if (check.dx === 0 && check.dy === -1)
          neighborEffectiveSide = effectiveSides[3];
        else if (check.dx === 0 && check.dy === 1)
          neighborEffectiveSide = effectiveSides[1];

        const allowedSides =
          matchRules[neighborType][newTileType][neighborEffectiveSide];
        if (!allowedSides.includes(check.newSide)) {
          return res.status(400).json({
            errorMessage: `Неверное сопоставление сторон с плиткой по координатам ${neighborKey}`,
          });
        }
      }
    }

    game.board[key] = {
      tile: "image",
      image: game.currentTileImage,
      offsetX: offsetXNum,
      offsetY: offsetYNum,
      rotation: game.imageRotation,
      owner: playerId,
    };

    addNeighbors(game.board, xNum, yNum);
    game.currentMoveMade = true;

    console.log(
      `Игрок ${playerId} установил изображение (${game.currentTileImage}) на плитке (${xNum},${yNum}) с центром (${offsetXNum}, ${offsetYNum}) и вращением ${game.imageRotation}`
    );
    return res.status(200).json(game);
  } catch (err) {
    console.error("Ошибка валидации токена:", err);
    return res
      .status(401)
      .json({ errorMessage: "Неверный токен авторизации." });
  }
};

const endTurn = (req, res) => {
  const { gameId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const playerId = decoded.playerId;
    const game = games[gameId];

    if (game.currentTurn !== playerId) {
      return res.status(403).json({ errorMessage: "Сейчас не ваш ход" });
    }
    if (!game.currentMoveMade) {
      return res
        .status(400)
        .json({ errorMessage: "Вы не поставили плитку в этом ходе" });
    }

    game.remainingCards = game.remainingCards - 1;

    if (game.remainingCards <= 0) {
      game.status = "finished";
      console.log(`Игра ${gameId} завершена!`);
      return res.status(200).json(game);
    }

    game.currentMoveMade = false;
    let currentIndex = game.players.findIndex((p) => p.playerId === playerId);
    let nextIndex = (currentIndex + 1) % game.players.length;
    game.currentTurn = game.players[nextIndex].playerId;
    const images = ["photo1.png", "photo2.png"];
    game.currentTileImage = images[Math.floor(Math.random() * images.length)];

    console.log(
      `Ход игрока ${playerId} завершён. Следующий игрок: ${game.currentTurn}. Новое изображение для нижнего блока: ${game.currentTileImage}`
    );
    return res.status(200).json(game);
  } catch (err) {
    console.error("Ошибка валидации токена:", err);
    return res
      .status(401)
      .json({ errorMessage: "Неверный токен авторизации." });
  }
};

const placeDot = (req, res) => {
  const { gameId } = req.params;
  const { x, y, dotX, dotY } = req.body; // x, y – координаты плитки, dotX, dotY – координаты клика внутри плитки
  const token = req.headers.authorization?.split(" ")[1];

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const playerId = decoded.playerId;
    const game = games[gameId];

    // Проверяем, что сейчас ход данного игрока
    if (game.currentTurn !== playerId) {
      return res.status(403).json({ errorMessage: "Сейчас не ваш ход" });
    }

    // Проверяем координаты плитки
    if (typeof x !== "number" || typeof y !== "number") {
      return res
        .status(400)
        .json({ errorMessage: "Неверные координаты плитки" });
    }

    // Преобразуем координаты точки в числа
    const dotXNum = parseFloat(dotX);
    const dotYNum = parseFloat(dotY);
    if (isNaN(dotXNum) || isNaN(dotYNum)) {
      return res
        .status(400)
        .json({ errorMessage: "Неверные координаты точки" });
    }

    // Выводим в консоль координаты клика
    console.log(
      `Пользователь нажал на плитку (${x},${y}), координаты точки: (${dotXNum}, ${dotYNum})`
    );

    const key = `${x},${y}`;
    if (!(key in game.board)) {
      return res.status(400).json({ errorMessage: "Неверная позиция плитки" });
    }

    const tile = game.board[key];
    if (!tile) {
      return res.status(400).json({ errorMessage: "Плитка не установлена" });
    }
    if (tile.owner !== playerId) {
      return res
        .status(400)
        .json({ errorMessage: "Эта плитка не принадлежит вам" });
    }

    // Находим игрока
    const player = game.players.find((p) => p.playerId === playerId);
    if (!player) {
      return res.status(404).json({ errorMessage: "Игрок не найден" });
    }

    // Если точка уже установлена – возвращаем ошибку
    if (tile.dot) {
      return res.status(400).json({ errorMessage: "Точка уже установлена" });
    }

    // Определяем тёмную версию цвета игрока
    const darkColors = {
      blue: "darkblue",
      red: "darkred",
      green: "darkgreen",
      yellow: "goldenrod",
      black: "dimgray",
    };

    // Сохраняем информацию о точке: цвет и позиция (смещение внутри плитки)
    tile.dot = {
      color: darkColors[player.color] || player.color,
      offsetX: dotXNum,
      offsetY: dotYNum,
    };

    console.log(
      `Игрок ${player.name} поставил точку на плитке (${x},${y}) в позиции (${dotXNum}, ${dotYNum})`
    );
    return res.status(200).json(game);
  } catch (err) {
    console.error("Ошибка валидации токена:", err);
    return res
      .status(401)
      .json({ errorMessage: "Неверный токен авторизации." });
  }
};

const rotateImage = (req, res) => {
  const { gameId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];

  if (!games[gameId]) {
    return res.status(404).json({ errorMessage: "Игра не найдена" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const playerId = decoded.playerId;
    const game = games[gameId];

    // Разрешаем нажимать на эту кнопку только текущему игроку
    if (game.currentTurn !== playerId) {
      return res.status(403).json({ errorMessage: "Сейчас не ваш ход" });
    }

    // Изменяем угол поворота на 90 градусов (по модулю 360)
    game.imageRotation = (game.imageRotation + 90) % 360;

    console.log(
      `Игрок ${playerId} повернул изображение. Новый угол: ${game.imageRotation}`
    );
    return res.status(200).json(game);
  } catch (err) {
    console.error("Ошибка валидации токена при повороте:", err);
    return res
      .status(401)
      .json({ errorMessage: "Неверный токен авторизации." });
  }
};

module.exports = {
  createGame,
  joinGame,
  startGame,
  getGameState,
  leaveGame,
  makeMove,
  placeTile,
  endTurn,
  placeDot,
  rotateImage,
};
