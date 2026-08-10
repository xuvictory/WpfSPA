---
title: Window 常用属性
section: 01-quickstart
parent: 1.4 窗口 Window 详解
---

# Window 常用属性

> [!plain] 白话理解
> 每个窗口就像一个"相框"——你不光可以改相框里放什么照片（Content），还可以改相框本身的尺寸（Width/Height）、位置（Left/Top）、能不能最大化（ResizeMode）、是不是一直置顶（Topmost）。这些就是 Window 的属性。上位机项目中最常见的需求：让主控面板一启动就铺满屏幕（WindowState=Maximized）、让报警弹窗始终在最前面（Topmost=True）、或者让参数设置窗口固定大小不让用户拉大（ResizeMode=CanMinimize）。

> [!def] 官方定义
> Window 类是 WPF 中所有窗口的基类，继承自 `ContentControl`。其常用属性包括：`Title`（窗口标题）、`Width`/`Height`（尺寸）、`WindowState`（状态：Normal/Minimized/Maximized）、`WindowStyle`（边框样式：None/SingleBorderWindow/ToolWindow）、`ResizeMode`（缩放限制）、`Topmost`（置顶）、`ShowInTaskbar`（任务栏显示）、`Icon`（图标）、`AllowsTransparency`（透明支持）、`SizeToContent`（自动适应内容尺寸）、`WindowStartupLocation`（启动位置）。

> [!origin] 由来背景
> 在 WinForms 中，窗口属性分散在 `Form` 类的几十个 bool/int/enum 属性中，查找不方便。WPF 将窗口属性做了一次整理和统一，并增加了新的能力——如 `AllowsTransparency` 允许窗口完全自定义外观（制作无边框圆角窗口）、`SizeToContent` 让窗口根据内容自动调整大小。同时引入 WPF 单位（1/96 英寸），天然支持高 DPI 缩放。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - **Title**：窗口标题，显示在标题栏中，上位机常见做法是动态更新标题为"系统名 + 当前时间"
> - **WindowState**：Normal（正常）/ Minimized（最小化）/ Maximized（最大化），出厂全屏的工控机常用 Maximized
> - **WindowStyle**：None 表示无边框，配合 AllowsTransparency 可做自定义形状窗口；ToolWindow 是工具小窗风格
> - **ResizeMode**：CanMinimize（只能最小化，不能拉大）、CanResizeWithGrip（右下角有拖拽把手）、NoResize（固定大小）
> - **Topmost**：设为 true 时窗口始终在顶层——适合报警弹窗、全局快捷键提示窗口
> - **SizeToContent**：窗口根据内部内容自动调整宽高，设定参数窗口常用

