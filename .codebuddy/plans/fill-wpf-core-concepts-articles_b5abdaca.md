---
name: fill-wpf-core-concepts-articles
overview: 为"5. WPF核心概念"菜单下的 10 个子节共 58 篇空壳文章补充完整的教学内容，包括真实的白话解释、官方定义、代码示例、踩坑指南和实战练习。
todos:
  - id: batch-01-dependency-properties
    content: 填充 5.1 依赖属性子节 6 篇文章（什么是依赖属性、原理、注册、附加属性、vs-CLR属性、应用场景）
    status: completed
  - id: batch-02-routed-events
    content: 填充 5.2 路由事件子节 8 篇文章（概念、策略、参数、注册、附加事件、内置事件、隧道vs冒泡、实战技巧）
    status: completed
  - id: batch-03-command-system
    content: 填充 5.3 命令系统子节 7 篇文章（概念、ICommand、内置命令、绑定、自定义、RelayCommand、参数传递）
    status: completed
  - id: batch-04-data-binding
    content: 填充 5.4 数据绑定子节 10 篇文章（概念、Binding属性、DataContext、INotifyPropertyChanged、高级用法、RelativeSource、ElementName、值转换器、验证、调试）
    status: completed
  - id: batch-05-markup-extensions
    content: 填充 5.5 标记扩展子节 4 篇文章（概念、内置扩展、StaticResource vs DynamicResource、自定义扩展）
    status: completed
  - id: batch-06-resource-system
    content: 填充 5.6 资源系统子节 5 篇文章（概念、层级查找、定义引用、资源字典、pack URI）
    status: completed
  - id: batch-07-styles
    content: 填充 5.7 样式子节 6 篇文章（概念、核心属性、Setter、继承、隐式样式、上位机技巧）
    status: completed
  - id: batch-08-templates
    content: 填充 5.8 模板子节 5 篇文章（ControlTemplate、DataTemplate、层级模板、ItemContainerStyle、模板绑定语法）
    status: completed
  - id: batch-09-triggers
    content: 填充 5.9 触发器子节 6 篇文章（Trigger、MultiTrigger、DataTrigger、MultiDataTrigger、EventTrigger、场景对比）
    status: completed
  - id: batch-10-concept-relations
    content: 填充 5.10 核心概念关系图 1 篇文章（各核心概念之间的联系），串联前述所有概念
    status: completed
    dependencies:
      - batch-01-dependency-properties
      - batch-02-routed-events
      - batch-03-command-system
      - batch-04-data-binding
      - batch-05-markup-extensions
      - batch-06-resource-system
      - batch-07-styles
      - batch-08-templates
      - batch-09-triggers
---

## 用户需求

检查并补全"5.WPF核心概念"菜单下全部 58 篇文章的内容。当前所有文章均为占位模板，包含通用的模板文字和`📝 待补充实际示例代码`标记，无实质性教学内容。

## 产品概述

WPF 上位机开发知识库中的核心章节，涵盖依赖属性、路由事件、命令系统、数据绑定、标记扩展、资源系统、样式、模板、触发器、核心概念关系图共 10 个子主题。目标读者为 WPF 上位机开发者，需要从零到一理解并掌握 WPF 最核心的机制。

## 核心功能

- 每篇文章需包含 10 个标准 Callout 块：白话理解、官方定义、由来背景、核心要点、完整示例、适用场景、常见踩坑、最佳实践、上手练习、相关知识链接
- 每个 Callout 块内每一行必须以 `> ` 前缀开头（包括空行、代码围栏、代码内容、表格）
- 代码示例需包含可运行的 XAML + C# 代码，贴合上位机场景（设备监控、PLC通信、数据采集等）
- 踩坑指南需针对当前知识点，避免通用模板话术
- 练习分三级：Lv.1 照猫画虎、Lv.2 小试牛刀、Lv.3 融会贯通
- 内容风格保持与已完成文章（xaml-的特点.md、border-边框容器.md）一致：口语化白话解释、深色主题代码示例、上位机场景贯穿

