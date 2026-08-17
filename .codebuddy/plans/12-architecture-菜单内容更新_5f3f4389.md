---
name: 12-architecture-菜单内容更新
overview: 将 public/content/12-architecture/ 下 29 篇文章的 [!example] 完整示例占位符全部替换为真实可运行、贴合上位机/工控场景的 WPF 示例（XAML + C# 两段代码块），并完成校验与提交。
todos:
  - id: design-patterns
    content: 编写设计模式8篇（策略/单例/工厂/观察者/模板方法/适配器/外观/状态）完整示例
    status: completed
  - id: architecture-principles
    content: 编写架构基础、SOLID、全局异常捕获5篇示例代码
    status: completed
  - id: plugin
    content: 编写插件化架构3篇（插件化架构/场景/MEF与Prism）示例
    status: completed
  - id: logging
    content: 编写日志4篇示例代码（含NLog/Serilog用法演示）
    status: completed
  - id: config-deploy
    content: 编写配置3篇与部署更新3篇示例代码
    status: completed
  - id: testing
    content: 编写测试3篇（xUnit/FlaUI/工控测试要点）示例代码
    status: completed
  - id: verify-commit
    content: 校验占位符清零、diff仅动12-architecture并提交git
    status: completed
    dependencies:
      - design-patterns
      - architecture-principles
      - plugin
      - logging
      - config-deploy
      - testing
---

## 用户需求

完成菜单"12.系统架构与设计模式"代办事项：将 `public/content/12-architecture/` 下全部 29 篇文章中 `[!example]` 完整示例卡片的占位符（"// 📝 待补充实际示例代码"）替换为真实可运行、贴合上位机/工控场景的 WPF 示例代码，其余 Callout 卡片及 meta.json/src/styles/index.html 一律不动。

## 产品概述

本任务为 WPF 上位机开发学习平台（Vite+原生JS+marked 纯前端 SPA）的章节内容更新，仅修改 12-architecture 目录下 29 个 markdown 文件的示例代码块，使学习者可复制运行验证本节知识点。

## 核心功能

- 每篇文章提供一个完整 WPF 示例（MainWindow.xaml + MainWindow.xaml.cs 两段代码块），概念性文章也给出最小演示
- 示例贴合上位机/工控场景（设备启停、参数监控、日志、配置、插件、异常处理等），体现本节知识点
- 严格遵守模板规范：命名空间 HmiDemo、类 MainWindow、窗口 #0D1117、面板 #161B22、按钮 #21262D、强调蓝 #58A6FF、文本 #8B949E、成功 #238636、危险 #DA3633、中文注释、XAML 事件/x:Name 与 C# 严格对应
- 校验：占位符计数清零、仅动目标章节、无 git diff 前缀残留，提交信息"12.系统架构与设计模式菜单内容更新"

## 技术栈

- 无框架与代码逻辑改动，纯 Markdown 内容编辑（Vite+原生JS+marked SPA 的课程内容文件）
- 示例代码为 WPF/.NET（C# + XAML），可编译运行

## 实施方案

逐篇读取 12-architecture 下 29 篇文章，根据标题与正文知识点设计贴合上位机场景的最小可运行 Demo，采用两段式结构（MainWindow.xaml 界面 + MainWindow.xaml.cs 后台逻辑），中文注释解释知识点。只替换 `[!example]` 卡片内的占位代码块，保留卡片格式（`> ` 引用前缀、代码围栏），不动其余 9 种 Callout、front-matter 及 meta.json。

## 关键设计决策

- 参照标准：04-controls/button-按钮.md（两段式标准写法）、06-graphics/wpf-图形渲染概述.md（概念性文章最小演示写法）
- 按主题分组批量处理，降低上下文切换：
- 设计模式 8 篇：策略、单例、工厂、观察者、模板方法、适配器、外观、状态（每篇用上位机场景演示对应模式，如单例=设备通信管理器、观察者=状态订阅推送、工厂=设备类型创建）
- 架构与原则 5 篇：架构设计重要性与类型、各层职责与交互、三层架构、SOLID、全局异常捕获与记录（用分层演示、异常捕获窗口等最小 Demo）
- 插件化 3 篇：什么是插件化架构、上位机插件化场景、MEF 与 Prism Modules（用接口+简单插件加载思路演示）
- 日志 4 篇：为什么要用日志、上位机日志场景、NLog 与 log4net、Serilog 结构化日志（演示日志记录与显示，第三方库仅以注释/伪代码示意或提及其用法）
- 配置 3 篇：传统 App.config、appsettings.json 推荐方案、配置加密与运行时修改（演示配置读取与界面联动）
- 部署更新 3 篇：ClickOnce、自动更新检测与下载、增量更新与版本管理（演示版本号检测与更新提示流程）
- 测试 3 篇：单元测试 xUnit/Moq、UI 自动化 FlaUI、工控软件测试要点（以 MainWindow 演示被测功能 + C# 展示测试用例写法）
- 每篇示例独立可编译，避免引入外部 NuGet 依赖（第三方框架类文章用内置替代方案 + 注释说明生产实践）
- 已知坑规避：Canvas.Left 在 StackPanel 不生效（改用 TranslateTransform 或 Grid/Canvas 布局）；替换时防止内容混入 git diff 的 `+` 前缀

## 校验流程

1. `search_content` 在 12-architecture 目录查"待补充实际示例代码"，确认计数为 0
2. `git diff --stat` 确认仅改动 12-architecture 目录下文件
3. 抽查替换后文件，确认 `[!example]` 卡片格式完整、XAML 与 C# 事件对应
4. git 提交，提交信息："12.系统架构与设计模式菜单内容更新"

## 目录结构（全部 [MODIFY]，共 29 个文件）

```
public/content/12-architecture/
├── 策略模式.md / 单例模式.md / 工厂模式.md / 观察者模式.md
├── 模板方法模式.md / 适配器模式.md / 外观模式.md / 状态模式.md
├── 架构设计重要性与类型.md / 各层职责与交互.md / 三层架构表示层业务层数据层.md
├── solid-设计原则.md / 全局异常捕获与记录.md
├── 什么是插件化架构.md / 上位机插件化场景.md / mef-与-prism-modules.md
├── 为什么要用日志.md / 上位机日志场景.md / nlog-与-log4net.md / serilog-结构化日志.md
├── 传统-appconfig-方式.md / appsettingsjson推荐方案.md / 配置加密与运行时修改.md
├── clickonce-部署与更新.md / 自动更新检测与下载.md / 增量更新与版本管理.md
└── 单元测试xunitmoq.md / ui-自动化测试flaui.md / 工控软件测试要点.md
```