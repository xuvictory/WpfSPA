---
title: ShutdownMode 属性
section: 01-quickstart
parent: 1.3 应用程序生命周期
---

# ShutdownMode 属性

> [!plain] 白话理解
> 假设你的 WPF 程序同时打开了三个窗口：主控面板、数据曲线、报警列表。用户把主控面板关了——程序该退出吗？还是等所有窗口都关了才退出？`ShutdownMode` 就是用来回答这个问题的。它像一个"下班规则"：主窗口关了就算下班（OnMainWindowClose）、最后一个窗口关了才下班（OnLastWindowClose）、或者老板喊了才能下班（OnExplicitShutdown——只响应代码中的 Shutdown() 调用）。

> [!def] 官方定义
> `ShutdownMode` 是 `Application` 类的枚举属性，取值为 `ShutdownMode` 枚举：`OnLastWindowClose`（默认值——所有窗口关闭时退出）、`OnMainWindowClose`（主窗口关闭时退出）、`OnExplicitShutdown`（仅由代码调用 `Shutdown()` 退出）。它在 App.xaml 中通过 `ShutdownMode="值"` 设定，或通过代码 `Application.Current.ShutdownMode` 设置。

> [!origin] 由来背景
> WPF 默认行为是"最后一个窗口关闭时退出"——这是参考了大多数 Windows 应用的惯例（如 Word、Excel）。但上位机场景有所不同：很多时候主控面板一直在后台运行（甚至隐藏到托盘），用户只是关掉了某个数据查看窗口，不应该整个程序都退出。微软提供了三种退出模式，覆盖了从"简单工具"到"常驻服务型桌面应用"的所有需求。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - **OnLastWindowClose**（默认）：所有通过 `Show()` 打开的窗口关闭后，应用自动退出
> - **OnMainWindowClose**：`Application.MainWindow` 关闭时应用退出，不管其他子窗口是否还开着
> - **OnExplicitShutdown**：必须手动调用 `Application.Current.Shutdown()` 才能退出——适合需要一直运行的后台服务型桌面应用
> - 可以在运行时动态修改：`Application.Current.ShutdownMode = ShutdownMode.OnExplicitShutdown;`
> - `ShowDialog()` 打开的模态窗口不影响 ShutdownMode——它们不归 ShutdownMode 管

