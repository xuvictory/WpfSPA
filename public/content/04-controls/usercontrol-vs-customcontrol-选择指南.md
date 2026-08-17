---
title: UserControl vs CustomControl 选择指南
section: 04-controls
parent: 4.11 用户控件与自定义控件
---

# UserControl vs CustomControl 选择指南

> [!plain] 白话理解
> UserControl 和 CustomControl 是「打包复用控件的两种路线」：前者是把现成控件「拼」成一个新控件（快、但外观固定），后者是从零「造」一个控件（慢、但外观可任意换皮肤）。就像装修：UserControl 是把标准家具摆进房间直接住；CustomControl 是请人定制一套能变换风格的整体家具。多数上位机需求用 UserControl 就够，只有需要换主题、自绘外观时才上 CustomControl。

> [!def] 官方定义
> `UserControl`（`System.Windows.Controls.UserControl`）是组合式控件：XAML 外观与代码成对，适合快速组合现有控件；`CustomControl`（通常继承 `System.Windows.Controls.Control`）是模板化控件：逻辑写在类中、外观由 `Themes/Generic.xaml` 的 `ControlTemplate` 提供，支持主题换肤。官方对比文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/control-authoring-overview

> [!origin] 由来背景
> 两种控件形态源于 WPF「外观与逻辑分离」的架构目标：UserControl 继承了 Windows Forms 时代「组合控件」的成熟思路，上手快；CustomControl 则充分发挥 ControlTemplate 能力，解决「同一逻辑、多套皮肤」的工业软件痛点。微软官方在文档中明确区分两者定位：快速组装选 UserControl，完整控件生命周期与主题支持选 CustomControl。上位机项目通常两者混用——页面级复用用 UserControl，图形监控元素用 CustomControl。

> [!essentials] 核心要点
> - UserControl：XAML + 代码成对，继承 `UserControl`，组合现有控件，外观固定
> - CustomControl：逻辑类 + `Themes/Generic.xaml`，继承 `Control` 等，外观可重模板
> - UserControl 适合页面内复用；CustomControl 适合跨项目、跨主题复用
> - UserControl 开发快、调试直观；CustomControl 学习成本高但灵活
> - 判断标准：是否需要「换皮肤 / 自绘外观」→ 需要则 CustomControl

> [!example] 完整示例
> **同一"温度显示条"分别用两种方式实现，对比差异：UserControl 适合组合现有控件、CustomControl 适合完全自绘模板：**
>
> **方式一：UserControl（组合式，开发快，样式跟随外观文件）**
>
> **Controls/TempBarUC.xaml：**
> ```xml
> <UserControl x:Class="HmiDemo.Controls.TempBarUC"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
>     <Grid>
>         <ProgressBar x:Name="bar" Minimum="0" Maximum="100" Height="18"/>
>         <TextBlock x:Name="txt" Foreground="White" HorizontalAlignment="Center"
>                    VerticalAlignment="Center" FontSize="12"/>
>     </Grid>
> </UserControl>
> ```
>
> **Controls/TempBarUC.xaml.cs：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo.Controls
> {
>     public partial class TempBarUC : UserControl
>     {
>         public TempBarUC() => InitializeComponent();
>
>         public double Value
>         {
>             get { return bar.Value; }
>             set
>             {
>                 bar.Value = value;
>                 txt.Text = $"{value:F0} ℃";
>             }
>         }
>     }
> }
> ```
>
> **方式二：CustomControl（自绘模板，外观可在多个主题间切换）**
>
> **Controls/TempBarCC.cs：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Controls.Primitives;
>
> namespace HmiDemo.Controls
> {
>     public class TempBarCC : RangeBase
>     {
>         static TempBarCC()
>         {
>             DefaultStyleKeyProperty.OverrideMetadata(typeof(TempBarCC),
>                 new FrameworkPropertyMetadata(typeof(TempBarCC)));
>         }
>
>         // RangeBase 已经带了 Minimum/Maximum/Value 依赖属性
>     }
> }
> ```
>
> **Themes/Generic.xaml（为其定义模板）：**
> ```xml
> <ResourceDictionary
>     xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>     xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>     xmlns:controls="clr-namespace:HmiDemo.Controls">
>     <Style TargetType="{x:Type controls:TempBarCC}">
>         <Setter Property="Height" Value="18"/>
>         <Setter Property="Template">
>             <Setter.Value>
>                 <ControlTemplate TargetType="{x:Type controls:TempBarCC}">
>                     <ProgressBar Minimum="{TemplateBinding Minimum}"
>                                  Maximum="{TemplateBinding Maximum}"
>                                  Value="{TemplateBinding Value}" Height="18"/>
>                 </ControlTemplate>
>             </Setter.Value>
>         </Setter>
>     </Style>
> </ResourceDictionary>
> ```
>
> **MainWindow.xaml（两种控件并列使用）：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:ctrls="clr-namespace:HmiDemo.Controls"
>         Title="两种实现对比" Height="280" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="UserControl 实现：" Foreground="#8B949E"/>
>         <ctrls:TempBarUC x:Name="ucBar" Value="65" Margin="0,4,0,16"/>
>         <TextBlock Text="CustomControl 实现：" Foreground="#8B949E"/>
>         <ctrls:TempBarCC x:Name="ccBar" Minimum="0" Maximum="100" Value="65"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ UserControl：参数行、设备状态卡、告警条目等页面内高频组合
> ✅ CustomControl：LED 灯、仪表盘、趋势弧等图形化监控元素
> ✅ 需要多主题换肤的控件库 → CustomControl
> ✅ 快速交付、外观固定 → UserControl
> ❌ 只用一次的布局（两者都不用，直接 XAML 画）
> ❌ 需要控件参与焦点、键盘、模板绑定等完整控件行为 → 必须 CustomControl

