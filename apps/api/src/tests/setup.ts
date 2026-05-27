import "dotenv/config";

// Allow a separate test DB so production data is never touched during tests.
// Set TEST_DATABASE_URL in .env (or .env.test) to a second Supabase project.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
