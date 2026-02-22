* 使用方式：

  ```plain&#x20;text
  ${用户的prompt，去掉中括号的风格}

  Art style requirement: ${style_prompt}

  Grid design requirement: ${grid_prompt}
  ```

* 输入框里art style展示为\[art-style-name]，grid展示为\<grid-name>

## Art Style

标黄的是新的，已经新增/更换好后可以把黄色高亮去掉

### Art Pro已经支持的style，新增Gemini/Seedream版本

* 风格封面图左上角无需显示🌸

* 选中风格无需自动切到art pro模型

  * soft pixel art

    > Illustrate in pixel art style with soft color palette.

  * digital painterly style

    > Illustrate in digital painterly style, with soft graphite lineart combined, muted pastel palette, semi-realistic digital art.&#x20;

  * gothic oil painting

    > Illustrate in gothic oil painting style with thick oil painterly texture, with slightly muted pastel colors and soft lighting, anime-inspired gothic oil painting.

  * Pop sketch style

    > Illustrate in rough anime sketch style, loose hand-drawn lineart, flat muted multi-shaded gray or blue colors, minimal shading, casual anime-style doodle.

  * pop anime style

    > Generate in modern pop hand-drawn 2D anime style, as if from a modern Japanese anime. Use flat coloring, and flat cel-shading. Do not include text or any watermark.

  * retro anime style

    > Generate in late 1980s / early 1990s hand-drawn 2D vintage anime style, as if from a vintage Japanese anime. Use flat coloring, flat cel-shading, bold outlines, slightly muted and slightly warm colors, and slightly grainy texture. Do not include text or any watermark.

  * semi-realistic portrait

    > Generate in a pretty Korean manhwa-inspired semi-realistic soft glossy digital illustration style, with lips also being glossy.

  * soft pastel style

    > Generate using the soft pastel art style, use soft pastel colors, gentle shading, slightly muted palette.&#x20;

  * watercolor illustration

    > Generate using the painterly watercolor style, where colors are layered with soft gradients, the art has visible brushstroke-like textures, softened delicate linework, shadows are painted in cool hues (bluish or purplish), while highlights are soft and luminous.

  * iredescent style

    > Generate using the shimmering art style, with prominent iridescent light reflections on places like hair, soft glow, glossy shading, delicate linework, luminous highlights, shimmering light reflections.

  * flat illustration

    > Generate in flat-color anime-style vector art with no linework, no gradient, only flat color blocks. Remove all outlines from input image if any.&#x20;

  * doodle style

    > Draw in minimalist chibi anime doodle style with thick lines, use extremely minimal simple doodle drawing and flat coloring.

  * chibi sticker style

    > Draw in flat chibi style, with chibi super deformed character in 2-head proportion, thick lines, flat coloring with only flat color blocks, and very minimalist simple drawing.

  * glossy chibi

    > Draw in glossy chibi anime style with thick lines and glossy coloring, use minimal simple drawing and very chibi proportions.

  * muscular manhwa style

    > Illustrate in the style of a Korean manhwa with male character being very handsome, with broad shoulders, sharp facial features, and expressive eyes. Use semi-realistic rendering with clean linework, polished shading, and manhwa aesthetic.

  * ~~manhwa style（暂无）~~

    > ~~Illustrate in the style of beautiful manhwa webtoon with semi-realistic drawing, soft shading, cinematic panel feel, and polished professional finish, use very classic manhwa style.~~

  * action manga

    > Illustrate in the style of shonen manga, with bold energetic linework, expressive dramatic poses and expressions, high contrast coloring, cinematic lighting.

  * grayscale manga

    > Illustrate in the style of black and white Japanese manga.

  * 3d model style

    > Render as 3D model asset in 3D game engine, with smooth 3D polygonal modeling, glossy textures, 3D game engine model rendering, soft studio lighting, and 3D engine glow, bloom, reflections effects.

  * minimalist

    > Illustrate in minimalist art style, with flat coloring, only flat color blocks, thick lines, and very minimal simple drawing.



### 仅限Gemini、Seedream、Gemini Pro等通用模型支持

* 需要在style的封面的左上角加上✨ 角标

* 一旦选中就会自动切换Seedream模型

* 如果选中art pro等动漫模型，则不显示这些style，只显示art pro支持的style