> [!example] 完整示例
> 演示 Window 各项属性的组合使用——一个上位机项目中的"主窗口 + 报警弹窗"。
>
> 主窗口——全屏无边框工控风格：
>
> ```xml
> <!-- MainWindow.xaml -->
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="HMI 监控系统 v1.0"
>         Height="600" Width="900"
>         WindowState="Maximized"
>         WindowStyle="None"
>         AllowsTransparency="True"
>         Background="Transparent"
>         ResizeMode="CanMinimize"
>         WindowStartupLocation="CenterScreen"
>         Icon="/Assets/app.ico">
>     <!-- 无边框窗口需要自己画标题栏 -->
>     <Border CornerRadius="0" Background="#0D1117">
>         <Grid>
>             <Grid.RowDefinitions>
>                 <RowDefinition Height="36"/>
>                 <RowDefinition Height="*"/>
>             </Grid.RowDefinitions>
>             <!-- 自定义标题栏 -->
>             <Border Grid.Row="0" Background="#161B22"
>                     MouseLeftButtonDown="TitleBar_MouseDown">
>                 <Grid>
>                     <TextBlock Text="HMI 监控系统 v1.0" Foreground="#FF6B35"
>                                FontWeight="Bold" VerticalAlignment="Center"
>                                Margin="12,0,0,0"/>
>                     <StackPanel Orientation="Horizontal"
>                                 HorizontalAlignment="Right">
>                         <Button Content="_" Width="36" Height="28"
>                                 Click="BtnMinimize_Click"
>                                 Foreground="#C9D1D9" Background="Transparent"/>
>                         <Button Content="X" Width="36" Height="28"
>                                 Click="BtnClose_Click"
>                                 Foreground="#C9D1D9" Background="Transparent"/>
>                     </StackPanel>
>                 </Grid>
>             </Border>
>             <!-- 主内容区 -->
>             <Border Grid.Row="1" Margin="12">
>                 <Grid>
>                     <StackPanel VerticalAlignment="Center">
>                         <TextBlock Text="设备状态监控" FontSize="24"
>                                    FontWeight="Bold" Foreground="#FF6B35"/>
>                         <TextBlock x:Name="txtTime"
>                                    Foreground="#8B949E" FontSize="14"
>                                    Margin="0,8,0,0"/>
>                     </StackPanel>
>                     <Button x:Name="btnAlarm" Content="触发报警弹窗"
>                             Width="140" Height="36"
>                             Click="BtnAlarm_Click"
>                             HorizontalAlignment="Right"
>                             VerticalAlignment="Bottom"
>                             Background="#DA3633" Foreground="White" Cursor="Hand">
>                         <Button.Template>
>                             <ControlTemplate TargetType="Button">
>                                 <Border CornerRadius="6" Background="#DA3633">
>                                     <ContentPresenter HorizontalAlignment="Center"
>                                                       VerticalAlignment="Center"/>
>                                 </Border>
>                             </ControlTemplate>
>                         </Button.Template>
>                     </Button>
>                 </Grid>
>             </Border>
>         </Grid>
>     </Border>
> </Window>
> ```
>
> ```csharp
> // MainWindow.xaml.cs
> using System.Windows;
> using System.Windows.Input;
> using System.Windows.Threading;
>
> namespace HmiDemo;
>
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>         // 实时更新标题栏时间
>         var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>         timer.Tick += (s, e) =>
>         {
>             Title = $"HMI 监控系统 v1.0 - {DateTime.Now:yyyy-MM-dd HH:mm:ss}";
>             txtTime.Text = $"系统时间：{DateTime.Now:HH:mm:ss}";
>         };
>         timer.Start();
>     }
>
>     private void TitleBar_MouseDown(object sender, MouseButtonEventArgs e)
>     {
>         if (e.LeftButton == MouseButtonState.Pressed)
>             DragMove(); // 无边框窗口的拖拽移动
>     }
>
>     private void BtnMinimize_Click(object sender, RoutedEventArgs e)
>         => WindowState = WindowState.Minimized;
>
>     private void BtnClose_Click(object sender, RoutedEventArgs e)
>         => Application.Current.Shutdown();
>
>     private void BtnAlarm_Click(object sender, RoutedEventArgs e)
>     {
>         // 打开报警弹窗——Topmost=true 确保在最前
>         var alarm = new AlarmWindow
>         {
>             Owner = this,
>             WindowStartupLocation = WindowStartupLocation.CenterOwner
>         };
>         alarm.Show();
>     }
> }
> ```
>
> 报警弹窗——置顶 + 固定尺寸，不能缩放：
>
> ```xml
> <!-- AlarmWindow.xaml -->
> <Window x:Class="HmiDemo.AlarmWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="⚠ 报警信息"
>         Width="380" Height="240"
>         ResizeMode="NoResize"
>         Topmost="True"
>         WindowStyle="ToolWindow"
>         WindowStartupLocation="CenterOwner"
>         ShowInTaskbar="False"
>         Background="#0D1117">
>     <Grid Margin="20">
>         <StackPanel VerticalAlignment="Center">
>             <TextBlock Text="⚠ 设备报警" FontSize="20" FontWeight="Bold"
>                        Foreground="#F85149" Margin="0,0,0,12"/>
>             <TextBlock x:Name="txtAlarmMsg"
>                        Text="反应釜温度超过上限（> 150°C）"
>                        Foreground="#C9D1D9" FontSize="14"
>                        TextWrapping="Wrap" Margin="0,0,0,16"/>
>             <Button Content="确认并关闭" Height="36"
>                     Click="BtnConfirm_Click"
>                     Background="#FF6B35" Foreground="White" Cursor="Hand"
>                     HorizontalAlignment="Center" Width="120">
>                 <Button.Template>
>                     <ControlTemplate TargetType="Button">
>                         <Border CornerRadius="6" Background="#FF6B35">
>                             <ContentPresenter HorizontalAlignment="Center"
>                                               VerticalAlignment="Center"/>
>                         </Border>
>                     </ControlTemplate>
>                 </Button.Template>
>             </Button>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // AlarmWindow.xaml.cs
> public partial class AlarmWindow : Window
> {
>     public AlarmWindow() => InitializeComponent();
>     private void BtnConfirm_Click(object sender, RoutedEventArgs e) => Close();
> }
> ```

