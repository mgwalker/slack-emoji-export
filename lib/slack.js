const defaultFs = require('fs');
const request = require('request-promise-native');
const cheerio = require('cheerio');

class Slack {
  constructor(opts, fs = defaultFs, req = request, $ = cheerio) {
    this.opts = {
      ...opts,
      url: `https://${opts.subdomain}.slack.com`,
      jar: request.jar(),
      req,
      cheerio: $,
      fs
    };
  }

  async login(
    getToken = () => Promise.reject(new Error('Token callback undefined'))
  ) {
    const loginPath = '/?no_sso=1';
    const tokensBody = await this.opts.req({
      method: 'GET',
      url: `${this.opts.url}${loginPath}`,
      jar: this.opts.jar
    });

    const $tokens = this.opts.cheerio.load(tokensBody);
    const formData = {
      signin: $tokens('#signin_form input[name="signin"]').attr('value'),
      redir: $tokens('#signin_form input[name="redir"]').attr('value'),
      crumb: $tokens('#signin_form input[name="crumb"]').attr('value'),
      email: this.opts.email,
      password: this.opts.password
    };

    const loginBody = await this.opts.req({
      method: 'POST',
      url: `${this.opts.url}${loginPath}`,
      jar: this.opts.jar,
      followAllRedirects: true,
      formData
    });

    if (/enter your authentication code/i.test(loginBody)) {
      const token = await getToken();

      const tokenFormData = {};
      const $login = this.opts.cheerio.load(loginBody);
      $login('form input').each((_, { attribs: { name, value } }) => {
        if (name && name !== 'input') {
          tokenFormData[name] = value;
        }
      });
      tokenFormData['2fa_code'] = token;

      await this.opts.req({
        method: 'POST',
        url: `${this.opts.url}/`,
        jar: this.opts.jar,
        followAllRedirects: true,
        formData: tokenFormData
      });
    }
  }

  async getEmoji(
    page = 1,
    {
      emojis = {
        aliases: {},
        images: {}
      },
      log = () => {}
    } = {}
  ) {
    log(`...page ${page}`);
    const url = `${this.opts.url}/customize/emoji?page=${page}`;
    const body = await this.opts.req({
      method: 'GET',
      url,
      jar: this.opts.jar
    });

    const $ = this.opts.cheerio.load(body);
    $('tr.emoji_row').each((_, row) => {
      const $$ = $(row);

      const type = $('td[headers="custom_emoji_type"]', $$)
        .text()
        .trim();
      const name = $('td[headers="custom_emoji_name"]', $$)
        .text()
        .trim()
        .replace(/:/g, '');
      const iurl = $(
        'td[headers="custom_emoji_image"] span.emoji-wrapper',
        $$
      ).attr('data-original');

      if (type === 'Image') {
        emojis.images[name] = iurl; // eslint-disable-line no-param-reassign
      } else {
        const source = type
          .replace(/alias for/gi, '')
          .replace(/:/g, '')
          .trim();
        if (!emojis.aliases[source]) {
          emojis.aliases[source] = []; // eslint-disable-line no-param-reassign
        }
        emojis.aliases[source].push(name);
      }
    });

    const nextPage = $('div.pagination li:last-child a').attr(
      'data-pagination'
    );
    if (nextPage) {
      await this.getEmoji(nextPage, { emojis, log });
    }

    return emojis;
  }
}

module.exports = Slack;
