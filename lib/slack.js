const defaultFs = require('fs');
const request = require('request-promise-native');
const cheerio = require('cheerio');

const wait = async seconds =>
  new Promise(resolve => setTimeout(resolve, seconds * 1000));

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

  async getToken() {
    const url = `${this.opts.url}/customize/emoji`;
    const body = await this.opts.req({
      method: 'GET',
      url,
      jar: this.opts.jar
    });

    const tokenMatch = body.match(/api_token: "([^"]+)"/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
    throw new Error('could not get token');
  }

  async getEmoji(
    token,
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

    const url = `${
      this.opts.url
    }/api/emoji.adminList?page=${page}&token=${token}`;
    const response = await this.opts.req({
      method: 'GET',
      url,
      json: true
    });

    if (response.ok) {
      response.emoji.forEach(item => {
        /* eslint-disable no-param-reassign */
        if (item.is_alias) {
          if (!emojis.aliases[item.alias_for]) {
            emojis.aliases[item.alias_for] = [];
          }
          emojis.aliases[item.alias_for].push(item.name);
        } else {
          emojis.images[item.name] = item.url;
        }
      });

      log(`     processed ${response.emoji.length} emoji`);

      if (response.paging.page < response.paging.pages) {
        await wait(5);
        await this.getEmoji(token, page + 1, { emojis, log });
      }
    }

    return emojis;
  }
}

module.exports = Slack;
