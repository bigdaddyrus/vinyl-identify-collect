## **1. 系统架构与“造轮子”要求 (Architecture & Reusability)**

**目标:** 构建一个可无限复用的 React Native (推荐 Expo) 模板库。不要写死任何与“邮票”强相关的 UI 文本或逻辑。
**核心原则:** 所有垂直类目的差异化内容，必须通过统一的配置文件注入。

让 Claude 创建一个 `src/config/appConfig.ts` 作为唯一真相源 (Single Source of Truth)：

**TypeScript**

`{
  "appName": "StampSnap",
  "appSlug": "stampsnap",
  "theme": {
    "primaryColor": "#2C5F2D", // 邮票用复古绿，以后换黑胶可以改成 #1DB954
    "accentColor": "#D4AF37", // 金色强调色
    "fontFamily": "System",
    "priceFontFamily": "PlayfairDisplay_700Bold" // 金额数字必须用 Serif 衬线体以增加专业感
  },
  "aiPrompt": "You are an expert philatelist. Analyze this image...",
  "paywall": {
    "yearlyPrice": "$39.99",
    "weeklyPrice": "$6.99",
    "trialDays": 3
  },
  "loadingSteps": [
    "Analyzing perforations...",
    "Checking watermarks...",
    "Checking auction histories...",
    "Calculating estimated value..."
  ],
  "result": {
    "currencySymbol": "$",
    "labels": {
      "name": "Item Name",
      "origin": "Origin",
      "year": "Year",
      "estimatedValue": "Estimated Value",
      "confidence": "Confidence",
      "description": "Description"
    }
  },
  "portfolio": {
    "title": "My Collection",
    "totalValueLabel": "Total Portfolio Value",
    "emptyStateText": "No items in your collection yet"
  }
}`

## **2. 核心工作流 (User Flow - The "Copycat" Strategy)**

要求 Claude 严格按照以下路由 (Routing) 顺序实现前端页面：

- **Step 1: Onboarding Carousel (引导页)**
    - Screen 1 (Hook): 发现旧物？ (展示一张模糊的旧物照片)。
    - Screen 2 (Magic): 扫描揭晓市场价值 (动效：展示激光扫描 UI 和跳动的预估价格)。
    - Screen 3 (Habit): 建立你的数字资产库。
- **Step 2: Hard Paywall (强硬付费墙)**
    - Onboarding 结束后**强制弹出**。
    - UI 要求：巨大的 "Start 3-Day Free Trial" 按钮（绑定 RevenueCat 订阅逻辑）。
    - 右上角留一个极其微小、低对比度的 "x" 或 "Skip" 按钮（允许零氪用户试用核心流程）。
- **Step 3: Scanner Home (主页/相机页)**
    - 调用相机权限，屏幕中央要有取景框 (Crop overlay)。
    - 支持从相册 (Gallery) 导入。
    - 包含一个明显的 "Analyze" 动作按钮。
- **Step 4: "Illusion of Labor" Loading Screen (拟真劳作加载页)**
    - **关键要求:** 即便后端 API 1 秒就返回了结果，前端必须强制 `setTimeout` 停留 4-5 秒（4个步骤）。
    - UI 配合循环打勾的骨架屏，依次高亮显示 `appConfig.ts` 中的 `loadingSteps` 文本（共4个步骤）。
- **Step 5: Analysis Result (结果呈现页)**
    - 解析后端传回的 JSON 并渲染展示卡片。
    - **必须包含:** 物品名称、国家/年份、**预估市场价值 (高亮，Playfair Display Serif 字体)**、**置信度 (Confidence %)**、AI 生成的详细描述（真伪鉴定、历史背景）。
    - 底部动作按钮：`[Add to Collection]` 和 `[Export PDF]`。
- **Step 6: Portfolio / Collection (资产夹)**
    - 不要设计成普通的“相册”，要设计成“金融理财看板”。
    - 顶部有一个核心指标：**Total Portfolio Value (总估值)**。
    - 下方是卡片瀑布流 (List/Grid view)。

## **3. UI/UX 细节与转化率优化 (UI/UX & ASO Integrations)**

要求 Claude 在开发组件时，必须集成以下底层优化：

- **Haptic Feedback (触觉反馈):**
    - 在加载完成显示价格的一瞬间，调用重度震动反馈 (`impactAsync('heavy')`)。
    - 将物品加入 Collection 时，调用成功震动反馈 (`notificationAsync('success')`)。
- **ASO Review Trigger (App Store 评分触发器):**
    - **绝对不要**在用户刚打开 App 时索要好评。
    - **逻辑要求:** 写一个全局 Store/Context，当用户第一次成功扫描出一个 `Estimated Value > $10` 的物品并点击 `[Add to Collection]` 后，立刻弹出 `StoreReview.requestReview()`。在多巴胺最高峰截获 5 星好评。
- **PDF 导出引擎 (Premium Feature):**
    - 集成 `expo-print` 库。
    - 将 个人 Collections 页面生成一份排版精美的 A4 尺寸 PDF 报告/或者图片，供用户保存或分享。这也是促使用户付费的高级功能之一。