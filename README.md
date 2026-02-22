<!--
 * @Author: kavinbj kwfelix@163.com
 * @Date: 2024-11-22 17:48:39
 * @LastEditors: kavinbj kwfelix@163.com
 * @LastEditTime: 2024-11-29 20:31:14
 * @FilePath: /ComicEditor/README.md
 * @Description:
-->
# React Konva Layering Tutorial




### Vercel ###
install vercel cli:
```bash
npm install -g vercel
```

login vercel:
```bash
vercel login
```

run vercel:
```bash
vercel dev
```

# Startup

1.**** The project uses node version v20.xx. Latest node version may not work.

2. `.env` file is required. You can request to Sophia or Shiyu Wang for the file.

3. The backend (or server side endpoints) is running on Vercel. You must use vercel to run the project.

4. The project may not run well on the Windows because of some directory structure. Windows sub-system (WSL) or MacOS is recommended.


### about api ###
Default use of Vercel's API folder
Vercel supports various languages (such as JavaScript, Python, Go, etc.) by default for building serverless functions.
If you place the function files in the API/folder of the project root directory, Vercel will directly deploy these files as serverless functions.

Do not add API folders in pages or src/pages, otherwise there will be a warning when using the Vercel dev command

## Translation script

node version: v22.xx

1. script path: `scripts/translateIi18n.cjs`
2. run script:
```bash
node --env-file=.env scripts/translateIi18n.cjs
```
When you add new json file, you need to run the script again. The script will not translate old json file.

> why use node version v22.xx?
> because the script requires the esm module that is not supported in node version v20.xx.

> Note: If you run the script in China mainland, it may not work. You need to run the script on the server and feel free to contact Sophia or Shiyu Wang for help.

## Update translation

node version: v22.xx
<!-- 1. old json files in `scripts/oldJson/` -->
1. run script:
```bash
node --env-file=.env scripts/updateI18n.cjs
```
### How to use
change the json file in `src/i18n/locales/en/` and do not add or commit the json file then run the script.

# Generate Tools Page Links Automatically
Tools page is `/tools` page which contains all tools links. You don't need to update it manually.
If you add a new tool page, you just add a comment like `// [#target:tools]` in the new tool page.
The script will extract the target page and generate the tools page automatically.

> NOTE: New tool page's `i18n` json file name is needed to be same as the tool page name. `/tools` page will use the tool page name as `i18n` namespace.

# Variant Pages Generation (SEO)

Generate derivative pages for SEO optimization using AI-powered content and image generation.

## Quick Start

```bash
# Setup configuration
npm run gen:setup

# List available tools
npm run gen:list

# Generate a variant page
npm run gen ai-anime-generator naruto

# Generate with custom options
npm run gen ai-anime-generator "demon slayer" -- --model=GPT --count=8
```

## Available Commands

| Command                        | Description               | Example                                 |
| ------------------------------ | ------------------------- | --------------------------------------- |
| `npm run gen:setup`            | Initialize configuration  | `npm run gen:setup`                     |
| `npm run gen:list`             | Show available tool types | `npm run gen:list`                      |
| `npm run gen <tool> <keyword>` | Generate variant page     | `npm run gen ai-anime-generator naruto` |

For detailed documentation, see [scripts/README.md](scripts/README.md).

# Auth
`next-auth` is locked to `4.24.7` because of rewriting some code by ourself and you can check changes that we make in `scripts/replaceNextAuthCode.cjs`

## Utils

### Transfer mp4 to webm on MacOS

**Requirements:** Install ffmpeg first
```bash
brew install ffmpeg
```

**Usage:** Navigate to the directory containing your .mp4 files, then run:
```
for file in *.mp4
    set output (string replace .mp4 .webm $file)
    ffmpeg -i "$file" -c:v libvpx-vp9 -crf 40 -b:v 0 -c:a libvorbis -b:a 64k "$output"
end
```

### Compress webp image on MacOS

**Requirements:** Install ImageMagick first
```bash
brew install imagemagick
```

**Usage:** Navigate to the directory containing your .webp files, then run:
```
mogrify -quality 80 *.webp
```

