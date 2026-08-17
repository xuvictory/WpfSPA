---
name: 13-performance 菜单内容更新
overview: 将 public/content/13-performance/ 下全部 23 篇文章中的 [!example] 完整示例占位符（"// 📝 待补充实际示例代码"）替换为贴合上位机/工控场景的真实可运行 WPF 示例（XAML + C# 两段代码块），遵循项目既定模板规范，并完成校验与提交。
todos:
  - id: batch-1-render-layout
    content: 替换渲染与布局类 8 篇（视觉树与渲染线程、硬件加速与渲染层级、减少视觉树复杂度、避免频繁布局计算、布局循环、大量控件同时可见、ui-虚拟化、冻结-freezable-对象）的 [!example] 占位符为标准 XAML+C# 示例
    status: completed
  - id: batch-2-memory-resource
    content: 替换内存与资源类 6 篇（wpf-内存常见问题与泄漏场景、资源释放与-idisposable、弱事件模式、内存分析工具、图片优化与位图缓存、过度使用-effect-特效）的 [!example] 占位符为标准 XAML+C# 示例
    status: completed
    dependencies:
      - batch-1-render-layout
  - id: batch-3-data-debug
    content: 替换数据更新与调试类 9 篇（频繁-ui-更新节流防抖、异步绑定与延迟、延迟加载与数据分页、数据绑定调试、xaml-调试与热重载、运行时调试技巧、visual-studio-诊断工具、snoop-与-wpf-inspector、wpf-performance-suite）的 [!example] 占位符为标准 XAML+C# 示例
    status: completed
    dependencies:
      - batch-2-memory-resource
  - id: verify-commit
    content: 校验：search_content 查"待补充实际示例代码"计数为 0、git diff --stat 确认仅动 13-performance、无 ^\+ 前缀残留，然后提交"13.性能优化与调试菜单内容更新"
    status: completed
    dependencies:
      - batch-1-render-layout
      - batch-2-memory-resource
      - batch-3-data-debug
---

## 用户需求

完成 WPF 上位机学习平台菜单"13.性能优化与调试"章节的代办事项：将 `public/content/13-performance/` 下全部 23 篇文章中 `[!example] 完整示例` 卡片内的占位符（"// 📝 待补充实际示例代码"）替换为真实可运行、贴合上位机/工控场景的 WPF 示例代码。

## 产品概述

本项目为纯前端 WPF 上位机开发学习平台（Vite + 原生 JS + marked），课程内容按章组织为 Markdown 文章。本次仅处理第 13 章 23 篇文章的示例代码填充，不改动其余 9 种 Callout 卡片、meta.json、src 与 index.html。

## 核心功能

- 替换 23 篇文章的 `[!example]` 占位符为完整示例：主题说明 + **MainWindow.xaml：** 与 **MainWindow.xaml.cs：** 两段代码块
- 示例需与各篇文章主题严格对应（渲染层级、UI 虚拟化、内存泄漏、节流防抖、调试工具等 23 个不同主题）
- 示例必须可运行、贴合上位机/工控场景（设备监控、数据采集、报警状态等）
- 遵循统一模板规范：命名空间 HmiDemo、类 MainWindow、深色配色（#0D1117 窗口 / #161B22 面板 / #21262D 按钮 / #58A6FF 强调蓝 / #8B949E 文本 / #238636 成功 / #DA3633 危险）、中文注释、XAML 事件与 x:Name 和 C# 严格对应
- 概念性/工具类文章（如内存分析工具、Snoop 调试）也需给出最小可运行演示

## 校验标准

- 全章节 search_content 查"待补充实际示例代码"计数为 0
- git diff --stat 确认仅动 13-performance 目录
- 无 `^\+` 前缀残留混入内容
- 提交信息："13.性能优化与调试菜单内容更新"

## 技术栈

- 无需引入新技术栈：纯 Markdown 内容替换任务，沿用项目既有约定（Vite SPA + marked 渲染，WPF/XAML/C# 示例代码以 fenced code block 嵌入）
- 参照标准模板：`public/content/04-controls/button-按钮.md` 与 `public/content/06-graphics/wpf-图形渲染概述.md` 的 `[!example]` 卡片结构

## 实现方案

### 总体策略

逐篇处理 23 个文件：用 `search_content` 定位占位符所在行，将该 `[!example]` 卡片整体重写为标准三段式结构（一句话主题演示说明 + MainWindow.xaml 代码块 + MainWindow.xaml.cs 代码块），只替换卡片内部内容，卡片前后的其余 Callout 与正文保持不动。

### 主题-示例映射（确保每篇示例贴合文章知识点与上位机场景）

