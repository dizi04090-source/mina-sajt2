// A separate local build directory avoids locks from synced preview artifacts.
module.exports = { distDir: process.env.MINA_BUILD_DIR || '.next' };