> [!pitfall] 常见踩坑
> 坑 1：**UserControl 当 CustomControl 用，换肤失效** → 现象：想给参数行换主题皮肤，改 UserControl 的 Style 发现无效果。原因：UserControl 的外观写死在 XAML 中，不支持模板替换。解决：需要换肤就改为 CustomControl，把外观移入 `Themes/Generic.xaml` 模板。
> 
> 坑 2：**CustomControl 用 UserControl 的思路写，耦合外观** → 现象：逻辑代码里直接 new 了具体控件，换模板就崩。原因：在类中依赖了具体可视化元素。解决：遵循 `OnApplyTemplate` + `PART_` 命名约定访问模板元素，行为与外观解耦。
>
> 坑 3：**选型只凭「哪个快」导致后期重构** → 现象：项目后期突然要换皮肤，几十个 UserControl 全部要改造。原因：早期没考虑主题需求。解决：设计阶段先明确「是否可能换肤 / 是否跨项目复用」，再定控件形态；通用型界面组件直接用 CustomControl 起步。

> [!best] 最佳实践
> - 选型口诀：组合现成控件、外观固定 → UserControl；自绘外观、多主题 → CustomControl
> - 页面内部复用小部件用 UserControl；会进入控件库、跨工程复用的用 CustomControl
> - 无论哪种，可绑定属性都用依赖属性，保证 MVVM 顺畅
> - 从 UserControl 起步，出现「换肤 / 重模板」需求时再迁移为 CustomControl（模板逻辑已在 OnApplyTemplate 中则迁移成本低）
> - 同一项目中两者可以共存：页面组件 UserControl + 图形元素 CustomControl

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，观察 TempBarUC（UserControl）与 TempBarCC（CustomControl）在界面上的表现差异
> **Lv.2 小试牛刀**：分别修改 TempBarUC 的外观文件与 TempBarCC 的 Generic.xaml 模板（如改进度条颜色），体会「外观修改位置」的差异
> **Lv.3 融会贯通**：给 TempBarUC 增加一个 `Text` 依赖属性并绑定；给 TempBarCC 增加一个 `Format` 字符串属性控制显示文本，验证两种方式暴露属性的路径不同
> **Lv.4 挑战进阶**：把一个现有的 UserControl（如设备状态卡）改造成 CustomControl：将外观移入 `Themes/Generic.xaml`，用 `OnApplyTemplate` 装配内部元素，并对比改造前后「换皮肤」的灵活性差异

> [!related] 相关知识链接
> - ← 前置知识：先分别学本章「[usercontrol-用户控件](usercontrol-用户控件)」与「[customcontrol-自定义控件](customcontrol-自定义控件)」，再读本指南做选型
> - → 后续必学：第 7 章「MVVM」中控件与 ViewModel 的命令绑定
> - ⇄ 关联概念：内容模型见「[contentcontrol-内容控件](contentcontrol-内容控件)」，控件内组合的输入类见「[textbox-文本框](textbox-文本框)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/control-authoring-overview
