const baseSides = [1, 2, 3, 4];

function getEffectiveSides(tile) {
  const steps = (((tile.rotation % 360) + 360) % 360) / 90;
  let effective = baseSides.slice();
  for (let i = 0; i < steps; i++) {
    effective.unshift(effective.pop());
  }
  return effective;
}

const matchRules = {
  photo1: {
    photo2: {
      1: [1, 4],
      2: [],
      3: [2, 3],
      4: [1, 4],
    },
    photo1: {
      1: [1, 4],
      2: [2],
      3: [3],
      4: [1, 4],
    },
  },
  photo2: {
    photo1: {
      1: [1, 4],
      2: [3],
      3: [3],
      4: [1, 4],
    },
    photo2: {
      1: [1, 4],
      2: [2, 3],
      3: [2, 3],
      4: [1, 4],
    },
  },
};

module.exports = { getEffectiveSides, matchRules };
