const originalError = console.error;

console.error = (...args) => {
  if (args[0].includes('Each child in a list should have a unique "key" prop')) {
    return;
  }
  originalError.call(console, ...args);
};