> [!example] 完整示例
> 演示三种 ShutdownMode 的行为差异。
>
> ```xml
> <!-- App.xaml -->
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="ShutdownModeDemo.xaml"
>              ShutdownMode="OnLastWindowClose">
>     <!-- 默认模式，可改为 OnMainWindowClose 或 OnExplicitShutdown 测试 -->
> </Application>
> ```
>
> ```xml
> <!-- ShutdownModeDemo.xaml -->
> <Window x:Class="HmiDemo.ShutdownModeDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ShutdownMode 演示 - 主窗口" Height="400" Width="560"
>         Background="#0D1117"
>         Closing="Window_Closing">
>     <Grid Margin="20">
>         <StackPanel VerticalAlignment="Center">
>             <TextBlock Text="⚙ ShutdownMode 行为演示" FontSize="20" 
>                        FontWeight="Bold" Foreground="#FF6B35" Margin="0,0,0,16"/>
>            
>             <!-- 当前模式显示 -->
>             <Border CornerRadius="8" Background="#161B22" Padding="16">
>                 <StackPanel>
>                     <TextBlock x:Name="txtMode" Foreground="#3FB950" FontSize="14" 
>                                FontWeight="Bold"/>
>                     <TextBlock x:Name="txtDescription" Foreground="#8B949E" 
>                                FontSize="12" TextWrapping="Wrap" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </Border>
>
>             <!-- 窗口计数 -->
>             <Border CornerRadius="8" Background="#161B22" Padding="16" Margin="0,12">
>                 <StackPanel>
>                     <TextBlock x:Name="txtWindowCount" Foreground="#C9D1D9" 
>                                FontSize="14"/>
>                     <TextBlock x:Name="txtMainWindowStatus" Foreground="#8B949E" 
>                                FontSize="12" Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>
>             <!-- 操作按钮 -->
>             <StackPanel Orientation="Horizontal" 
>                         HorizontalAlignment="Center" Margin="0,12,0,0">
>                 <Button x:Name="btnOpenChild" Content="打开子窗口" 
>                         Width="110" Height="36" Click="BtnOpenChild_Click"
>                         Background="#FF6B35" Foreground="White" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="6" Background="#FF6B35">
>                                 <ContentPresenter HorizontalAlignment="Center" 
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>                 <Button x:Name="btnSwitchMode" Content="切换退出模式" 
>                         Width="110" Height="36" Click="BtnSwitchMode_Click"
>                         Margin="12,0,0,0"
>                         Background="#21262D" Foreground="#C9D1D9" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="6" Background="#21262D"
>                                     BorderBrush="#30363D" BorderThickness="1">
>                                 <ContentPresenter HorizontalAlignment="Center" 
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>                 <Button x:Name="btnExplicitShutdown" Content="手动退出" 
>                         Width="110" Height="36" Click="BtnExplicitShutdown_Click"
>                         Margin="12,0,0,0"
>                         Background="#21262D" Foreground="#C9D1D9" Cursor="Hand">
>                     <Button.Template>
>                         <ControlTemplate TargetType="Button">
>                             <Border CornerRadius="6" Background="#21262D"
>                                     BorderBrush="#30363D" BorderThickness="1">
>                                 <ContentPresenter HorizontalAlignment="Center" 
>                                                   VerticalAlignment="Center"/>
>                             </Border>
>                         </ControlTemplate>
>                     </Button.Template>
>                 </Button>
>             </StackPanel>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // ShutdownModeDemo.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class ShutdownModeDemo : Window
> {
>     private int _childCount;
>
>     public ShutdownModeDemo()
>     {
>         InitializeComponent();
>         RefreshUI();
>     }
>
>     private void BtnOpenChild_Click(object sender, RoutedEventArgs e)
>     {
>         _childCount++;
>         var child = new Window
>         {
>             Title = $"子窗口 #{_childCount}",
>             Width = 300, Height = 200,
>             WindowStartupLocation = WindowStartupLocation.CenterOwner,
>             Owner = this
>         };
>         // 子窗口关闭时刷新计数
>         child.Closed += (s, args) => RefreshUI();
>         child.Show();
>         RefreshUI();
>     }
>
>     private void BtnSwitchMode_Click(object sender, RoutedEventArgs e)
>     {
>         // 循环切换三种模式
>         Application.Current.ShutdownMode = 
>             Application.Current.ShutdownMode switch
>         {
>             ShutdownMode.OnLastWindowClose => ShutdownMode.OnMainWindowClose,
>             ShutdownMode.OnMainWindowClose => ShutdownMode.OnExplicitShutdown,
>             ShutdownMode.OnExplicitShutdown => ShutdownMode.OnLastWindowClose,
>             _ => ShutdownMode.OnLastWindowClose
>         };
>         RefreshUI();
>     }
>
>     private void BtnExplicitShutdown_Click(object sender, RoutedEventArgs e)
>     {
>         // 手动调用退出——在任何模式下都有效
>         var result = MessageBox.Show("确认退出程序？", "退出确认",
>             MessageBoxButton.YesNo, MessageBoxImage.Question);
>         if (result == MessageBoxResult.Yes)
>             Application.Current.Shutdown();
>     }
>
>     private void Window_Closing(object sender, 
>         System.ComponentModel.CancelEventArgs e)
>     {
>         // 如果是主窗口关闭时（OnMainWindowClose 模式）
>         if (Application.Current.ShutdownMode == ShutdownMode.OnMainWindowClose
>             && Application.Current.Windows.Count > 1)
>         {
>             var r = MessageBox.Show("主窗口即将关闭，程序将退出。确认？",
>                 "警告", MessageBoxButton.YesNo, MessageBoxImage.Warning);
>             if (r == MessageBoxResult.No) e.Cancel = true;
>         }
>     }
>
>     private void RefreshUI()
>     {
>         int count = Application.Current.Windows.Count;
>         txtMode.Text = $"当前模式：{Application.Current.ShutdownMode}";
>         txtDescription.Text = Application.Current.ShutdownMode switch
>         {
>             ShutdownMode.OnLastWindowClose 
>                 => "所有窗口关闭后程序退出（默认）",
>             ShutdownMode.OnMainWindowClose 
>                 => "主窗口关闭即退出",
>             ShutdownMode.OnExplicitShutdown 
>                 => "必须手动调用 Shutdown() 才能退出（适合常驻托盘）",
>             _ => ""
>         };
>         txtWindowCount.Text = $"当前打开窗口数：{count}";
>         txtMainWindowStatus.Text = $"主窗口 IsLoaded: {Application.Current.MainWindow?.IsLoaded}";
>     }
> }
> ```

