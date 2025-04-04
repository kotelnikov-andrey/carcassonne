import React from "react";
import TileOverlay from "./TileOverlay";

function TileComponent({ tile, tileSize, onAreaClick }) {
  return (
    <div style={{ position: "relative", width: tileSize, height: tileSize }}>
      <img
        src={`/${tile.image}`}
        alt="Tile"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: tileSize,
          height: tileSize,
          objectFit: "cover",
          transform: `rotate(${tile.rotation}deg)`,
        }}
      />
      {tile.active && (
        <TileOverlay tile={tile} tileSize={tileSize} onAreaClick={onAreaClick} />
      )}
      {tile.meeple && (
        <div
          style={{
            position: "absolute",
            left: tile.meeple.offsetX - 7.5,
            top: tile.meeple.offsetY - 7.5,
            width: "15px",
            height: "15px",
            borderRadius: "50%",
            backgroundColor: tile.meeple.color,
            border: "1px solid white",
          }}
        />
      )}
    </div>
  );
}

export default TileComponent;
