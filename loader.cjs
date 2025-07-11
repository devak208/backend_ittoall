console.log("🚀 loader.cjs started...");

import('file:///home/tracecodeadmin/domains/api.tracecode.site/backend/src/index.js')
  .then(() => {
    console.log("✅ index.js loaded successfully.");
  })
  .catch((err) => {
    console.error("❌ Failed to load ESM app:", err);
  });
