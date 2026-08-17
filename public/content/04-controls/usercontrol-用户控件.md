---
title: UserControl 用户控件
section: 04-controls
parent: 4.11 用户控件与自定义控件
---

# UserControl 用户控件

> [!plain] 白话理解
> UserControl 就是「把几个现成控件打包成一个新控件」：比如「参数行」（标签 + 输入框）在界面上要重复几十次，与其每次写两行 XAML，不如做成一个 `ParamRow` 用户控件，主界面一行 `<uc:ParamRow Label="温度" Value="25.6"/>` 就搞定。它像搭积木——用已有的控件块拼出一个新形状，拼好之后还能再拼进更大的界面里。

> [!def] 官方定义
> `UserControl`（全限定名 `System.Windows.Controls.UserControl`）是一个继承自 `ContentControl` 的容器类，用于把多个现有控件组合成可复用的复合控件：它自带一个 XAML 外观文件（.xaml + .xaml.cs），通过普通属性（CLR 属性）或依赖属性（`DependencyProperty.Register`）向外部暴露参数。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.usercontrol

> [!origin] 由来背景
> 复合控件思想可追溯到 Windows Forms 的 `UserControl`：把「标签 + 文本框」「按钮组」等反复出现的组合抽成独立组件，避免代码重复。WPF 在 .NET Framework 3.0 中延续了这一设计，并让 UserControl 的外观（XAML）与逻辑（C#）分离、可完整支持数据绑定（需通过依赖属性暴露）。上位机中「参数行」「设备状态块」「报警条目」这类高度复用的界面单元，正是 UserControl 的主场。

> [!essentials] 核心要点
> - 组成：一个 `.xaml`（外观）+ `.xaml.cs`（后台逻辑）成对出现
> - 外部属性：普通属性适用于简单赋值；需要绑定时必须用依赖属性（`DependencyProperty`）
> - 使用方式：主窗口 XAML 中 `xmlns:uc="clr-namespace:..."` 后以标签形式使用
> - 内部控件可用 `x:Name` 命名，后台代码直接访问
> - 数据双向同步：`TextChanged` 事件里用 `SetCurrentValue` 回写依赖属性

