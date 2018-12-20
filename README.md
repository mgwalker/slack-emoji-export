# slack-emoji-export

A tool that can extract a [Slack emojipack](https://github.com/lambtron/emojipacks)
from a Slack you can log into.

- If you don't download the emoji, you get an `emojipack.yaml` file
  that can be used by the [emojipacks](https://github.com/lambtron/emojipacks)
  tool to import them into another Slack. The YAML file will point
  to the image files on Slack's servers, which are (for now, anyway!)
  accessible without authentication.

- If you download the emoji, you get an `emojipack.zip` file that
  contains the YAML file as well as all the images. When you
  unzip it, the YAML file should be ready to go.

# Running it

You'll need [Node.js 8.x](https://nodejs.org/en/download/) or higher.

#### With npm@6 or greater

You can run the exporter with npx and not have to install anything.
The prompts will ask what they need!

```console
npx slack-emoji-export
```

#### With older npm

If you have an older version of npm, you can install the
exporter globally, then run it and follow the prompts.

```console
npm install -g slack-emoji-export
slack-emoji-export
```