## 技术方案

### 实施策略

采用**逐子节、逐文件**方式，按依赖关系顺序填充。先补充基础概念文章（如"什么是依赖属性"），再补充进阶文章（如"依赖属性应用场景"），确保前后引用准确。

### Callout 格式硬性规则

- 每个 Callout 块（`> [!xxx]`）内的所有行必须以 `> ` 开头
- 包括：段落文字、空行（`> `）、代码围栏（`> ``` `）、代码内容行（`> 代码`）、表格行
- Callout 之间空行不需要 `> ` 前缀（独立的 `>` 引用块判断）
- 参考 border-边框容器.md 中 `> [!example]` 块的写法作为模板

### 内容质量标准

- **白话理解**：150-250 字，通俗类比（如"依赖属性就像Excel单元格公式，牵一发而动全身"）
- **官方定义**：100-150 字，准确的技术定义，引用 MSDN 术语
- **由来背景**：120-200 字，解释该特性解决什么痛点，对比 WinForms 的不足
- **核心要点**：4-6 条要点，每条 15-30 字精炼总结
- **完整示例**：50-120 行代码（XAML + C#），上位机主题（设备卡片、状态监控、参数配置等）
- **适用场景**：5-8 条，包含 ✅ 推荐场景和 ❌ 不适用场景
- **常见踩坑**：3 个具体坑，每个 30-60 字解释 + 解决方案
- **最佳实践**：3-5 条具体建议
- **上手练习**：三级难度递进，每级 20-40 字描述
- **相关知识链接**：前置/后续/关联/官方文档各 1 条

### 文件清单与实施批次

**第1批：依赖属性（5.1，6篇）**

- 什么是依赖属性.md：基础概念、SEA类比、依赖属性 vs CLR 属性初步
- 依赖属性的原理.md：附加属性存储、属性变化通知、值优先级、元数据
- 注册依赖属性.md：DependencyProperty.Register()、PropertyMetadata、回调函数
- 附加属性.md：Grid.Row/Column 为例、RegisterAttached()、自定义附加属性
- 依赖属性-vs-clr-属性.md：对比表、内存占用、绑定支持、动画支持、性能
- 依赖属性应用场景.md：数据绑定、样式、动画、附加属性场景、自定义控件

**第2批：路由事件（5.2，8篇）**

- 什么是路由事件.md：事件树、RoutingStrategy
- 路由策略冒泡隧道直接.md：Bubbling/Tunneling/Direct 三种策略对比与代码演示
- 路由事件参数.md：RoutedEventArgs、Handled、OriginalSource
- 注册自定义路由事件.md：RegisterRoutedEvent()、AddHandler/RemoveHandler
- 附加事件.md：Mouse.MouseDown 等、附加事件 vs 附加属性
- 常用内置路由事件.md：Button.Click、UIElement.MouseLeftButtonDown 等常用事件分类
- 隧道事件-vs-冒泡事件.md：Preview 前缀、隧道先行冒泡后行、e.Handled 截断
- 路由事件实战技巧.md：事件聚合、MVVM 行为、EventTrigger 配合使用

**第3批：命令系统（5.3，7篇）**

- 什么是命令.md：命令模式、WPF 命令四要素
- icommand-接口.md：Execute、CanExecute、CanExecuteChanged
- 内置命令.md：ApplicationCommands、NavigationCommands、EditingCommands
- 命令绑定.md：CommandBinding、CommandTarget、InputBindings
- 自定义命令.md：实现 ICommand、命令参数、UI 解耦
- mvvm-中的命令relaycommand.md：RelayCommand/DelegateCommand 实现
- commandparameter-参数传递.md：CommandParameter 绑定、MultiBinding 传多参数

**第4批：数据绑定（5.4，10篇）**

- 什么是数据绑定.md：绑定概念、四大要素、单向/双向绑定
- binding-核心属性.md：Path、Source、Mode、UpdateSourceTrigger 等
- datacontext-数据上下文.md：DataContext 继承链、逐级查找
- inotifypropertychanged-接口.md：实现方式、CallerMemberName、Fody 简化
- 绑定表达式高级用法.md：StringFormat、FallbackValue、TargetNullValue、Delay
- relativesource-详解.md：Self、TemplatedParent、FindAncestor、PreviousData
- elementname-绑定.md：控件间绑定、Slider-TextBlock 联动示例
- 值转换器-ivalueconverter.md：Convert/ConvertBack、多值转换器、CultureInfo
- 数据验证.md：ValidationRule、IDataErrorInfo、INotifyDataErrorInfo
- 调试数据绑定.md：PresentationTraceSources、Snoop 工具、调试技巧

**第5批：标记扩展（5.5，4篇）**

- 什么是标记扩展.md：MarkupExtension、花括号语法
- 常用内置标记扩展.md：Binding、StaticResource、DynamicResource、x:Null、x:Type
- staticresource-vs-dynamicresource.md：加载时机、性能对比、修改响应
- 自定义标记扩展.md：继承 MarkupExtension、ProvideValue 方法

**第6批：资源系统（5.6，5篇）**

- 什么是-wpf-资源.md：Resources 字典、资源 vs 内容文件
- 资源层级与查找顺序.md：System→Application→Window→Panel→Control
- 资源定义与引用.md：XAML 中定义、代码中访问 FindResource/TryFindResource
- 资源字典.md：ResourceDictionary 独立文件、MergedDictionaries
- 二进制资源与-pack-uri.md：Build Action、pack URI 语法、站点资源

**第7批：样式（5.7，6篇）**

- 什么是样式.md：Style 元素、Setter、选择性应用
- style-核心属性.md：TargetType、x:Key、BasedOn、Triggers
- setter-详解.md：Property/Value 语法、EventSetter、多 Setter
- 样式继承basedon.md：继承链、重写、限制
- 隐式样式.md：无 x:Key 的样式、自动应用规则
- 上位机中样式使用技巧.md：主题色方案、状态色、数字字体、深色主题

**第8批：模板（5.8，5篇）**

- 控件模板-controltemplate.md：Template 属性、TemplateBinding、Triggers
- 数据模板-datatemplate.md：自动应用规则、DataType、数据展现
- hierarchicaldatatemplate-层级模板.md：TreeView 多级数据展示
- itemcontainerstyle-条目容器样式.md：ItemContainerStyle、交替行颜色
- 模板绑定语法.md：TemplateBinding vs 普通 Binding、ContentPresenter

**第9批：触发器（5.9，6篇）**

- 属性触发器trigger.md：Trigger、Setter、EnterActions/ExitActions
- 多条件触发器multitrigger.md：MultiTrigger、Conditions 集合
- 数据触发器datatrigger.md：DataTrigger、Binding + Value
- 多数据触发器multidatatrigger.md：MultiDataTrigger、多条件数据绑定判定
- 事件触发器eventtrigger.md：EventTrigger、Storyboard、动画触发
- 各触发器适用场景对比.md：四种触发器对比表、选型决策树

**第10批：核心概念关系图（5.10，1篇）**

- 各核心概念之间的联系.md：依赖属性→数据绑定→MVVM 三角关系图、路由事件→命令 协作、资源→样式→模板→触发器 层级关系

### 实施注意事项

- **性能**：文件为纯 Markdown 写入，无性能瓶颈
- **Callout 格式**：每一行都必须以 `> ` 开头，这是最容易出错的地方，需逐行检查
- **代码示例一致性**：全部使用深色主题配色（#0D1117 背景、#161B22 卡片、上位机设备监控主题）
- **前后引用准确性**：`[!related]` 块中的文章文件名必须与实际文件路径完全匹配
- **上位机场景统一**：代码示例中用工业场景（电机、PLC、传感器、变频器、报警、温湿度等）