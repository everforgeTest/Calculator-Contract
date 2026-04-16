const { runCalculatorTests } = require('./TestCases/CalculatorTest');

(async () => {
  try {
    await runCalculatorTests();
    console.log('All tests passed.');
    process.exit(0);
  } catch (e) {
    console.error('Tests failed:', e.message);
    process.exit(1);
  }
})();