> [!example] 完整示例
> **"参数行"用户控件演示：新建 UserControl 组合已有控件，通过依赖属性暴露给外部使用：**
>
> **UserControls/ParamRow.xaml（用户控件外观）：**
> ```xml
> <UserControl x:Class="HmiDemo.UserControls.ParamRow"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
>     <Grid>
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="*"/>
>         </Grid.ColumnDefinitions>
>         <TextBlock x:Name="lblName" Foreground="#C9D1D9" VerticalAlignment="Center" Width="100"/>
>         <TextBox x:Name="txtValue" Grid.Column="1" Padding="4" Background="#161B22"
>                  Foreground="White" TextChanged="OnTextChanged"/>
>     </Grid>
> </UserControl>
> ```
>
> **UserControls/ParamRow.xaml.cs（用户控件后台，暴露依赖属性）：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo.UserControls
> {
>     public partial class ParamRow : UserControl
>     {
>         public ParamRow() => InitializeComponent();
>
>         // 参数名属性：供 XAML 直接赋值 <param:ParamRow Label="温度"/>
>         public string Label
>         {
>             get { return lblName.Text; }
>             set { lblName.Text = value; }
>         }
>
>         // 参数值依赖属性：支持绑定 {Binding Value}
>         public static readonly DependencyProperty ValueProperty =
>             DependencyProperty.Register(nameof(Value), typeof(string), typeof(ParamRow),
>                 new PropertyMetadata("", OnValueChanged));
>
>         public string Value
>         {
>             get { return (string)GetValue(ValueProperty); }
>             set { SetValue(ValueProperty, value); }
>         }
>
>         private static void OnValueChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
>         {
>             ((ParamRow)d).txtValue.Text = e.NewValue as string;
>         }
>
>         private void OnTextChanged(object sender, TextChangedEventArgs e)
>         {
>             SetCurrentValue(ValueProperty, txtValue.Text);
>         }
>     }
> }
> ```
>
> **MainWindow.xaml（主窗口使用用户控件）：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:uc="clr-namespace:HmiDemo.UserControls"
>         Title="用户控件 - UserControl" Height="300" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <uc:ParamRow Label="温度（℃）" Value="25.6" Margin="0,0,0,8"/>
>         <uc:ParamRow Label="压力（MPa）" Value="0.42" Margin="0,0,0,8"/>
>         <uc:ParamRow Label="转速（RPM）" Value="1500"/>
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
> ✅ 「标签 + 输入框」参数行、设备状态块等重复出现的界面单元
> ✅ 把一组控件 + 逻辑打包成业务组件（如「设备启停按钮组」）
> ✅ 页面内多处使用、外观固定的小部件
> ✅ 团队协作时按界面区域拆分开发任务
> ❌ 需要在多个主题 / 皮肤间切换外观、需要控件级重模板时（改用 [customcontrol-自定义控件](customcontrol-自定义控件)）
> ❌ 只需要一次性的布局组合时（直接在 XAML 写，别过度封装）

> [!pitfall] 常见踩坑
> 坑 1：**用户控件里绑定不到外部数据** → 现象：`<uc:ParamRow Value="{Binding Temp}"/>` 绑定不生效。原因：`Value` 是普通 CLR 属性，不支持 WPF 绑定（绑定只对依赖属性生效）。解决：把要绑定的属性注册为依赖属性（`DependencyProperty.Register`）。
> 
> 坑 2：**控件改了值，外部绑定不更新** → 现象：用户在 ParamRow 里输入，绑定的 ViewModel 属性没变化。原因：输入只改了内部 TextBox，没回写依赖属性。解决：在 `TextChanged` 事件里调用 `SetCurrentValue(ValueProperty, txtValue.Text)`。
>
> 坑 3：**命名空间引用报错 / 找不到控件** → 现象：主窗口用了 `xmlns:uc="clr-namespace:HmiDemo.UserControls"` 却编译失败。原因：命名空间名拼错，或控件类未放在该命名空间下。解决：核对 `x:Class` 与 `clr-namespace` 一致，控件类用 `public` 修饰。

> [!best] 最佳实践
> - 需要绑定或复用的属性一律用依赖属性，普通属性只用于简单静态赋值
> - UserControl 内部尽量避免直接访问外部 `DataContext`，通过依赖属性收口数据入口
> - 命名规范：控件文件放 `UserControls/` 目录，类名语义化（ParamRow、DeviceCard）
> - 内部控件样式与主界面深色主题统一，控件内不写死颜色，尽量用资源
> - 一个 UserControl 只封装「一个职责」的界面单元，别把整页塞进去

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，观察三个 ParamRow 的标签与数值显示；在 XAML 中修改 `Label` 文本观察变化
> **Lv.2 小试牛刀**：给 ParamRow 增加一个 `Unit` 属性（单位，如 ℃），在内部显示「25.6 ℃」；新增一个带 ComboBox 的 `ModeRow` 用户控件
> **Lv.3 融会贯通**：把 ParamRow.Value 绑定到 ViewModel 属性（温度、压力、转速），验证用户输入能同步回 ViewModel
> **Lv.4 挑战进阶**：实现「设备状态卡」UserControl：包含设备名、LED 状态灯（复用 [customcontrol-自定义控件](customcontrol-自定义控件) 的 LedLight）、运行时长三个部分，并暴露 `DeviceName` / `IsRunning` 依赖属性，主窗口用 ItemsControl 绑定设备集合批量展示

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[contentcontrol-内容控件](contentcontrol-内容控件)」理解内容模型，UserControl 是其子类
> - → 后续必学：本章「[customcontrol-自定义控件](customcontrol-自定义控件)」对比控件级复用的另一种方式
> - ⇄ 关联概念：选择决策见「[usercontrol-vs-customcontrol-选择指南](usercontrol-vs-customcontrol-选择指南)」，内部布局见第 3 章「布局」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.usercontrol