> [!scene] 适用场景
> ✅ OnLastWindowClose——标准桌面软件（如记事本、画图），所有窗口关了程序就退出
> ✅ OnMainWindowClose——主面板+多个浮窗，主面板关了就应该退出的场景
> ✅ OnExplicitShutdown——上位机守护进程、最小化到系统托盘的后台程序、常驻监控服务
> ✅ 动态切换——运行时把模式从 OnLastWindowClose 改为 OnExplicitShutdown（如用户点了"最小化到托盘"）

> [!pitfall] 常见踩坑
> 坑 1：**默认 OnLastWindowClose 时用户不小心关掉了最后一个子窗口** → 整个程序默默退出了。解决方案：关键的"不能关"的窗口用 `Hide()` 而不是 `Close()`，或者改为 OnExplicitShutdown 模式
> 
> 坑 2：**改为 OnExplicitShutdown 后忘了调用 Shutdown()** → 用户关闭所有窗口后，进程变成了"后台僵尸进程"（在任务管理器中能看到 exe 但看不见窗口）。解决：在最后一个窗口关闭时调用 `Application.Current.Shutdown()`
>
> 坑 3：**ShowDialog() 窗口不影响 ShutdownMode** → 即使所有 ShowDialog 窗口都已关闭，只要还有 Show() 的窗口开着，用 OnLastWindowClose 就不退出。这不是 Bug——模态窗口本来就不"计入"窗口集合的生存期统计

> [!best] 最佳实践
> - 上位机项目推荐默认模式 `OnExplicitShutdown`——关闭主窗口不代表停止数据采集，应该提供"最小化到托盘"或"确认退出"的机制
> - 在 App.xaml 中显式声明 ShutdownMode，不要依赖默认值——明确意图，团队成员不用猜
> - 需要"最小化到托盘"时，把主窗口 Close 替换为 Hide，同时设 ShutdownMode = OnExplicitShutdown，托盘菜单中提供"退出"选项调用 Shutdown()
> - OnMainWindowClose 模式配合 Closing 事件做二次确认（如"还有未保存的配置"）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的示例代码，分别尝试三种 ShutdownMode——打开几个子窗口后关主窗口，观察程序行为差异
> **Lv.2 小试牛刀**：实现"最小化到系统托盘"——点击关闭按钮时窗口 Hide 而不是 Close，恢复时 Show 出来。ShutdownMode 动态切换为 OnExplicitShutdown
> **Lv.3 融会贯通**：结合 App.xaml 的 Startup 事件，根据命令行参数 `--minimize` 决定启动时的 ShutdownMode 和窗口状态，实现上位机的"开机自启最小化运行"

> [!related] 相关知识链接
> - ← 前置知识：Application 类详解（理解 Application 的所有属性和方法）
> - ← 前置知识：应用程序事件（Exit 事件的触发依赖于 ShutdownMode）
> - → 后续必学：单实例应用实现（配合 OnExplicitShutdown 实现常驻进程）
> - → 后续必学：Window 常用方法（Show/ShowDialog/Hide/Close 的行为）
> - ⇄ 关联概念：系统托盘（NotifyIcon）、窗口生命周期
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.application.shutdownmode
