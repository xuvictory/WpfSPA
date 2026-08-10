---
name: complete-wpf-quickstart-articles
overview: 为"1.WPF快速入门"菜单下19篇占位模板文章补充完整内容，涵盖4个子分组：认识WPF（4篇）、第一个WPF应用（5篇）、应用程序生命周期（6篇）、窗口Window详解（4篇），每篇文章遵循"十段式深度教学法"格式。
todos:
  - id: complete-section-1-1
    content: 补充 1.1 认识 WPF 分组的 4 篇文章：WPF 的特点、应用场景、优势和劣势、工作原理
    status: completed
  - id: complete-section-1-2
    content: 补充 1.2 第一个 WPF 应用分组的 5 篇文章：通过 XAML 添加控件、通过 C# 后台代码操控控件、理解 InitializeComponent 方法、控件命名与后台引用、事件处理入门
    status: completed
  - id: complete-section-1-3
    content: 补充 1.3 应用程序生命周期分组的 6 篇文章：App.xaml 的 StartupUri、Application 类详解、应用程序事件、Application.Current 全局访问、ShutdownMode 属性、单实例应用实现
    status: completed
  - id: complete-section-1-4
    content: 补充 1.4 窗口 Window 详解分组的 4 篇文章：Window 常用属性、Window 常用方法、Window 常用事件、窗口传值与数据交互
    status: completed
  - id: verify-all-articles
    content: 验证全部 21 篇文章格式完整性和内容质量，确保无"📝 待补充"残留、所有 Callout 卡片均有针对性内容
    status: completed
    dependencies:
      - complete-section-1-1
      - complete-section-1-2
      - complete-section-1-3
      - complete-section-1-4
---

## 用户需求

检查"1.WPF快速入门"菜单下所有文章的内容完整性，对不完整的文章进行补充。

## 检查结果

目录 `public/content/01-quickstart/` 下共 21 篇文章，其中 **2 篇内容完整**（`wpf-是什么.md`、`创建-hello-world-项目.md`），**19 篇为占位模板**——各 Callout 卡片内容为通用空泛文字，"完整示例"标注"📝 待补充实际示例代码"。

## 需要补充的 19 篇文章（按 4 个分组）

### 1.1 认识 WPF（4 篇）

- WPF 的特点、WPF 的应用场景、WPF 的优势和劣势、WPF 的工作原理

### 1.2 第一个 WPF 应用（5 篇）

- 通过 XAML 添加控件、通过 C# 后台代码操控控件、理解 InitializeComponent 方法、控件命名（x:Name）与后台引用、事件处理入门（Click 事件）

### 1.3 应用程序生命周期（6 篇）

- App.xaml 的 StartupUri、Application 类详解、应用程序事件（Startup、Exit 等）、Application.Current 全局访问、ShutdownMode 属性、单实例应用实现

### 1.4 窗口 Window 详解（4 篇）

- Window 常用属性、Window 常用方法（Show、ShowDialog 等）、Window 常用事件（Loaded、Closing 等）、窗口传值与数据交互

## 内容规范

遵循项目既定的"十段式深度教学法"（10 种 Callout 卡片），每篇文章必须为每个知识点撰写针对性的实际内容（非通用模板），包含可运行的 XAML + C# 完整示例代码。面向工控上位机场景，使用 .NET 8/9 风格代码，主题色 #FF6B35。

## 实现方案

### 策略

以 2 篇已完成文章（`wpf-是什么.md`、`创建-hello-world-项目.md`）为格式范本，对 19 篇占位模板文章逐篇重写，将通用占位文字替换为对应知识点的针对性内容。

### 文章格式（十段式 Callout 卡片）

每篇文章固定使用以下 10 个 `> [!type]` Callout 块，顺序不可变：

| 序号 | Callout 类型 | 内容要求 |
| --- | --- | --- |
| 1 | `[!plain]` 白话理解 | 用通俗比喻解释概念，贴合工控/上位机场景 |
| 2 | `[!def]` 官方定义 | 准确的技术定义，包含关键术语 |
| 3 | `[!origin]` 由来背景 | 技术产生的原因、解决的问题、历史演进 |
| 4 | `[!essentials]` 核心要点 | 3-5 条关键知识点，用 `-` 列表呈现 |
| 5 | `[!example]` 完整示例 | 可运行的 XAML + C# 完整代码，带注释说明 |
| 6 | `[!scene]` 适用场景 | ✅ 适用 / ❌ 不适用，各 3-4 条 |
| 7 | `[!pitfall]` 常见踩坑 | 3 个具体错误及解决方案 |
| 8 | `[!best]` 最佳实践 | 3-5 条编码建议 |
| 9 | `[!practice]` 上手练习 | Lv.1 照猫画虎 / Lv.2 小试牛刀 / Lv.3 融会贯通 |
| 10 | `[!related]` 相关知识链接 | ← 前置 / → 后续 / ⇄ 关联 / 📖 官方文档 |


### 代码编写原则

- XAML + C# 示例必须为可运行代码，不可使用"📝 待补充"
- 命名空间使用 .NET 8/9 的文件范围命名空间（`namespace MyApp;`）
- Button/强调色使用 `#FF6B35`（橙色工控风）
- 代码风格对齐上位机场景（变量命名如 `btnStartCollect`、`txtTemperature`）
- 避免 WinForms 思维，强调数据绑定和 MVVM 预备概念

### 执行方式

按 4 个分组分批处理，每个分组内按菜单顺序依次完成。每篇文章独立重写，不依赖其他未完成文章。