import React from "react";

const CarcassonneMap = ({
  board,
  onPlaceTile,
  onPlaceDot,
  isCurrentTurn,
  myColor,
  myId,
}) => {
  const tileSize = 80;
  const centerCoord = tileSize / 2;
  const dotDiameter = 15;
  const halfDot = dotDiameter / 2;

  const keys = Object.keys(board);
  if (keys.length === 0) return null;

  const xs = keys.map((key) => parseInt(key.split(",")[0], 10));
  const ys = keys.map((key) => parseInt(key.split(",")[1], 10));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const numCols = maxX - minX + 1;
  const numRows = maxY - minY + 1;

  const cells = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${y}`;
      const cell = board.hasOwnProperty(key) ? board[key] : undefined;
      cells.push({ x, y, key, cell });
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${numCols}, ${tileSize}px)`,
        gridTemplateRows: `repeat(${numRows}, ${tileSize}px)`,
        gap: "5px",
        justifyContent: "center",
        marginTop: "20px",
      }}
    >
      {cells.map(({ x, y, key, cell }) => (
        <div
          key={key}
          style={{
            border: "1px solid black",
            backgroundColor: cell ? "#ddd" : "#f0f0f0",
            width: `${tileSize}px`,
            height: `${tileSize}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            cursor:
              (!cell && isCurrentTurn) ||
              (cell &&
                cell.tile === "image" &&
                isCurrentTurn &&
                !cell.dot &&
                cell.owner === myId)
                ? "pointer"
                : "default",
          }}
          onClick={(e) => {
            if (!cell && isCurrentTurn) {
              onPlaceTile(x, y, centerCoord, centerCoord);
            } else if (
              cell &&
              cell.tile === "image" &&
              isCurrentTurn &&
              !cell.dot &&
              cell.owner === myId
            ) {
              const rect = e.currentTarget.getBoundingClientRect();
              const offsetX = e.clientX - rect.left;
              const offsetY = e.clientY - rect.top;
              const clampedX = Math.min(
                Math.max(offsetX, halfDot),
                tileSize - halfDot
              );
              const clampedY = Math.min(
                Math.max(offsetY, halfDot),
                tileSize - halfDot
              );
              onPlaceDot(x, y, clampedX, clampedY);
            }
          }}
        >
          {/* Если плитка установлена и содержит изображение, отображаем его */}
          {cell && cell.tile === "image" && (
            <img
              src={`/${cell.image}`}
              alt="Tile"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `rotate(${cell.rotation}deg)`,
              }}
            />
          )}
          {/* Если на плитке установлена точка, отображаем её */}
          {cell && cell.dot && (
            <div
              style={{
                position: "absolute",
                left: cell.dot.offsetX - halfDot,
                top: cell.dot.offsetY - halfDot,
                width: `${dotDiameter}px`,
                height: `${dotDiameter}px`,
                borderRadius: "50%",
                backgroundColor: cell.dot.color,
              }}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CarcassonneMap;
