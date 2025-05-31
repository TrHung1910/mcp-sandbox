/**
 * String manipulation utilities for MCP Sandbox demo
 */

/**
 * Convert string to title case
 * @param str The string to convert
 */
function toTitleCase(str = '') {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Generate a random string
 * @param length Length of the string to generate
 * @param includeNumbers Whether to include numbers
 */
function randomString(length = 10, includeNumbers = true) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const pool = includeNumbers ? chars + numbers : chars;

  let result = '';
  for (let i = 0; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result;
}

/**
 * Count words in a string
 * @param text The text to analyze
 */
function wordCount(text = '') {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Reverse a string
 * @param str The string to reverse
 */
function reverse(str = '') {
  return str.split('').reverse().join('');
}

/**
 * Check if string is palindrome
 * @param str The string to check
 * @param ignoreCase Whether to ignore case differences
 */
function isPalindrome(str = '', ignoreCase = true) {
  const normalized = ignoreCase ? str.toLowerCase() : str;
  const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

/**
 * Capitalize first letter of each word
 * @param str The string to capitalize
 */
function capitalize(str = '') {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
}

module.exports = {
  toTitleCase,
  randomString,
  wordCount,
  reverse,
  isPalindrome,
  capitalize,
};
