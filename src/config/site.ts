// ============================================================
// 站点自定义配置
// 只改这个文件就能自定义整站外观，不需要动其他代码
// ============================================================

export const site = {
  // 主标题（浏览器标签页标题 / SEO）
  title: 'LightAria',

  // SEO 描述（meta description）
  description: '摄影作品集 · 人像 / 风光 / 纪实 / 视频 —— 光与影的对白',

  // 导航栏品牌名（左上角大字）
  brand: 'LightAria',

  // 用户信息（分享卡片封面底部信息压条：头像 + 昵称；avatar 留空则不显示头像）
  user: {
    name: 'LightAria',
    avatar: '', // 头像图 URL（如 /images/avatar.jpg），留空仅显示昵称
  },


  // 导航栏副标题（品牌下方小字，可留空）
  subtitle: '',  // 留空则不显示副标题

  // 背景图片：填图片地址（本地放 public/ 下用 '/xxx.jpg'，或外链 https://...）
  // 设为 null 则使用默认的彩色渐变光斑背景
  background: '/bg.jpg',
  // 是否显示背景图片（默认显示；用户可在底栏「设置」中切换）
  showBackground: true,

  // 色系：填一个主强调色（十六进制），全站的暖色元素会跟随它变化
  // 如：'#66ccff'（天蓝）/ '#ffb870'（暖橙）/ '#9f8cf0'（紫罗兰）/ '#7ad7a0'（薄荷）
  theme: {
    accent: '#66ccff',
  },

  // 页脚自定义（预留备案信息位置）
  footer: {
    // 页脚文案（留空则显示默认「Liquid Glass · 品牌 · 摄影作品集」）
    text: '',
    // ICP 备案号：备案完成后填写（如 '粤ICP备12345678号'），自动显示在页脚并链接到工信部
    icp: '', // 备案完成后填写，如 '粤ICP备12345678号'
  },

  // 信息流默认布局：'masonry'（网格，默认）/ 'list'（列表）/ 'compact'（简洁）
  // 电脑端与手机端可分开设置；用户可在底栏「设置」中切换，切换结果保存在浏览器本地（下次访问保持）
  layoutDesktop: 'masonry',
  layoutMobile: 'masonry',

  // 默认样式：'glass'（液态玻璃，默认）/ 'flat'（扁平化，参考 Firefly 风格）
  // 用户可在底栏「设置」中切换，切换结果保存在浏览器本地（下次访问保持）
  style: 'glass',

  // 液态玻璃模糊度（像素，0-30）：设置面板可调节，调节结果保存在浏览器本地
  glassBlur: 14,

  // 背景图压暗强度（0-1，默认 0.55）：设置面板「背景亮度」可调节，调节结果保存在浏览器本地
  // 0 = 不压暗（最亮），1 = 全黑；亮度滑杆方向相反（100% = 不压暗）
  bgDim: 0.55,

  // 文章正文字号（像素，14-22）：设置面板可调节，调节结果保存在浏览器本地
  mdFontSize: 17,

  // 主页文章展示：'paged'（分页展示）/ 'infinite'（无限流，滚动加载全部）
  // 分页模式下每页显示数量；用户可在设置面板切换，切换结果保存在浏览器本地
  feed: {
    mode: 'paged',   // 'paged' | 'infinite'
    pageSize: 20,    // 分页模式每页数量
  },

  // 主页文章展示：'paged'（分页展示）/ 'infinite'（无限流，滚动加载全部）
  // 分页模式下每页显示数量；用户可在设置面板切换，切换结果保存在浏览器本地
  feed: {
    mode: 'paged',   // 'paged' | 'infinite'
    pageSize: 20,    // 分页模式每页数量
  },

  // 自动分类（默认启用）：category 字段为空时，从标题【】方括号提取字段作为分类；
  // 标题也没有方括号时归入「未分类」。设为 false 则 category 为空一律归入「未分类」
  autoCategoryFromTitle: true,

  // 评论系统（预留接口，默认关闭；后期接入时置 enabled: true 并填 serverURL 即可）
  // 支持 Twikoo / Waline / Artalk 三种服务，文章页底部自动渲染评论容器
  comments: {
    enabled: false,
    service: 'twikoo', // twikoo | waline | artalk
    serverURL: 'http://lty.0712v.top/', // Twikoo 的 envId / Waline 与 Artalk 的服务端地址
    cdn: 'https://cdn.staticfile.org/twikoo/1.6.39/twikoo.all.min.js', // 评论前端库 CDN
    lang: 'zh-CN',
  },

  // 快速分享（分享卡片底部「分享」按钮）：默认开启
  // 微信内优先 Web Share API 拉起系统分享面板；失败提示右上角菜单；其他浏览器拉起系统分享/复制链接
  share: {
    enabled: true,
    // 微信 JSSDK 升级配置（预留，需服务号 appId + 后端签名接口，默认关闭）
    // 开通后微信内点击「微信分享」自动配置定制分享内容（标题/链接/缩略图），右上角 ⋯ 分享时生效
    wechatJSSDK: {
      enabled: false,
      appId: '',
      signAPI: '', // 后端签名接口，返回 { appId, timestamp, nonceStr, signature }
      cdn: 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js',
    },
  },

  // 个人主页（简历）页配置：/about/
  // 左侧大头像 + 右侧基本信息；底部「关于我」介绍文案由 src/content/about/about.md 编写
  profile: {
    name: '你的名字', // 显示名（大头像下主标题）
    title: '用镜头记录光与影的对白', // 一句话简介（基本信息上方）
    avatar: '', // 大头像图 URL（如 /images/profile.jpg），留空显示首字占位
    basics: [
      // 基本信息（键值对，展示在大头像右侧矩形）
      { label: '坐标', value: '你的城市' },
      { label: '邮箱', value: 'you@example.com' },
      { label: '微信', value: 'your_wechat' },
      { label: '擅长', value: '人像 / 风光 / 活动' },
    ],
  },

  // 页面开关（默认全开）：关闭后顶部导航对应按钮消失
  pages: {
    home: true, // 主页（信息流）
    categories: true, // 分类页
    archive: true, // 归档页
    moments: true, // 动态页
    friends: true, // 友情链接页
    about: true, // 个人主页（简历）页
  },

  // 友情链接（名称/链接/描述/头像）
  friends: [
    { name: 'Astro 文档', url: 'https://docs.astro.build', desc: '本站使用的框架', avatar: 'https://picsum.photos/seed/astro/100/100' },
    { name: 'GitHub', url: 'https://github.com', desc: '代码托管与开源社区', avatar: 'https://picsum.photos/seed/github/100/100' },
    { name: 'Unsplash', url: 'https://unsplash.com', desc: '免费高质量图片', avatar: 'https://picsum.photos/seed/unsplash/100/100' },
  ],
};

export type SiteConfig = typeof site;
