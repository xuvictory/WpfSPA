---
name: code-quality-fixes
overview: 修复先前评估中发现的关键问题：删除冗余文件、修复XSS安全隐患、移除无效果代码、修复CSS冲突、优化一致性。
todos:
  - id: delete-mkd
    content: 删除冗余文件 mkd.js
    status: completed
  - id: fix-xss-alert-quiz
    content: 修复 quiz.js 的 XSS 风险和 alert 问题：导入 showToast，新增 sanitizeQuizContent 函数用 textContent 覆盖可能注入的 HTML，将 alert 替换为 showToast
    status: completed
  - id: remove-redundant-import
    content: 移除 main.js 中无效的动态 import 预热代码（第35-39行）
    status: completed
  - id: fix-scroll-css
    content: "从 theme.css 中移除 scroll-behavior: smooth 以解决与 instant 滚动冲突"
    status: completed
  - id: clean-vite-config-error
    content: 精简 vite.config.js 冗余配置，统一 progress.js 错误处理
    status: completed
---

## 用户需求

修复上一轮代码审查中发现的 7 个问题，提升项目安全性、代码整洁度和一致性。

## 修复内容

### 严重问题

- **删除冗余文件 `mkd.js`**：该文件是旧版 markdown.js 的副本，包含 Vite 预构建的硬编码路径（如 `/node_modules/.vite/deps/...`），无法在生产环境使用
- **修复 quiz.js XSS 风险**：`renderQuizCard` 中 `q.question` 和 `opt` 直接通过模板字符串拼接到 HTML，如果 quizzes.json 被恶意修改将造成 XSS 攻击
- **移除 main.js 无效动态 import**：第 35-39 行的 `Promise.all([import('./progress.js'), import('./quiz.js')])` 预热逻辑完全无效，因为这两个模块已在文件顶部静态 import

### 中等问题

- **解决 scroll-behavior CSS 冲突**：`theme.css` 中 `html { scroll-behavior: smooth }` 导致 `main.js` 中 `window.scrollTo({ behavior: 'instant' })` 失效，页面切换时出现不必要的平滑滚动
- **精简 vite.config.js**：`publicDir: 'public'` 和 `root: '.'` 均为 Vite 默认值，可移除

### 轻微问题

- **统一 progress.js 错误处理**：`saveQuizScore` 的 catch 块用空注释忽略错误，应添加 `console.error` 保持与 `getQuizScore` 一致
- **替换 quiz.js 中的 alert**：第 137 行使用 `alert('请先回答所有题目')` 阻塞 UI，替换为已有的 `showToast`

## 技术方案

### 修改策略

所有修改均为针对现有代码的**局部修正**，不涉及架构变更、不引入新依赖。遵循项目现有的编码风格（ES Module、JSDoc 注释、中英文混用注释）。

### 问题修复详述

#### 1. 删除 mkd.js

直接删除 `c:/code/WpfSPA/mkd.js`。不涉及 `git rm`，由用户自行决定是否提交。

#### 2. 修复 quiz.js XSS

- **方案**：不改变模板字符串生成 HTML 的方式，而是在 `bindQuizInteractions` 中通过 `textContent` 二次赋值来覆盖可能注入的 HTML。即：在 DOM 渲染完成后，遍历所有 `.quiz-question-text` 和 `.quiz-option span:last-child`，用原始数据覆盖 textContent。这样既保持代码结构不变，又杜绝 XSS。
- 具体做法：在 `injectQuizIfNeeded` 中调用 `renderQuizCard` 后、`bindQuizInteractions` 前，新增一个 `sanitizeQuizContent(quiz)` 函数，遍历渲染后的 DOM 节点并将文本内容替换为 `textContent` 赋值。

#### 3. 移除 main.js 无效动态 import

删除 `src/main.js` 第 35-39 行（包括注释"预加载 progress 和 quiz 模块"）。

#### 4. 解决 CSS scroll-behavior 冲突

从 `styles/theme.css` 中移除 `html { scroll-behavior: smooth; }`（第 70 行）。页面内锚点导航不受影响，因为侧边栏点击通过 hashchange 触发路由，路由切换中显式使用 `window.scrollTo({ behavior: 'instant' })`，符合预期。

#### 5. 精简 vite.config.js

- 删除 `root: '.'`（默认值）
- 删除 `publicDir: 'public'`（默认值）
- 保留 `build.outDir`、`build.emptyOutDir`、`server.port`、`server.open`（这些非默认值）

#### 6. 统一 progress.js 错误处理

将 `saveQuizScore` 的 `catch { /* ignore */ }` 改为 `catch (e) { console.error('保存测验成绩失败:', e); }`。

#### 7. 替换 quiz.js alert 为 Toast

- 在 `src/quiz.js` 顶部添加 `import { showToast } from './ui.js';`
- 将第 137 行的 `alert('请先回答所有题目')` 替换为 `showToast('请先回答所有题目', '⚠️', 2500);`

### 改动范围

| 文件 | 操作 | 改动量 |
| --- | --- | --- |
| `mkd.js` | 删除 | -366行 |
| `src/quiz.js` | 修改 | +15行，-2行 |
| `src/main.js` | 修改 | -5行 |
| `styles/theme.css` | 修改 | -1行 |
| `vite.config.js` | 修改 | -2行 |
| `src/progress.js` | 修改 | +1行，-1行 |