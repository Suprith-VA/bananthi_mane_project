// tests/api/globalSetup.js
// ─────────────────────────────────────────────────────────────────────────────
// Vitest globalSetup — runs once before the entire test suite.
// Verifies the API server is reachable so every test file gets a clear,
// actionable error instead of a flood of "fetch failed" messages.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5001";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth(attempt) {
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== "ok") throw new Error(`Unexpected health payload: ${JSON.stringify(body)}`);
    return true;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(
        `  [globalSetup] Server not ready (attempt ${attempt}/${MAX_RETRIES}): ${err.message} — retrying in ${RETRY_DELAY_MS}ms…`
      );
      return false;
    }
    throw err;
  }
}

export async function setup() {
  console.log(`\n🔍  Checking API server at ${BASE_URL} …`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const ok = await checkHealth(attempt);
    if (ok) {
      console.log(`✅  Server is reachable — starting test suite.\n`);
      return;
    }
    await sleep(RETRY_DELAY_MS);
  }

  // If we reach here all retries failed — throw a human-readable error
  throw new Error(
    `\n\n` +
    `╔══════════════════════════════════════════════════════════════╗\n` +
    `║          API SERVER IS NOT RUNNING — TESTS ABORTED          ║\n` +
    `╠══════════════════════════════════════════════════════════════╣\n` +
    `║  Expected server at: ${BASE_URL.padEnd(38)}║\n` +
    `║                                                              ║\n` +
    `║  Start it first:                                             ║\n` +
    `║    cd server && npm run dev                                  ║\n` +
    `║                                                              ║\n` +
    `║  Or set a custom URL:                                        ║\n` +
    `║    TEST_API_URL=http://localhost:5000 npm run test:api       ║\n` +
    `╚══════════════════════════════════════════════════════════════╝\n`
  );
}

export async function teardown() {
  // Nothing to tear down — we are testing against a live server
  // that the developer manages themselves.
}
