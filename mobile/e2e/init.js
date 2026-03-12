const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');

beforeAll(async () => {
  await detox.init();
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
