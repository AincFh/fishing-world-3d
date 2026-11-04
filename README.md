# FISHING WORLD 3D · 湖光物语

原创 Three.js 3D 钓鱼游戏，专为桌面与触控浏览器打造。无需安装、无需帐号、无服务器数据收集。

## 完整游玩流程
进入世界 → 选择湖区（解锁等级）→ 抛竿 → 观察鱼漂 → 有鱼咬钩时提竿 → 点按/按住收线并控制张力 → 捕获鱼获 → 领取金币和经验 → 购买鱼竿/鱼饵 → 解锁新湖区、收集十种鱼与完成循环任务。存档自动保存在本机浏览器。

### 游戏内容
- 四处独立垂钓水域、十种鱼（普通、稀有及传奇）、重量与个人纪录、鱼类图鉴。
- 七项可购买/装备的钓具、经济系统、成长等级和循环委托。
- 程序化原创 3D 湖泊、树木、码头、水波、天空、动态天气、抛竿动画、3D 鱼模型与收线对抗。
- 键盘与手机按钮、音效控制、帮助界面、结果反馈与安全存档恢复。
- Node.js 原生逻辑测试，GitHub Actions CI，GitHub Pages 自动发布。

## 本地运行
Node.js 20+：运行 \`npm test\`；运行 \`npm run start\` 并访问 http://localhost:5173。浏览器需有 WebGL2，首次启动需连接 jsDelivr CDN 获取 Three.js。GitHub Pages： https://aincfh.github.io/fishing-world-3d/

## 发布
Settings → Pages → Source：GitHub Actions。每次推送至 main 自动运行测试与发布。仅在部署成功并完成试玩后视为正式上线。

## 权限和素材
所有游戏物体均用程序化几何体生成，未使用第三方商业游戏素材。声音由 Web Audio API 在本地合成；只使用 Three.js 开源依赖。