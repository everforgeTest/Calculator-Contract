const fs = require('fs');

function loadEnv() {
  try {
    const res = fs.readFileSync('.env', 'utf8');
    res.split(/\?\
/).forEach((line) => {
      if (!line || !line.includes('=')) return;
      const idx = line.indexOf('=');
      const key = line.substring(0, idx).trim();
      const rawVal = line.substring(idx + 1);
      if (!key) return;
      let val = rawVal;
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    });
  } catch (e) {
    // No .env available, ignore.
  }
}

module.exports = { loadEnv };
