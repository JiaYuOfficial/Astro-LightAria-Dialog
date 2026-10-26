---
title: "如何发布你的第一篇文章【使用指南】"
tag: 指南
category: "使用指南"
date: 2026-01-01
type: photo
desc: "LightAria 使用指南：文章格式、图片与图集、动态发布、部署"

tags: [使用指南, 入门]
images:
  - "/images/samples/h2.jpg"
  - "/images/samples/h3.jpg"
  - "/images/samples/h4.jpg"
---

> 这是 LightAria 的**预设示例文章**，用来演示文章与动态的发布格式。以下图文、图集、视频和动态示例都包含必填字段，可以复制后修改。

## 一、文章放哪里

在 `src/content/works/` 下新建 `.md` 文件，可以直接放在该目录，也可以用子文件夹整理：

```text
src/content/works/
└── 我的作品/
    └── my-first-post.md
```

**文件夹名不会自动成为分类。** 分类优先取非空 `category`；未填写时，如果开启了 `autoCategoryFromTitle`，就取标题第一个 `【分类】` 或 `[分类]`；再没有则归入「未分类」。`tag` 与 `tags` 都不参与自动分类。

## 二、最小可发布示例（图文）

每篇文章开头用 `---` 包起来的字段叫 frontmatter。`title`、`tag`、`date`、`type` 四项均为必填：

```markdown
---
title: "【随笔】我的第一篇文章"
tag: "随笔"
date: 2026-06-18
type: article
---

这里是正文，支持 Markdown 标题、图片、引用与代码块。
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 标题；标题括号可用于自动分类 |
| `tag` | 是 | 用于无图文章页的文字封面等场景；建议与分类保持一致，但不用于自动分类 |
| `category` | 否 | 显式指定分类，优先于标题括号 |
| `date` | 是 | 发布日期，如 `2026-06-18` |
| `updated` | 否 | 修改日期，如 `"2026-06-19"`；填写后显示「更新于」 |
| `type` | 是 | `article`（普通图文）/ `photo`（图集）/ `video`（视频） |
| `cover` | 否 | 首页卡片封面优先使用此图；其次取 `images[0]`，再无则使用文字封面 |
| `ratio` | 否 | 兼容保留字段，数据默认值为 `3/4`；当前图片封面按真实比例显示，不通过此字段裁切 |
| `video` | 否 | 视频文件直链，`type: video` 时用于顶部播放器 |
| `duration` | 否 | 手动填写的视频时长，如 `"03:24"`；不会自动检测 |
| `desc` | 否 | 作品摘要，用于 SEO 等场景 |
| `tags` | 否 | 附加标签数组，归档页可按标签筛选；默认 `[]` |
| `images` | 否 | 图片地址数组，默认 `[]`；`type: photo` 且非空时显示顶部图集，多张可左右切换 |
| `password` | 否 | 非空字符串启用正文与目录加密，详见下文 |
| `passwordHint` | 否 | 密码提示，显示在密码输入框下方 |

不需要的可选字段直接省略。`likes` 属于动态内容字段，不是作品文章字段。

## 三、完整图集示例（左右滑动）

必须同时设置 `type: photo` 和非空 `images`。以下图片已包含在仓库中，可直接预览：

```markdown
---
title: "【人像】夏日海边写真"
tag: "人像"
category: "人像"
date: 2026-06-18
updated: "2026-06-19"
type: photo
cover: "/images/samples/h2.jpg"
desc: "黄昏海边的人像作品，记录光与影的对白。"
tags: [人像, 胶片]
images:
  - "/images/samples/h2.jpg"
  - "/images/samples/h3.jpg"
---

## 拍摄手记

这里是正文，展示在图集下方。
```

- 首张 `images` 图片决定轮播区域比例，多张图片支持触摸滑动、左右箭头与底部圆点。
- 首页卡片封面优先取 `cover`，未填写时再取 `images[0]`；文章顶部图集只使用 `images`。
- `images` 只有 1 张时也会显示图集区域，2 张及以上才有多图切换的实际效果。
- 只填写 `images`、但类型为 `article` 或 `video`，不会显示顶部图集。

## 四、完整视频示例

`video` 必须换成实际可访问的视频文件直链；下方 `example.com` 地址仅为占位，不是可播放素材：

```markdown
---
title: "【Vlog】海边的一天"
tag: "Vlog"
category: "Vlog"
date: 2026-06-18
type: video
video: "https://example.com/video.mp4"
cover: "/images/samples/h3.jpg"
duration: "03:24"
desc: "用一段视频记录海边的一天。"
tags: [Vlog, 旅行]
---

