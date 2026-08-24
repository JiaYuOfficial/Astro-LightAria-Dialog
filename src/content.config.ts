import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    // 标题
    title: z.string(),
    // 分类：人像 / 婚礼 / 活动 / 商业
    tag: z.string(),
    // 分类（选填；新文章显式填写。留空时自动取第一个附加标签，再回退主分类 tag）
    category: z.string().optional(),
    // 发布日期
    date: z.coerce.date(),
    // 修改日期（选填，如 2026-07-02 或 "2026-07-02"；填写后页面显示「更新于」）
    updated: z
      .union([z.string(), z.date()])
      .optional()
      .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v)),
    // 类型：photo 照片 / video 视频
    type: z.enum(['photo', 'video']),
    // 封面图 URL（选填；不填则自动用标题生成小红书风文字封面）
    cover: z.string().optional(),
    // 封面比例，控制信息流卡片错落感
    ratio: z.string().default('3/4'),
    // 视频时长（type=video 时显示）
    duration: z.string().optional(),
    // 视频直链（type=video 时文章页渲染真实播放器）
    video: z.string().optional(),
    // 卡片上的简介（选填）
    desc: z.string().optional(),
    // 点赞数（信息流展示用）
    likes: z.number().default(0),
    // 附加标签（信息流卡片上展示的自定义标签，选填）
    tags: z.array(z.string()).default([]),
    // 图集模式（小红书式多图左右滑动）：图片直链列表，2 张及以上时文章页顶部渲染轮播
    // 同时作为封面兜底：首页卡片封面取 cover || images[0]
    images: z.array(z.string()).default([]),
  }),
});

const moments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/moments' }),
  schema: z.object({
    // 动态标题（选填；不填则只展示正文文字）
    title: z.string().optional(),
    // 发布时间（精确到分钟，如 2026-08-22 14:30；时间线按此倒序、按天分组）
    date: z.coerce.date(),
    // 图片直链列表（1-9 张；1 张显示大图、2-4 张两列、5-9 张三列九宫格）
    images: z.array(z.string()).default([]),
    // 视频直链（选填，mp4；与 images 同时存在时视频卡片排最后）
    video: z.string().optional(),
    // 点赞数（默认 0，动态底部展示）
    likes: z.number().default(0),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  // 个人主页（简历）介绍文案：frontmatter 可空，正文 markdown 即「关于我」内容
  schema: z.object({}),
});

export const collections = { works, moments, about };
