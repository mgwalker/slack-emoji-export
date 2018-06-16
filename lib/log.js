/* eslint-disable no-console */
const chalk = require('chalk');

const colors = {
  config: {
    header: chalk.bgMagenta.white.bold,
    main: chalk.magenta
  },
  get: {
    header: chalk.bgCyan.black.bold,
    main: chalk.cyan
  },
  download: {
    header: chalk.bgBlue.black.bold,
    main: chalk.blue
  },
  pack: {
    header: chalk.bgYellow.black,
    main: chalk.yellow
  }
};

const HEADER_LENGTH = 30;
const strpad = str => {
  const start = Math.floor((str.length - HEADER_LENGTH) / 2) + 1;
  const chrs = Array(HEADER_LENGTH - str.length).fill(' ');
  chrs.splice(start, 0, str);
  return chrs.join('');
};

const log = color => str => console.log(color(`   ${str}`));

const loggerCache = {};

module.exports = section => {
  if (!loggerCache[section]) {
    const c = colors[section] || {
      header: chalk.bgRed.white.bold,
      main: chalk.red
    };
    const logger = log(c.main);
    logger.header = txt => console.log(`\n${c.header(strpad(txt))}`);
    loggerCache[section] = logger;
    return logger;
  }
  return loggerCache[section];
};