这里填写视频介绍与创作手记。
```

文章顶部渲染视频播放器，首页卡片显示播放按钮与手动填写的时长。普通视频网页地址不能代替视频文件直链。

## 五、图片与正文

本地图片放在 `public/` 目录，引用时使用以 `/` 开头、且不包含 `public` 的站内路径：

```text
public/images/xxx.jpg  →  引用 /images/xxx.jpg
```

正文插图使用 Markdown 图片语法；例如以下图片也已包含在仓库中：

```markdown
![海边作品示例](/images/samples/h2.jpg)
```

图片封面按真实宽高比显示；没有可用封面图时，首页卡片使用 3:2 标题文字封面。

## 六、加密文章

需要加密时，在完整文章的 frontmatter（正文前的 `---` 内）添加下面两个字段。示例口令仅为占位，发布前请替换为足够长且不重复使用的口令；不需要加密时直接省略：

```yaml
password: "请替换为你自己的长口令"
passwordHint: "只有访问者知道的提示"
```

- `password`、`passwordHint` 都是字符串；纯数字密码必须加引号，否则 YAML 可能将其当成数字并丢掉前导 0。
- 省略 `password` 或填写 `password: ""` 均不会启用加密。
- **只加密正文与目录**；标题、摘要、封面、顶部图集和视频等仍公开，媒体文件本身不加密。
- 原始内容文件含明文正文与密码，真实加密文章不得提交到公开仓库；同时保护构建缓存与内容源文件，不要将它们当成静态站点产物发布。
- 密文可被下载后离线猜口令；客户端输错冷却只是交互限制，不是服务端鉴权。

## 七、发布动态

在 `src/content/moments/` 下新建 `.md` 文件，每个文件是一条动态，统一显示在 `/moments/` 页面。动态不使用文章的 `tag`、`category`、`type` 或 `password` 字段，**仅 `date` 必填**；正文写在 frontmatter 之后，支持 Markdown。

### 纯文字动态（最小示例）

```markdown
---
date: "2026-06-18T09:30:00+08:00"
---

今天整理好了一组新作品，记下这个小小的进展。
```

### 单图动态

单图也必须写成复数 `images` 数组，不能使用 `image`：

```markdown
---
title: "今天的一束光"
date: "2026-06-18T10:00:00+08:00"
images:
  - "/images/samples/h3.jpg"
---

用一张照片记录窗边的光影。
```

### 九宫格动态

```markdown
---
title: "九张照片，一段旅程"
date: "2026-06-18T11:00:00+08:00"
images:
  - "/images/samples/v1.jpg"
  - "/images/samples/v2.jpg"
  - "/images/samples/v3.jpg"
  - "/images/samples/v4.jpg"
  - "/images/samples/v5.jpg"
  - "/images/samples/v6.jpg"
  - "/images/samples/v7.jpg"
  - "/images/samples/v8.jpg"
  - "/images/samples/h8.jpg"
---

把旅途中喜欢的画面放在一起。点击图片可以放大查看。
```

### 视频动态

视频地址仅为占位，须替换为实际可访问的视频文件直链：

```markdown
---
title: "海边的一小段记录"
date: "2026-06-18T12:00:00+08:00"
video: "https://example.com/video.mp4"
---

