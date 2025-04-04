// carcassonne-frontend/src/data/tileAreas.js

// Координаты задаются в относительных единицах (от 0 до 1)
export const tileAreas = {
  photo1: [
    {
      name: "cityArea",
      type: "city",
      // Верхняя область – город (например, верхняя 40% плитки)
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
      // Центральная область – дорога (пример)
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
      // Нижняя область – поле
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
