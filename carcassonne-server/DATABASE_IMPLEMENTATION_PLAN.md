# PostgreSQL Implementation Plan

This document outlines the plan for implementing PostgreSQL database support for all game controller methods.

## Already Implemented Methods

- ✅ **createGame**: Creates a new game and stores it in the database
- ✅ **joinGame**: Adds a player to an existing game and updates the database
- ✅ **getGameState**: Retrieves the current state of a game from the database

## Implementation Plan for Remaining Methods

### 1. startGame

```javascript
const startGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Find game in database
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ errorMessage: "Игра не найдена" });
    }
    
    if (game.status === "active") {
      return res.status(400).json({ errorMessage: "Игра уже начата" });
    }
    
    // Assign colors to players
    const availableColors = ["yellow", "red", "green", "blue", "black"];
    availableColors.sort(() => Math.random() - 0.5);
    
    if (game.players.length > availableColors.length) {
      return res.status(400).json({ errorMessage: "Слишком много игроков для доступных цветов" });
    }
    
    game.players.forEach((player, index) => {
      player.color = availableColors[index];
    });
    
    // Initialize game board
    const images = ["photo1.png", "photo2.png"];
    const chosenImage = images[Math.floor(Math.random() * images.length)];
    
    game.board = {};
    game.board["0,0"] = {
      tile: "image",
      image: chosenImage,
      offsetX: 40,
      offsetY: 40,
      rotation: 0,
      owner: "system",
    };
    
    game.currentTileImage = chosenImage;
    
    // Add neighbors to the initial tile
    addNeighbors(game.board, 0, 0);
    
    // Set game state
    game.currentMoveMade = false;
    game.currentTurn = game.players[0].playerId;
    game.imageRotation = 0;
    game.status = "active";
    game.remainingCards = 20;
    
    // Save changes to database
    await game.save();
    
    console.log(`Игра ${gameId} началась! Осталось 20 карт.`);
    return res.status(200).json(game);
  } catch (error) {
    console.error("Error starting game:", error);
    return res.status(500).json({ errorMessage: "Internal server error" });
  }
};
```

### 2. leaveGame

```javascript
const leaveGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    
    // Find game in database
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ errorMessage: "Игра не найдена" });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const playerId = decoded.playerId;
      
      const playerIndex = game.players.findIndex(
        (player) => player.playerId === playerId
      );
      
      if (playerIndex !== -1) {
        const removedPlayer = game.players.splice(playerIndex, 1);
        console.log(`Игрок ${removedPlayer[0].name} покинул игру ${gameId}.`);
        
        if (game.players.length === 0) {
          // Delete game if no players left
          // TODO: Implement game deletion from database
          console.log(`Игра ${gameId} удалена, так как все игроки покинули лобби.`);
          return res.status(200).json({ message: "Вы успешно покинули игру." });
        }
        
        // Save changes to database
        await game.save();
        
        return res.status(200).json({ message: "Вы успешно покинули игру." });
      } else {
        return res.status(404).json({ errorMessage: "Игрок не найден в этой игре." });
      }
    } catch (err) {
      console.error("Ошибка валидации токена:", err);
      return res.status(401).json({ errorMessage: "Неверный токен авторизации." });
    }
  } catch (error) {
    console.error("Error leaving game:", error);
    return res.status(500).json({ errorMessage: "Internal server error" });
  }
};
```

### 3. makeMove

```javascript
const makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    
    // Find game in database
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ errorMessage: "Игра не найдена" });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const playerId = decoded.playerId;
      
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
      
      // Save changes to database
      await game.save();
      
      console.log(`Игрок ${player.name} сделал ход. Цвет: ${player.color}`);
      return res.status(200).json(game);
    } catch (err) {
      console.error("Ошибка валидации токена:", err);
      return res.status(401).json({ errorMessage: "Неверный токен авторизации." });
    }
  } catch (error) {
    console.error("Error making move:", error);
    return res.status(500).json({ errorMessage: "Internal server error" });
  }
};
```

### 4. placeTile, endTurn, placeDot, rotateImage

These methods follow the same pattern:

1. Retrieve the game from the database using `Game.findById(gameId)`
2. Perform the necessary operations on the game object
3. Save the changes to the database using `await game.save()`
4. Return the updated game state

## Database Optimization Considerations

1. **Indexing**: Consider adding indexes to frequently queried fields:
   ```javascript
   // In migration file
   table.index('status');
   ```

2. **Transactions**: For operations that modify multiple records, use transactions:
   ```javascript
   const trx = await db.transaction();
   try {
     // Perform database operations
     await trx.commit();
   } catch (error) {
     await trx.rollback();
     throw error;
   }
   ```

3. **Query Optimization**: For complex queries, consider using raw SQL or optimized Knex queries

## Testing Strategy

1. Create unit tests for each database method
2. Test error handling and edge cases
3. Perform load testing to ensure database performance under heavy load

## Deployment Considerations

1. Ensure database migrations run automatically on deployment
2. Set up proper database backups
3. Configure connection pooling for production environments