> [!scene] 适用场景
> ✅ WindowState=Maximized——工控机全屏运行的主控界面
> ✅ Topmost=True——报警弹窗、全局快捷键提示、浮动工具栏
> ✅ ResizeMode=CanMinimize——日常操作界面，允许最小化但不允许随意拉伸破坏布局
> ✅ WindowStyle=None + AllowsTransparency=True——完全自定义外观（圆角窗口、异形窗口）
> ✅ SizeToContent=WidthAndHeight——根据内容自动调整大小的参数对话框
> ❌ 无特别需求时使用默认属性值即可，不必逐个设置

> [!pitfall] 常见踩坑
> 坑 1：**无边框窗口（WindowStyle=None）忘了处理拖拽和关闭** → 用户无法移动窗口也没法关。解决办法：在标题栏区域绑定 `MouseLeftButtonDown` 事件调用 `DragMove()`，自己画最小化/关闭按钮
> 
> 坑 2：**AllowsTransparency=True 导致性能下降** → 开启透明后 WPF 渲染引擎退化为软件渲染（部分场景），动画可能变卡。仅在确实需要透明效果时才开启
>
> 坑 3：**ResizeMode=NoResize 但窗口内容没做溢出处理** → 如果用户把系统字体调成 150%，固定尺寸的窗口可能装不下内容。用 ScrollViewer 包裹，或者设置 MinWidth/MinHeight 而非硬编码 Width/Height

> [!best] 最佳实践
> - 无边框全屏窗口用 `WindowStyle="None"` + `WindowState="Maximized"` + `AllowsTransparency="True"` + `Background="Transparent"` 组合
> - ShowInTaskbar="False" 给弹窗/工具窗，避免任务栏图标过多
> - 重要的工控主窗口设置 `ResizeMode="CanMinimize"` 或 `"NoResize"`，防止用户拉伸后布局变形
> - WindowStartupLocation="CenterScreen"（主窗口）或 "CenterOwner"（子窗口），确保窗口不出现在奇怪的位置

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建项目并运行上面的主窗口+报警弹窗代码，体验无边框全屏风格，观察报警弹窗的置顶效果
> **Lv.2 小试牛刀**：给主窗口添加一个"退出全屏"按钮，点击后 `WindowState` 从 Maximized 切换为 Normal，SizeToContent 设为 Manual，让窗口回到 900x600
> **Lv.3 融会贯通**：实现窗口的"最大化→还原"动画切换效果——用 DoubleAnimation 平滑过渡 Width 和 Height（而不是瞬间切换 WindowState）

> [!related] 相关知识链接
> - ← 前置知识：App.xaml 的 StartupUri（主窗口的创建入口）
> - → 后续必学：Window 常用方法（Show、ShowDialog 等）（属性的配置最终通过方法来展现窗口）
> - → 后续必学：Window 常用事件（Loaded、Closing 等）（在窗口的关键时刻响应属性变化）
> - → 后续必学：窗口传值与数据交互（跨窗口时属性的角色）
> - ⇄ 关联概念：依赖属性系统、DpiDecorator 高 DPI 适配
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.window
