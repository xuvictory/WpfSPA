---
title: HeaderedContentControl 带标题内容控件
section: 04-controls
parent: 4.1 控件内容模型
---

# HeaderedContentControl 带标题内容控件

> [!plain] 白话理解
> 上位机里大量存在"标题 + 内容"的区域：左侧写着"通信参数"，右侧或下方是参数列表；上面标着"运行状态"，下面是一行状态文字。如果每次都用布局手工拼"标题 TextBlock + 内容面板"，代码会又长又重复，而且标题与内容的对齐、换行关系还要自己维护。
> HeaderedContentControl 把这个"带标题的盒子"做成了标准控件：`Header` 装标题（可以是一段文字，也可以是任意元素），`Content` 装主体内容。`GroupBox` 的边框标题、`TabItem` 的页签标题都是它的具体形态。

> [!def] 官方定义
> HeaderedContentControl 是 `ContentControl` 的直接子类，位于 `System.Windows.Controls` 命名空间，在"单一内容"之外增加了 `Header` 属性（类型 `object`），用于描述内容的标题。它有两个关键模板：`HeaderTemplate` 控制标题的呈现方式、`ContentTemplate` 控制主体内容的呈现方式。经典子类包括 `GroupBox`（带边框的标题分组）与 `TabItem`（带页签的内容页）。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.headeredcontentcontrol

> [!origin] 由来背景
> 早期界面开发中，"给一块内容配个标题"要由开发者用布局控件自己拼：一个 `TextBlock` 当标题、一个面板装内容，还要处理对齐与间距。这种模式在上位机这种"满屏分组面板"的界面里反复出现，极易出现标题样式不一致、间距随意的现象。WPF 把"标题 + 内容"抽象为 HeaderedContentControl：标题与内容都支持任意元素与数据模板，子类 GroupBox、TabItem 再赋予它边框、页签等具体外观，从此"带标题的容器"成为可复用的标准零件。

> [!essentials] 核心要点
> - **Header 与 Content 双内容**：标题和主体各自独立，都可为字符串、元素或数据对象
> - **继承链**：`HeaderedContentControl` → `ContentControl` → `Control`，天然拥有 `Content` 的一切能力
> - **两大经典子类**：`GroupBox`（边框标题分组）、`TabItem`（TabControl 的页签内容）
> - **模板分离**：`HeaderTemplate` 管标题长相、`ContentTemplate` 管内容长相，互不干扰
> - **动态修改**：`Header`、`Content` 都可在后台代码随时重新赋值，实现标题/内容联动切换

> [!example] 完整示例
> **设备参数面板演示：Header 与 Content 分开设置，标题与内容自由组合：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备参数面板 - HeaderedContentControl" Height="450" Width="700"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel x:Name="root" Margin="15">
>         <!-- GroupBox 就是 HeaderedContentControl 最典型的应用 -->
>         <GroupBox Header="通信参数" Margin="5" Foreground="White">
>             <StackPanel Margin="10">
>                 <TextBlock Text="波特率：9600" Margin="0,2"/>
>                 <TextBlock Text="数据位：8" Margin="0,2"/>
>                 <TextBlock Text="停止位：1" Margin="0,2"/>
>             </StackPanel>
>         </GroupBox>
>
>         <!-- 直接使用 HeaderedContentControl -->
>         <HeaderedContentControl Header="运行状态" Margin="5" Padding="10"
>                                 Background="#161B22" BorderBrush="#2A4A6C"
>                                 BorderThickness="1">
>             <TextBlock Text="● 设备运行正常" Foreground="#3FB950"/>
>         </HeaderedContentControl>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // Header 和 Content 都可以在代码中动态设置
>             var box = new HeaderedContentControl
>             {
>                 Header = "实时数据",
>                 Margin = new Thickness(5),
>                 Content = new TextBlock { Text = "温度：25.6 ℃  湿度：48%" }
>             };
>             root.Children.Add(box);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 参数分组面板：每个设备/工位一组参数，组名作 Header，参数列表作 Content
> ✅ 状态指示区：标题显示"运行状态"，内容区随状态切换图标与文字（配合模板更佳）
> ✅ 多页签结构：`TabItem` 的页签标题是 Header、页面主体是 Content，天然满足分页导航
> ✅ 数据表格的列头分组：树形/分层数据中，父节点作标题、子项作内容
> ❌ 标题与内容没有明显主从关系、只是平级排布的界面（直接 Grid 布局即可）
> ❌ 一个区域包含多个并列内容块，需要的是「headereditemscontrol-带标题条目控件」或 `ItemsControl`

> [!pitfall] 常见踩坑
> 坑 1：**把 Header 当成 Content 的一部分写** → 出现"内容整体偏移/被标题格式污染"。原因：两者渲染区域不同。解决：标题归标题、内容归内容，各用各的属性
>
> 坑 2：**直接实例化裸 HeaderedContentControl 后没有样式** → 显示很素。原因：裸控件默认无边框外观。解决：需要边框标题外观时直接用 `GroupBox`，需要页签用 `TabItem`
>
> 坑 3：**Header 放复杂元素后标题区域过高** → 整行被撑高。原因：Header 容器会容纳整个元素高度。解决：限制元素尺寸，或用 `HeaderTemplate` 控制标题布局
>
> 坑 4：**动态切换 Header 时内容不刷新** → 界面仍显示旧标题。原因：Header 绑定的是不触发通知的属性。解决：绑定 `INotifyPropertyChanged` 属性或直接赋新值对象

> [!best] 最佳实践
> - 90% 的"带标题分组"直接用 `GroupBox`，很少需要裸用 HeaderedContentControl
> - Header 需要复杂排版（图标+文字）时，用 `HeaderTemplate` 定义，不要在每个实例上重复堆 XAML
> - 数据驱动场景下让 Header 绑定数据属性，标题随数据自动变化，避免后台代码逐处赋值
> - 自定义带标题的复合控件时继承 HeaderedContentControl，可同时获得 Header 与 Content 两大能力
> - 保持 Header 简洁：标题只做"一句话说明"，详细信息放 Content，避免标题区拥挤

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，把 `Header` 从字符串改成包含图标+文字的 `StackPanel`，观察标题区表现
> **Lv.2 小试牛刀**：给 `HeaderedContentControl` 加 `HeaderTemplate`，让 Header 统一显示"● 标题文字"格式，且颜色可配
> **Lv.3 融会贯通**：用 `GroupBox` 重写示例，并让 Header 绑定一个 `INotifyPropertyChanged` 属性，模拟"设备名实时变化"
> **Lv.4 挑战**：自定义一个继承 `HeaderedContentControl` 的 `ParameterPanel`，在 Header 右侧内置"展开/收起"箭头，点击切换 Content 的 `Visibility`

> [!related] 相关知识链接
> - ← 前置知识：「contentcontrol-内容控件」是它的父类；`Header`/`Content` 绑定依赖第 5 章「什么是数据绑定」
> - → 后续必学：「headereditemscontrol-带标题条目控件」把"标题+多条内容"变成标准结构；「groupbox-分组框」是其最常用子类
> - ⇄ 关联概念：「tabcontrol-选项卡」由多个 HeaderedContentControl 形态的 TabItem 组成
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.headeredcontentcontrol
