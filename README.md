# slack-emoji-exporter

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
