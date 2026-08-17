---
title: CustomControl 自定义控件
section: 04-controls
parent: 4.11 用户控件与自定义控件
---

# CustomControl 自定义控件

> [!plain] 白话理解
> CustomControl 就是「从零设计一个全新的控件」：不依赖现成控件的外形，直接定义控件类 + 一套可替换的外观模板（ControlTemplate）。比如「LED 状态灯」这种系统里没有的控件，就用它做——外观想画成圆形就画成圆形，想换皮肤就换模板，使用方只关心 `Color` 这类属性。它比 UserControl 更底层、更灵活，也更费功夫。

> [!def] 官方定义
> `CustomControl`（习惯称「自定义控件」，通常继承自 `System.Windows.Controls.Control` 或 `RangeBase` 等基类）是一个由开发者定义控件行为的类：通过 `DefaultStyleKeyProperty.OverrideMetadata` 指定默认样式位置（`Themes/Generic.xaml`），在 `OnApplyTemplate` 中用 `GetTemplateChild` 获取模板中的 `PART_` 命名元素并装配逻辑，依赖属性负责暴露数据。官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/control-authoring-overview

> [!origin] 由来背景
> 控件模板（ControlTemplate）机制是 WPF 区别于传统 UI 框架的核心创新之一：WPF 在 .NET Framework 3.0 中让「控件行为」与「外观模板」彻底分离，标准控件都能被重新套模板。CustomControl 正是把这一能力开放给开发者：适合自绘外观（如状态灯、仪表盘、旋钮）或需要多主题切换的工业控件。上位机中大量「图形化监控元素」都是 CustomControl 的用武之地。

> [!essentials] 核心要点
> - 类继承 `Control`（或 `RangeBase` / `ItemsControl` 等基类），代码与外观分离
> - `DefaultStyleKeyProperty.OverrideMetadata`：声明默认样式在 `Themes/Generic.xaml`
> - `Themes/Generic.xaml`：集中存放默认 `Style` 与 `ControlTemplate`
> - `OnApplyTemplate`：模板加载后调用，用 `GetTemplateChild("PART_xxx")` 获取命名元素
> - 属性用依赖属性（`DependencyProperty`），支持绑定与样式设置

