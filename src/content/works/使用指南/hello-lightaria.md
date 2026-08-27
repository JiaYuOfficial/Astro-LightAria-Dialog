---
title: "如何发布你的第一篇文章【使用指南】"
tag: 指南
category: "使用指南"
date: 2026-01-01
type: photo
ratio: "3/4"
desc: "LightAria 使用指南：文章格式、图片与图集、部署"

tags: [使用指南, 入门]
images:
  - "/images/samples/h2.jpg"
  - "/images/samples/h3.jpg"
  - "/images/samples/h4.jpg"
---

> 这是 LightAria 的**预设示例文章**，用来演示文章格式。看完这篇，你就会发自己的作品了。

## 一、文章放哪里

在 `src/content/works/` 下新建一个文件夹（文件夹名即分类），放一个 `.md` 文件即可：

```
src/content/works/
└── 我的作品/
    └── my-first-post.md
```

## 二、文章头部格式（frontmatter）

每篇文章开头用 `---` 包起来的字段叫 frontmatter，支持以下字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 标题；含 `【分类】` 会自动识别为分类（可用 `category` 覆盖） |
| `tag` | ✅ | 主标签（封面文字兜底等场景） |
| `category` | 选填 | 显式指定分类，优先级高于标题【】 |
| `date` | ✅ | 日期，如 `2026-01-01` |
| `type` | ✅ | `photo`（图文）/ `video`（视频） |
| `cover` | 选填 | 封面图地址；不填则用标题生成封面 |
| `ratio` | 选填 | 封面宽高比，如 `3/4`、`16/9`；默认 `8/5` |
| `video` | 选填 | 视频直链（`type: video` 时使用） |
| `duration` | 选填 | 视频时长，如 `05:30` |
| `desc` | 选填 | 卡片描述 |
| `tags` | 选填 | 附加标签数组，归档页可按标签筛选 |
| `images` | 选填 | **图集模式**：图片地址数组，2 张及以上自动渲染小红书式左右滑动轮播 |
| `likes` | 选填 | 喜欢数 |

## 三、图集模式（左右滑动）

像这篇示例一样，用 `images` 字段放多张图片，文章顶部就是左右滑动轮播：

```yaml
images:
  - "/images/samples/h2.jpg"
  - "/images/samples/h3.jpg"
  - "/images/samples/h4.jpg"
```

- 第一张图决定轮播容器比例
- 支持触摸滑动、左右箭头、底部圆点
- 首页卡片封面自动取第一张图

## 四、视频模式

```yaml
type: video
video: "https://example.com/video.mp4"
cover: "/images/samples/h3.jpg"
duration: "03:45"
```

文章顶部渲染视频播放器，卡片显示播放按钮 + 时长。

## 五、图片放哪里

本地图片放 `public/` 目录，引用时用绝对路径：

```
public/images/xxx.jpg  →  引用 /images/xxx.jpg
```

## 六、构建与预览

```bash
npm install      # 安装依赖
npm run dev      # 本地开发预览 http://localhost:4321
npm run build    # 构建静态站点（输出到 dist/）
```

## 七、部署

`npm run build` 后把 `dist/` 目录部署到任意静态托管平台即可（Cloudflare Pages / Netlify / Vercel / 自有服务器等）。

## 八、自定义整站

所有站点配置都在 `src/config/site.ts`：品牌名、副标题、背景图、主题色、页脚备案号、个人信息、页面开关等，改这一个文件即可。

欢迎使用 LightAria，祝你拍出光与影的对白 📷
