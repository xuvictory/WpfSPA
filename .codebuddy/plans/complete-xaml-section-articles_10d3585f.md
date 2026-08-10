---
name: complete-xaml-section-articles
overview: 补充02-xaml目录下9篇内容缺失的文章，按照"十段式深度教学法"格式，参考已完成的"什么是XAML"文章的写作风格，逐篇填充完整的专业内容。
todos:
  - id: write-xaml-features
    content: 补充 xaml-的特点.md：覆盖声明式UI、UI逻辑分离、强类型编译检查、分辨率无关、硬件加速等特点
    status: completed
  - id: write-xaml-csharp-relation
    content: 补充 xaml-与-c-代码的关系.md：说明XAML与C#的职责划分、partial class机制、选择策略
    status: completed
  - id: write-xaml-syntax
    content: 补充 xaml-语法规则.md：详解六种XAML语法（元素语法、属性语法、属性元素语法、内容语法、集合语法、事件特性语法）
    status: completed
    dependencies:
      - write-xaml-features
  - id: write-default-namespace
    content: 补充 默认命名空间.md：详解WPF核心命名空间映射、URI含义、程序集映射原理
    status: completed
  - id: write-x-namespace
    content: 补充 x-命名空间.md：逐一详解x:Key、x:Name、x:Class、x:Static、x:Type、x:Null、x:Array
    status: completed
  - id: write-custom-namespace
    content: 补充 自定义命名空间引入.md：clr-namespace语法、系统命名空间、外部程序集引用
    status: completed
    dependencies:
      - write-x-namespace
  - id: write-class-hierarchy
    content: 补充 wpf-核心类层次结构.md：完整继承链图、四大控件分支、FrameworkElement核心能力
    status: completed
    dependencies:
      - write-xaml-syntax
  - id: write-appxaml
    content: 补充 appxaml-详解.md：StartupUri、全局资源定义、MergedDictionaries合并资源字典
    status: completed
    dependencies:
      - write-default-namespace
      - write-custom-namespace
  - id: write-mainwindow-xaml
    content: 补充 mainwindowxaml-详解.md：Window根元素、xmlns声明、x:Class关联、控件完整写法示例
    status: completed
    dependencies:
      - write-appxaml
---

## 用户需求

检查"2. XAML 详解"菜单下所有文章内容是否完整，对不完整的文章进行补充。

## 检查结果

10篇文章中，仅`什么是-xaml.md`内容完整，其余9篇全部使用通用模板占位——白话理解为泛用话术、定义模糊、示例代码为`// 待补充实际示例代码`、踩坑/实践均为通用模板内容。

## 需补充的9篇文章

按子章节分为4组：

### 2.1 XAML 基础（3篇）

- **xaml-的特点.md**：声明式UI、UI与逻辑分离、强类型编译检查、命名空间扩展、分辨率无关、硬件加速
- **xaml-与-c-代码的关系.md**：XAML能做 vs C#能做的事、何种场景选择XAML何种场景用后台代码、partial class机制
- **xaml-语法规则.md**：六种语法（元素语法、属性语法、属性元素语法、内容语法、集合语法、事件特性语法），每种配有示例

### 2.2 XAML 命名空间（3篇）

- **默认命名空间.md**：xmlns映射WPF核心控件、命名空间URI含义、程序集映射原理
- **x-命名空间.md**：x:Key、x:Name、x:Class、x:Static、x:Type、x:Null、x:Array 逐一详解
- **自定义命名空间引入.md**：clr-namespace语法、System命名空间引用、外部程序集引用、自定义控件命名空间

### 2.3 XAML 类派生关系（1篇）

- **wpf-核心类层次结构.md**：Object→DispatcherObject→DependencyObject→Visual→UIElement→FrameworkElement→Control完整继承链，ContentControl/ItemsControl/Panel/Shape四大分支，FrameworkElement核心能力

### 2.4 XAML 核心文件解读（2篇）

- **appxaml-详解.md**：StartupUri、Application.Resources全局资源、MergedDictionaries合并资源字典、Application事件
- **mainwindowxaml-详解.md**：Window根元素、xmlns命名空间声明、x:Class后台代码关联、各类控件在XAML中的完整写法

## 文章格式要求

每篇严格遵循"十段式深度教学法"，包含10种callout卡片，使用与`什么是-xaml.md`一致的格式和行文风格。

## 技术方案

### 实现策略

纯内容创作任务，不涉及代码逻辑修改。以`什么是-xaml.md`为格式模板，以`完整知识菜单.md`中第212-273行的知识点大纲为内容依据，逐篇重写9篇占位文章。

### 格式规范

- 前置元数据（frontmatter）：`title`字段为文章标题，section为`02-xaml`，parent为所属子章节
- 正文标题：`# 文章标题`
- 10个callout段落：`> [!plain]`、`> [!def]`、`> [!origin]`、`> [!essentials]`、`> [!example]`、`> [!scene]`、`> [!pitfall]`、`> [!best]`、`> [!practice]`、`> [!related]`
- 代码块使用标准markdown语法高亮标记（`xml`、`csharp`）
- 每篇文章体量均衡，示例代码可实际运行

### 内容要点

- 白话理解：用生活化类比解释技术概念，避免纯术语堆砌
- 官方定义：引用或意译Microsoft Docs中的标准定义
- 由来背景：说明该技术的起源、设计动机、演变历史
- 核心要点：提炼3-6个关键知识点，用列表呈现
- 完整示例：提供XAML代码 + 等效C#代码双向对照
- 适用场景：明确指出适用和不适用的场景
- 常见踩坑：2-3个初学者高频错误及解决方案
- 最佳实践：3-5条业界推荐做法
- 上手练习：三个难度递进的练习任务
- 相关知识链接：前置知识、后续必学、关联概念、官方文档链接

### 文件操作

仅修改`public/content/02-xaml/`目录下的9个已有`.md`文件，用完整内容覆盖现有模板占位内容。不涉及其他文件的创建或修改。