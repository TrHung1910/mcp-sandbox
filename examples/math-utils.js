/**
 * Mathematical utility functions for MCP Sandbox demo
 */

/**
 * Calculate the area of a circle
 * @param radius The radius of the circle
 */
function circleArea(radius = 1) {
  if (radius < 0) {
    throw new Error('Radius cannot be negative');
  }
  return Math.PI * radius * radius;
}

/**
 * Generate fibonacci sequence up to n numbers
 * @param count Number of fibonacci numbers to generate
 */
function fibonacci(count = 10) {
  if (count < 1) {
    return [];
  }

  const seq = [0, 1];
  for (let i = 2; i < count; i++) {
    seq[i] = seq[i - 1] + seq[i - 2];
  }
  return seq.slice(0, count);
}

/**
 * Calculate compound interest
 * @param principal Initial investment amount
 * @param rate Annual interest rate (as decimal)
 * @param time Time period in years
 * @param compound Number of times interest compounds per year
 */
function compoundInterest(principal, rate, time, compound = 1) {
  if (principal < 0 || rate < 0 || time < 0 || compound < 1) {
    throw new Error('Invalid input parameters');
  }
  return principal * Math.pow(1 + rate / compound, compound * time);
}

/**
 * Check if a number is prime
 * @param num The number to check
 */
function isPrime(num = 2) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;

  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 */
function degreesToRadians(degrees = 0) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the factorial of a number
 * @param n The number to calculate factorial for
 */
function factorial(n = 5) {
  if (n < 0) throw new Error('Factorial not defined for negative numbers');
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

module.exports = {
  circleArea,
  fibonacci,
  compoundInterest,
  isPrime,
  degreesToRadians,
  factorial,
};