这里填写视频介绍，也可以只写一两句心情。
```

### 动态字段与展示规则

| 字段 | 必填 | 说明 |
|---|---|---|
| `date` | 是 | 发布时间，按时间倒序、按天分组；建议使用带时区偏移的日期字符串 |
| `title` | 否 | 动态标题；省略则不显示标题 |
| `images` | 否 | 图片地址数组，默认 `[]`；建议每条最多 9 张 |
| `video` | 否 | 视频文件直链；省略则不显示播放器 |
| `likes` | 否 | 数字，默认 `0`；当前只保留在内容数据中，页面尚未展示，也不提供点赞交互 |

- **图片排布**：1 张显示大图，2–4 张为两列，5 张及以上为三列；九宫格缩略图裁成正方形，点击后可查看原图。
- **图片与视频混排**：同一条动态可同时填写 `images` 和 `video`；图片网格显示在前，视频显示在后，无需填写 `type`。
- **时间与时区**：示例中的 `+08:00` 表示 UTC+8；当前页面在构建时按构建环境的本地时区格式化时间。如需稳定显示北京时间，请将构建环境时区设为 `Asia/Shanghai`，例如 `TZ=Asia/Shanghai npm run build`。页面中的「今天／昨天」也是构建时生成，不会随访问日期自动刷新。
- **公开范围**：动态没有文章加密功能；添加 `password` 不会保护动态。不要在动态中填写私密内容或密码。
- **路径与验证**：示例图片均已包含在仓库中。自己的图片放在 `public/` 下，以 `/images/...` 引用；发布前运行 `npm run build`，再用 `npm run preview` 检查 `/moments/`。

## 八、构建与预览

```bash
npm install      # 首次使用时安装依赖
npm run dev      # 本地开发预览 http://localhost:4321
npm run build    # 检查内容格式并构建静态站点（输出到 dist/）
npm run preview  # 本地预览构建产物，地址以终端输出为准
```

缺少必填字段或字段类型错误会导致构建失败。发布前请确认构建成功，再检查文章、图集、视频及加密效果。

## 九、部署与自定义

构建后将 `dist/` 部署到静态托管平台（Cloudflare Pages / Netlify / Vercel / 自有服务器等），不要直接公开整个源码目录。

正式部署前还需要：

1. 将 `astro.config.mjs` 的 `site` 从演示地址改成正式域名；canonical、分享链接和友链本站网址均使用此地址。
2. 在 `src/config/site.ts` 填写下述统一身份字段；如需搜索引擎收录，将 `noindex` 改为 `false`。
3. 如需允许抓取，移除或调整 `public/robots.txt` 中的 `Disallow: /`；仅关闭 `noindex` 不会解除此限制。
4. 配置修改后重新构建，再部署新的 `dist/` 产物。

### 统一站点与用户身份

以下四字段示例合并到现有 `site` 对象中，其他配置保持不变：

```ts
export const site = {
  name: '光影手记',             // 必填站点名称
  logo: '/avatar.svg',          // 站点 Logo，也用于 favicon 与默认分享图
  user: {
    name: '小光',              // 留空时回退为站点名称
    avatar: '',                 // 留空时回退为站点 Logo
  },
  // 其余现有配置保留……
};
```

站点名称用于导航、页面标题、SEO、默认页脚和友链本站信息；`user` 的名字与头像用于文章、动态、关于页和分享卡片，不需要为各页重复填写。字段会去除首尾空白，站点名称不能全为空白。**头像为空时先使用 Logo，只有头像和 Logo 都为空时，才用最终显示名字的首字占位。**

Logo / favicon 不限定 SVG，PNG、JPG 等浏览器支持的格式也可使用；不再写死 SVG MIME。自己的本地图片放入 `public/`，配置中使用不含 `public` 的路径，例如放入 PNG 后将 `logo` 改为 `/images/my-logo.png`，也可填写图片外链。

关于页 `profile` 仅保留一句话简介 `title`、基本信息列表 `basics` 和活跃统计配置 `activity`，名字与头像统一读取 `user`；介绍正文在 `src/content/about/about.md` 编写。

### 从旧字段迁移

- 将旧顶层 `site.title`、`site.brand` 合并为一个 `site.name`；两者原值不同时选择一个统一名称，旧字段已不再读取。
- 将 `site.profile.name`、`site.profile.avatar` 移到 `site.user.name`、`site.user.avatar`，不要再保留两套身份配置。
- `profile.title` 仍表示关于页简介，不是已删除的顶层 `site.title`；文章和动态 frontmatter 的 `title` 也保持原样。
- 删除 `friendsInfo.siteInfo`：内置「名称／网址／Logo／描述」现在自动生成，只将其他额外行迁入 `friendsInfo.extraInfo`。

### 友链本站信息

四个内置行分别取自 `site.name`、`astro.config.mjs` 的 `site`（页面中的 `Astro.site`）、`site.logo` 和 `site.description`。Logo 的相对路径会转为绝对地址，无需再手填一次；正式域名仍在 Astro 配置中修改。

需要增加其他信息时，在内置四行之后追加：

```ts
friendsInfo: {
  enabled: true,
  extraInfo: [
    { label: '联系', value: 'hello@example.com' },
  ],
  apply: '请在这里输入申请友链事项',
},
```

`extraInfo` 不会覆盖内置行，不要用它重复维护名称或网址。`apply` 仍是可自由编写的 Markdown 申请说明。

欢迎使用 LightAria，祝你拍出光与影的对白 📷