- **渲染与布局类**：视觉树与渲染线程（渲染线程帧率监控）、硬件加速与渲染层级（分层缓存对比）、减少视觉树复杂度（简化控件层级）、避免频繁布局计算（批处理属性变更）、布局循环（检测并避免 Measure/Arrange 循环）、大量控件同时可见（复用控件 vs 动态创建对比）、ui-虚拟化（ListView 虚拟化演示）、冻结-freezable-对象（冻结 SolidColorBrush 性能对比）
- **内存与资源类**：wpf-内存常见问题与泄漏场景（事件泄漏演示与解除）、资源释放与-idisposable（实现 IDisposable 释放资源）、弱事件模式（WeakEventManager 订阅）、内存分析工具（演示可检测的泄漏模式）、图片优化与位图缓存（BitmapImage 缓存策略）、过度使用-effect-特效（DropShadowEffect 开关对比）
- **数据更新与调试类**：频繁-ui-更新节流防抖（DispatcherTimer 节流实时数据）、异步绑定与延迟（async/await + IsAsync 绑定）、延迟加载与数据分页（分页加载列表）、数据绑定调试（绑定错误输出与 FallbackValue）、xaml-调试与热重载（演示绑定状态可视化）、运行时调试技巧（Trace 输出运行时状态）、visual-studio-诊断工具（CPU/内存观测点演示）、snoop-与-wpf-inspector（可被 Inspect 的示例布局）、wpf-performance-suite（综合性能仪表盘）

### 关键技术决策

- 每篇示例控制在"最小可运行"规模：单窗口、核心 API 演示、无外部依赖，保证学习者可直接复制运行
- XAML 中的事件处理器、x:Name 标识符必须与 C# 代码一一对应，杜绝编译错误
- 使用 `System.Diagnostics.Stopwatch`、`DispatcherTimer`、`VisualTreeHelper` 等 WPF 原生 API 演示性能点，避免引入第三方库
- 所有计时/计数演示结果用 TextBlock 实时显示，贴合上位机监控界面形态

### 注意事项（防回归）

- **PowerShell 中文路径乱码**：操作时使用 `chcp 65001`，避免管道 cat 读取含中文文件名内容
- **防 + 前缀混入**：写入的每行内容不得以 `+` 开头，避免被误判为 diff 新增行
- **精确替换**：替换以占位符代码块起止行为界，不触碰 `[!example]` 前后行以外的任何内容
- 每批完成后立即对已改文件做计数抽查，早发现问题早修正

## 目录结构

仅修改 13-performance 目录下 23 个文件，其余目录零改动：

```
public/content/13-performance/
├── 视觉树与渲染线程.md           # [MODIFY] 替换 [!example] 占位符
├── 硬件加速与渲染层级.md          # [MODIFY] 替换 [!example] 占位符
├── 减少视觉树复杂度.md            # [MODIFY] 替换 [!example] 占位符
├── 避免频繁布局计算.md            # [MODIFY] 替换 [!example] 占位符
├── 布局循环.md                    # [MODIFY] 替换 [!example] 占位符
├── 大量控件同时可见.md            # [MODIFY] 替换 [!example] 占位符
├── ui-虚拟化.md                   # [MODIFY] 替换 [!example] 占位符
├── 冻结-freezable-对象.md         # [MODIFY] 替换 [!example] 占位符
├── wpf-内存常见问题与泄漏场景.md   # [MODIFY] 替换 [!example] 占位符
├── 资源释放与-idisposable.md      # [MODIFY] 替换 [!example] 占位符
├── 弱事件模式.md                  # [MODIFY] 替换 [!example] 占位符
├── 内存分析工具.md                # [MODIFY] 替换 [!example] 占位符
├── 图片优化与位图缓存.md          # [MODIFY] 替换 [!example] 占位符
├── 过度使用-effect-特效.md        # [MODIFY] 替换 [!example] 占位符
├── 频繁-ui-更新节流防抖.md        # [MODIFY] 替换 [!example] 占位符
├── 异步绑定与延迟.md              # [MODIFY] 替换 [!example] 占位符
├── 延迟加载与数据分页.md          # [MODIFY] 替换 [!example] 占位符
├── 数据绑定调试.md                # [MODIFY] 替换 [!example] 占位符
├── xaml-调试与热重载.md           # [MODIFY] 替换 [!example] 占位符
├── 运行时调试技巧.md              # [MODIFY] 替换 [!example] 占位符
├── visual-studio-诊断工具.md      # [MODIFY] 替换 [!example] 占位符
├── snoop-与-wpf-inspector.md      # [MODIFY] 替换 [!example] 占位符
└── wpf-performance-suite.md       # [MODIFY] 替换 [!example] 占位符（综合演示，可适当丰富）
```

## 架构设计

无新增系统架构：本任务为内容层替换，不改动 SPA 应用结构、路由、样式或任何运行时代码。修改面严格限定在课程 Markdown 内容目录。