| Category | Name             | 例图                       | Prompt                                                                                                           |
| -------- | ---------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Art      | Ukiyo-e          | ![](images/image-11.png) | Illustrate in Ukiyo-e art style, with flat color scene, bold outlines, muted earth tones and intricate patterns. |
| Art      | Retro Comic Dots | ![](images/image-10.png) | Illustrate in retro comic art style with Ben-Day dots and exaggerated features.                                  |
| Art      | Cyberpunk        | ![](images/image-8.png)  | Illustrate in futuristic cyberpunk style with high-contrast lighting, glitch effects, and neon lights.           |



## Grid

* 只有通用模型支持的模板需要在grid的封面的左上角加上✨ 角标，一旦选中就会自动切换Seedream模型

* 只有Nano Banana Pro支持的模板需要在grid的封面的左上角加上🍌角标，一旦选中就会自动切换Nano Banana Pro模型

* 文案改成 🍌 Nano Banana Pro

![](images/image-6.png)

* 如果选中art pro等动漫模型，则不显示这些grid，只显示art pro支持的grid

| Category   | Name                      | 例图                                                               | Prompt                                                                                                                                                                                                   | 支持的模型                            |
| ---------- | ------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Storyboard | 2x2 Grid                  | ![](images/image-7.png)                                          | Generate a 2x2 grid shotboards, with exactly 2 rows, and exactly 2 columns. All 4 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.                          | 通用模型（Seedream、Gemini、Gemini Pro） |
| Storyboard | 3x3 Grid                  | ![](images/image-9.png)                                          | Generate a 3x3 grid shotboards, with exactly 3 rows, and exactly 3 columns. All 9 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.                          | 通用模型（Seedream、Gemini、Gemini Pro） |
| Storyboard | 4x4 Grid                  | ![](images/image-5.png)                                          | Generate a 4x4 grid shotboards, with exactly 4 rows, and exactly 4 columns. All 16 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.                         | Nano Banana Pro                  |
| Storyboard | 5x5 Grid                  | ![](images/image-2.png)                                          | Generate a 5x5 grid shotboards, with exactly 5 rows, and exactly 5 columns. All 25 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.                         | Nano Banana Pro                  |
| Storyboard | 6x6 Grid                  | ![](images/img_v3_02sr_96c8fe10-83fb-482c-9e8c-cec8db7ed1hu.jpg) | Generate a 6x6 grid shotboards, with exactly 6 rows, and exactly 6 columns. All 36 grids should have the exact same 9:16 shape. The storyboard should be rendered in 4k quality.                         | Nano Banana Pro                  |
| Comic      | Three-panel Strip         | ![](images/generated-image-25.jpg)                               | Design a mobile-optimized vertical scroll layout with 3 panels (3 rows and 1 column).                                                                                                                    | 通用模型（Seedream、Gemini、Gemini Pro） |
| Comic      | Four-panel Strip          | ![](images/image-1.png)                                          | Design a mobile-optimized vertical scroll layout with 4 panels (4 rows and 1 column).                                                                                                                    | 通用模型（Seedream、Gemini、Gemini Pro） |
| Comic      | Diagonal Panels           | ![](images/image-3.png)                                          | Arrange 3-4 panels diagonally across the page from top-left to bottom-right with varying sizes. Maintain panel tilts for dynamic energy, ensuring text placement remains readable in angled panels.      | 通用模型（Seedream、Gemini、Gemini Pro） |
| Comic      | Dominant Panel            | ![](images/image.png)                                            | Compose a page with one oversized central panel (60%+ area) surrounded by 2-3 smaller supporting panels. Use the central panel for key action/moment, with smaller panels showing reactions or context.  | 通用模型（Seedream、Gemini、Gemini Pro） |
| Comic      | Exploding Panel           | ![](<images/generated-image (5).jpg>)                            | Create a page with one 'exploding' panel - break its borders into 3-5 irregular shards overlapping adjacent panels. Use speed lines/impact effects while keeping 60% of the original panel area visible. | 通用模型（Seedream、Gemini、Gemini Pro） |
| Manga      | Right to Left             | ![](images/image-4.png)                                          | A Japanese manga panel, multiple right to left panels, read from right to left. Use screentone effects for shading and clean, bold line art.                                                             | 通用模型（Seedream、Gemini、Gemini Pro） |
| Manga      | Exaggerated Right to Left | ![](images/image-12.png)                                         | A Japanese manga panel in a right-to-left format. Two or more panels. Use bold outlines, exaggerated features.                                                                                           | 通用模型（Seedream、Gemini、Gemini Pro） |
