// carcassonne-server/helpers/tileSegments.js

// Определяем области для каждого типа плитки в виде полигонов.
// Координаты задаются в относительных единицах от 0 до 1.
const tileAreas = {
  photo1: [
    {
      name: "cityArea",
      type: "city",
      polygon: [
        [0.0, 0.0],
        [1.0, 0.0],
        [1.0, 0.4],
        [0.0, 0.4]
      ]
    },
    {
      name: "roadArea",
      type: "road",
      polygon: [
        [0.3, 0.4],
        [0.7, 0.4],
        [0.7, 0.6],
        [0.3, 0.6]
      ]
    },
    {
      name: "fieldArea",
      type: "field",
      polygon: [
        [0.0, 0.6],
        [1.0, 0.6],
        [1.0, 1.0],
        [0.0, 1.0]
      ]
    }
  ],
  photo2: [
    {
      name: "fieldArea",
      type: "field",
      polygon: [
        [0.0, 0.0],
        [1.0, 0.0],
        [1.0, 0.5],
        [0.0, 0.5]
      ]
    },
    {
      name: "roadArea",
      type: "road",
      polygon: [
        [0.4, 0.5],
        [0.6, 0.5],
        [0.6, 1.0],
        [0.4, 1.0]
      ]
    }
  ]
};

// Функция проверки принадлежности точки полигону.
// Используется алгоритм "Ray Casting".
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Функция, определяющая, в какую область (по полигону) попали относительные координаты клика.
// tile.type – например, "photo1" или "photo2"
// relativeX и relativeY – координаты клика, нормализованные к диапазону 0-1.
function getSegmentForClick(tile, relativeX, relativeY) {
  const areas = tileAreas[tile.type];
  if (!areas) return null;
  
  // Применяем обратное вращение к координатам клика, если tile.rotation не 0.
  // Центр плитки в нормализованных координатах: (0.5, 0.5)
  const angle = -tile.rotation * (Math.PI / 180); // обратное преобразование
  const dx = relativeX - 0.5;
  const dy = relativeY - 0.5;
  const unrotatedX = Math.cos(angle) * dx - Math.sin(angle) * dy + 0.5;
  const unrotatedY = Math.sin(angle) * dx + Math.cos(angle) * dy + 0.5;
  
  // Теперь проверяем принадлежность точки (unrotatedX, unrotatedY) к каждому полигону.
  for (const area of areas) {
    if (pointInPolygon([unrotatedX, unrotatedY], area.polygon)) {
      return { segment: area.name, type: area.type };
    }
  }
  return null;
}


module.exports = {
  tileAreas,
  getSegmentForClick,
  pointInPolygon
};
