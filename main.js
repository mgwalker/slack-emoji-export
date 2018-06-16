const fs = require('fs');
const prompt = require('prompt');
const chalk = require('chalk');
const json2yaml = require('json-to-pretty-yaml');
const pace = require('pace');
const Zip = require('adm-zip');
const rmrf = require('rimraf');
const log = require('./lib/log');
const download = require('./lib/download');
const Slack = require('./lib/slack');

prompt.start();
prompt.message = '';
log('config').header('Configuration');
prompt.get(
  {
    properties: {
      subdomain: {
        message: chalk.magenta('   Slack subdomain:'),
        required: true
      },
      email: {
        message: chalk.magenta('             email:'),
        required: true
      },
      password: {
        message: chalk.magenta('          password:'),
        hidden: true,
        required: true
      },
      download: {
        message: `${chalk.white(
          `   Emoji can be downloaded locally to make a completely\n   self-contained emojipack, or the emojipack can\n   reference their URLs on Slack's server.`
        )}\n${chalk.magenta('          download?')}`,
        required: true,
        validator: /^(true|t|y|yes|false|f|n|no)$/i,
        before: v => /^(t|y)/i.test(v)
      }
    }
  },
  async (_, result) => {
    log('get').header('Getting emoji');
    log('get')('logging into Slack');
    const slack = new Slack(result);
    await slack.login(
      () =>
        new Promise(resolve => {
          prompt.get(
            {
              properties: {
                token: {
                  message: chalk.magenta('     auth token:'),
                  required: true
                }
              }
            },
            (__, token) => {
              resolve(token.token);
            }
          );
        })
    );
    log('get')('getting list of emoji');
    const emoji = await slack.getEmoji();

    if (result.download) {
      log('download').header('Downloading emoji images');
      const progress = pace(Object.keys(emoji.images).length);

      await download(emoji.images, {
        oneFinished: () => {
          progress.op();
        }
      });
      log('download')();
    }

    log('pack').header('Making emojipack');
    log('pack')('fixing up package file');
    const emojipack = {
      title: result.subdomain,
      emojis: Object.entries(emoji.images).map(([name, src]) => {
        const aliases = emoji.aliases[name];
        if (aliases && aliases.length) {
          return { name, aliases, src };
        }
        return { name, src };
      })
    };
    log('pack')('saving emojipack.yaml');
    fs.writeFileSync('./emojipack.yaml', json2yaml.stringify(emojipack));

    if (result.download) {
      log('pack')('creating emojipack.zip');
      const zipfile = new Zip();
      zipfile.addLocalFile('./emojipack.yaml');
      zipfile.addLocalFolder('./emoji', 'emoji');
      zipfile.writeZip('./emojipack.zip');

      log('pack')('cleaning up');
      fs.unlinkSync('./emojipack.yaml');
      rmrf.sync('./emoji');
    }
  }
);
