import { execSync } from 'child_process';

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
  // Reset test database if needed
  // execSync('npx prisma migrate reset --force --skip-seed', {
  //   env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
  // });
});

// Global cleanup after all tests
afterAll(async () => {
  // Cleanup
});
