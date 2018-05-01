const fs = require('fs');
const path = require('path');
const uglify = require('uglify-js').minify;
const chalk = require('chalk');

const { rollup } = require('rollup');
const script = require('./config');

const isProduction = process.env.MODE === 'production';

async function buildESM () {
  console.log(chalk.cyan('📦  Generating esm build...'));

  // get the rollup bundle.
  const bundle = await rollup({
    input: script.paths.esm,
    ...script.inputOptions
  });

  // pass the desired output config
  const { code } = await bundle.generate({
    format: 'es',
    banner: script.banner
  });

  const filePath = path.join(script.paths.dist, 'flux.esm.js');

  fs.writeFileSync(filePath, code);

  const stats = isProduction ? script.utils.stats({ path: filePath, code }) : '';
  console.log(`${chalk.green('👍  flux.esm.js'.padEnd(25, ' '))} ${stats}`);
}

async function buildScripts () {
  console.log(chalk.cyan('📦  Generating umd builds...'));

  // get the rollup bundle.
  const bundle = await rollup({
    input: script.paths.umd,
    ...script.inputOptions
  });

  // pass the desired output config
  const { code } = await bundle.generate({
    format: 'umd',
    name: 'Flux',
    banner: script.banner
  });

  let filePath = path.join(script.paths.dist, 'flux.js');

  // write the un-minified code.
  fs.writeFileSync(filePath, code);
  let stats = isProduction ? script.utils.stats({ path: filePath, code }) : '';
  console.log(`${chalk.green('👍  flux.js'.padEnd(25, ' '))} ${stats}`);

  // write the minified code.
  if (!isProduction) return;
  filePath = path.join(script.paths.dist, 'flux.min.js');
  fs.writeFileSync(filePath, uglify(code, script.uglifyOptions).code);
  stats = script.utils.stats({ path: filePath, code });
  console.log(`${chalk.green('👍  flux.min.js'.padEnd(25, ' '))} ${stats}`);
}

buildESM();
buildScripts();

module.exports = { buildScripts };