> [!example] 完整示例
> **"LED 状态灯"自定义控件演示：CustomControl + Themes/Generic.xaml 默认样式 + OnApplyTemplate 模板装配：**
>
> **Controls/LedLight.cs（控件类，继承 Control）：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
>
> namespace HmiDemo.Controls
> {
>     public class LedLight : Control
>     {
>         static LedLight()
>         {
>             // 指定默认样式在 Themes/Generic.xaml 中查找
>             DefaultStyleKeyProperty.OverrideMetadata(
>                 typeof(LedLight),
>                 new FrameworkPropertyMetadata(typeof(LedLight)));
>         }
>
>         // 依赖属性：灯的颜色（红/绿/黄）
>         public static readonly DependencyProperty ColorProperty =
>             DependencyProperty.Register(nameof(Color), typeof(Brush),
>                 typeof(LedLight), new PropertyMetadata(Brushes.Gray));
>
>         public Brush Color
>         {
>             get { return (Brush)GetValue(ColorProperty); }
>             set { SetValue(ColorProperty, value); }
>         }
>
>         // 模板加载完成后，给椭圆填充颜色
>         public override void OnApplyTemplate()
>         {
>             base.OnApplyTemplate();
>             if (GetTemplateChild("PART_Led") is System.Windows.Shapes.Ellipse led)
>             {
>                 led.Fill = Color;
>             }
>         }
>     }
> }
> ```
>
> **Themes/Generic.xaml（默认样式与模板）：**
> ```xml
> <ResourceDictionary
>     xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>     xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>     xmlns:controls="clr-namespace:HmiDemo.Controls">
>     <Style TargetType="{x:Type controls:LedLight}">
>         <Setter Property="Width" Value="24"/>
>         <Setter Property="Height" Value="24"/>
>         <Setter Property="Template">
>             <Setter.Value>
>                 <ControlTemplate TargetType="{x:Type controls:LedLight}">
>                     <Ellipse x:Name="PART_Led" Fill="Gray"/>
>                 </ControlTemplate>
>             </Setter.Value>
>         </Setter>
>     </Style>
> </ResourceDictionary>
> ```
>
> **MainWindow.xaml（使用自定义控件）：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:ctrls="clr-namespace:HmiDemo.Controls"
>         Title="自定义控件 - LedLight" Height="280" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
>             <ctrls:LedLight Color="LimeGreen" VerticalAlignment="Center"/>
>             <TextBlock Text=" 运行正常" Foreground="White" VerticalAlignment="Center"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,10">
>             <ctrls:LedLight Color="Orange" VerticalAlignment="Center"/>
>             <TextBlock Text=" 温度偏高" Foreground="White" VerticalAlignment="Center"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal">
>             <ctrls:LedLight Color="Red" VerticalAlignment="Center"/>
>             <TextBlock Text=" 设备故障" Foreground="White" VerticalAlignment="Center"/>
>         </StackPanel>
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
> ✅ 系统没有的图形元素：LED 状态灯、仪表盘、进度弧、旋钮
> ✅ 需要多个皮肤 / 主题切换外观的工业控件
> ✅ 控件行为固定但外观要完全可定制（用户通过换模板改样式）
> ✅ 第三方控件库发布：外观与逻辑分离，方便消费方重模板
> ❌ 只是组合现有控件时（用 [usercontrol-用户控件](usercontrol-用户控件) 更快）
> ❌ 外观固定、只在少数页面使用一次时（直接用布局画即可，别上自定义控件）

> [!pitfall] 常见踩坑
> 坑 1：**控件显示空白 / 没有默认外观** → 现象：用了 LedLight 但界面上什么都没有。原因：`DefaultStyleKeyProperty.OverrideMetadata` 未设置，或 `Themes/Generic.xaml` 没被程序集自动加载。解决：确认在静态构造函数中重写 DefaultStyleKey，且默认样式 `TargetType` 与控件类一致、文件在 `Themes/Generic.xaml`。
> 
> 坑 2：**模板加载后 PART 元素是 null 导致崩溃** → 现象：`OnApplyTemplate` 里访问 `GetTemplateChild("PART_Led")` 报空引用。原因：模板被替换后没有同名元素。解决：用 `is` 模式判断再处理（`if (GetTemplateChild(...) is Ellipse led)`），命名元素用 `PART_` 前缀约定。
>
> 坑 3：**属性变化后界面不刷新** → 现象：代码改了 `Color` 属性，LED 灯颜色没变。原因：普通属性不会通知 UI，或没在属性变更回调里更新模板元素。解决：用依赖属性并在 `PropertyChangedCallback`（如 `OnColorChanged`）里更新 `PART_` 元素。

> [!best] 最佳实践
> - 命名约定：模板中需要代码访问的元素统一用 `PART_` 前缀，用 `GetTemplateChild` 获取
> - 暴露的属性都做成依赖属性，让绑定、样式、动画都能工作
> - 模板元素属性用 `TemplateBinding` 关联控件属性（如 `Fill="{TemplateBinding Color}"`），减少手动同步
> - 默认样式放 `Themes/Generic.xaml` 是框架约定，不要改目录名
> - 先做「行为」再做「外观」：逻辑与模板分离，控件才能被换肤

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，观察三个不同颜色的 LED 灯；修改 `Color` 属性值（如 Purple）验证颜色变化
> **Lv.2 小试牛刀**：给 LedLight 增加一个 `Blink` 依赖属性（bool），`true` 时用 `DispatcherTimer` 让灯 500ms 闪烁
> **Lv.3 融会贯通**：把 LED 灯外观从圆形改成圆角矩形（改 Generic.xaml 模板），再给模板加一个文字标注（`Text` 属性显示在灯旁）
> **Lv.4 挑战进阶**：实现「仪表盘」CustomControl：继承 `RangeBase`（自带 Minimum / Maximum / Value），模板画一个半圆进度弧 + 指针，Value 变化时指针角度联动（用 `TemplateBinding` + 转换器）

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[usercontrol-用户控件](usercontrol-用户控件)」理解控件复用的第一种方式
> - → 后续必学：第 7 章「MVVM」中给自定义控件暴露的命令与绑定模式
> - ⇄ 关联概念：选择决策见「[usercontrol-vs-customcontrol-选择指南](usercontrol-vs-customcontrol-选择指南)」，模板相关概念见「[contentcontrol-内容控件](contentcontrol-内容控件)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/control-authoring-overview
