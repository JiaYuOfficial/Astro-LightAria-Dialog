---
---

你好，我是 **LightAria** 的使用者。这里是「个人主页」页的示例文案。

## 这个页面

左侧是大头像（1:1 方形，自动裁切），右侧是基本信息，底部「关于我」介绍由本文件编写（`src/content/about/about.md`）。

## 自定义

站点和用户身份统一在 `src/config/site.ts` 中配置，不需要为关于页再填写一份。四字段示例如下（合并到现有 `site` 对象，其余配置保留）：

```ts
export const site = {
  name: '光影手记',
  logo: '/avatar.svg',
  user: {
    name: '小光',
    avatar: '',
  },
  // 其余现有配置保留……
};
```

- `site.name`：必填站点名称，导航、页面标题等统一使用。
- `site.logo`：站点 Logo，也用于 favicon 和默认分享图；支持 SVG、PNG 等图片格式。
- `site.user.name`：关于页、文章、动态和分享卡片共用的名字；留空或仅有空白时回退为站点名称。
- `site.user.avatar`：共用头像；留空时先回退为 Logo，只有头像和 Logo 都为空时，才显示最终名字的首字占位。

`profile` 仅保存关于页的展示配置：

- `title`：一句话简介。
- `basics`：基本信息键值对（坐标 / 邮箱 / 微信 / 擅长）。
- `activity`：下方活跃日历与全站环图的默认显示开关 `enabled`、统计时区 `timeZone`。

旧配置中的顶层 `site.title` / `site.brand` 已合并为 `site.name`；`profile.name` / `profile.avatar` 已移到 `user.name` / `user.avatar`，旧字段不再读取。注意 `profile.title` 仍是简介，不需要删除。

友链页的本站名称、网址、Logo、描述也自动取自统一配置：网址来自 `astro.config.mjs` 的 `site`，其余来自 `site.name` / `site.logo` / `site.description`。原 `friendsInfo.siteInfo` 应删除，仅把其他额外信息移入 `friendsInfo.extraInfo`；不要重复填写内置四行。

## 开始使用

把这里的内容换成你的介绍，把 `site.ts` 里的信息改成你自己的，就完成了个人主页。
