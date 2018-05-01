const { paths } = require('./config');
const { buildScripts } = require('./scripts');
const bs = require('browser-sync').create();

bs.init({
  server: true,
  files: [
    paths.dist, {
      match: paths.src,
      fn (event, file) {
        buildScripts();
      }
    }
  ]
});
