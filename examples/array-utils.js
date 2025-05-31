/**
 * Array manipulation utilities for MCP Sandbox demo
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param array The array to shuffle
 */
function shuffle(array = []) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get unique values from array
 * @param array The array to process
 */
function unique(array = []) {
  return Array.from(new Set(array));
}

/**
 * Chunk array into smaller arrays
 * @param array The array to chunk
 * @param size The chunk size
 */
function chunk(array = [], size = 2) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Find the intersection of two arrays
 * @param arr1 First array
 * @param arr2 Second array
 */
function intersection(arr1 = [], arr2 = []) {
  return arr1.filter((x) => arr2.includes(x));
}

/**
 * Find the difference between two arrays
 * @param arr1 First array
 * @param arr2 Second array
 */
function difference(arr1 = [], arr2 = []) {
  return arr1.filter((x) => !arr2.includes(x));
}

/**
 * Flatten a nested array
 * @param array The array to flatten
 * @param depth The depth to flatten (default: 1)
 */
function flatten(array = [], depth = 1) {
  return array.flat(depth);
}

module.exports = {
  shuffle,
  unique,
  chunk,
  intersection,
  difference,
  flatten,
};
