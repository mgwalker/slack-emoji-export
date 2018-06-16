const defaultFs = require('fs');
const path = require('path');
const request = require('request-promise-native');
const Queue = require('p-queue');

const sleep = async duration =>
  new Promise(resolve => {
    setTimeout(resolve, duration);
  });

const download = async (
  emoji,
  {
    concurrency = 3,
    fs = defaultFs,
    jar = {},
    log = () => {},
    oneFinished = () => {},
    req = request
  } = {}
) => {
  const queue = new Queue({ concurrency });

  if (!fs.existsSync('./emoji')) {
    fs.mkdirSync('./emoji');
  }

  Object.entries(emoji).forEach(([name, url]) => {
    queue.add(async () => {
      const fn = `${name.replace(/\s/g, '_')}${path.extname(url)}`;
      const stream = fs.createWriteStream(`./emoji/${fn}`);
      log(`downloading :${name}:`);

      await new Promise(resolve =>
        req({ method: 'GET', url, jar })
          .pipe(stream)
          .on('finish', resolve)
      );
      emoji[name] = `./emoji/${fn}`; // eslint-disable-line no-param-reassign
      log(`done with :${name}:`);
      oneFinished();
      await sleep(1000);
    });
  });

  await queue.onIdle();
  log('down with all downloads');
};

module.exports = download;
