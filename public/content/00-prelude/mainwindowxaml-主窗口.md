---
title: MainWindow.xaml 主窗口
section: 00-prelude
parent: WPF 项目创建
---

# MainWindow.xaml 主窗口

> [!plain] 白话理解
> `MainWindow.xaml` 就是你的上位机程序的「主屏」——操作员一打开程序看到的就是它。所有的控制按钮、数据表格、报警列表、设备状态指示灯全都画在这个窗口里。它由两部分文件组成：`.xaml` 文件负责「长什么样」（布局+外观），`.xaml.cs` 文件负责「干什么事」（按钮点击、数据处理、通讯逻辑）。两边是同一个类（`partial class`），编译器会把它们合二为一。

> [!def] 官方定义
> `MainWindow` 是继承自 `System.Windows.Window` 的 partial 类。`MainWindow.xaml` 使用 XAML 标记语言声明窗口的 UI 元素和布局；`MainWindow.xaml.cs` 是代码隐藏文件（code-behind），包含事件处理程序、业务逻辑和与界面交互的 C# 代码。两个文件通过 `x:Class` 属性和 `partial` 关键字关联，编译时由 MSBuild 的 XAML 编译任务合并生成完整的类定义。

> [!origin] 由来背景
> Windows 编程从 Win32 API（纯 C 写 `CreateWindowEx`）→ MFC（C++ 框架）→ WinForms（C# 拖控件）→ WPF（XAML + C#），窗口的定义方式越来越声明式。WPF 的 `Window` 类从 WinForms 的 `Form` 演化而来，但做了根本性的架构变革：不再用固定像素坐标定位控件，而是用可伸缩的布局容器（Grid/StackPanel/DockPanel）；不再直接绘制 GDI+ 图形，而是通过 DirectX 渲染。XAML + code-behind 的分离也是从 ASP.NET WebForms 借鉴的思想，把「长相」和「行为」解耦。

> [!essentials] 核心要点

> **Window 类最重要的属性**（在设计时就能设）：

> | 属性 | 类型 | 说明 | 上位机推荐值 |
> |------|------|------|-------------|
> | `Title` | string | 窗口标题栏文字 | "PLC 监控系统 V1.0" |
> | `Height` / `Width` | double | 窗口初始宽高 | 1024x768 或 1280x800 |
> | `MinHeight` / `MinWidth` | double | 最小尺寸（防止缩太小） | 800x600 |
> | `WindowStartupLocation` | enum | 启动位置 | `CenterScreen`（屏幕居中） |
> | `WindowState` | enum | 窗口状态 | `Normal` / `Maximized` / `Minimized` |
> | `ResizeMode` | enum | 可否拖拽改变大小 | `CanResize` / `CanResizeWithGrip` |
> | `WindowStyle` | enum | 标题栏风格 | `SingleBorderWindow` / `None`（无边框） |
> | `Topmost` | bool | 是否置顶 | `true`（上位机常置顶） |
> | `Icon` | ImageSource | 窗口图标 | `Resources/app.ico` |
> | `Background` | Brush | 窗口背景色 | 浅灰 `#f0f0f0` |

> **Window 生命周期事件**：

> | 事件 | 触发时机 | 上位机用途 |
> |------|---------|-----------|
> | `Loaded` | 窗口加载完成（控件可用） | 初始化数据、启动轮询定时器 |
> | `ContentRendered` | 内容首次渲染完成 | 开始播放动画 |
> | `Activated` / `Deactivated` | 获得/失去焦点 | 暂停/恢复界面刷新（省资源） |
> | `Closing` | 用户点击 X 准备关闭 | 弹出「是否保存」确认框 |
> | `Closed` | 窗口已关闭 | 清理定时器、释放资源 |

> [!example] 完整示例
>
> ```xml
> <!-- MainWindow.xaml — 上位机主窗口完整布局 -->
> <Window x:Class="PlcMonitor.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="PLC 设备监控系统 V1.0"
>         Height="700" Width="1100"
>         MinHeight="500" MinWidth="800"
>         WindowStartupLocation="CenterScreen"
>         WindowState="Normal"
>         ResizeMode="CanResizeWithGrip"
>         Icon="Resources/app.ico"
>         Background="#f5f5f5"
>         Closing="Window_Closing">
>     
>     <Grid Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         
>         <!-- 顶部：工具栏 -->
>         <Border Grid.Row="0" Background="White" CornerRadius="6" 
>                 Padding="10" Margin="0,0,0,8"
>                 BorderBrush="#e0e0e0" BorderThickness="1">
>             <StackPanel Orientation="Horizontal">
>                 <Button Content="连接设备" Click="BtnConnect_Click" 
>                         Background="#0078D4" Foreground="White"/>
>                 <Button Content="断开连接" Click="BtnDisconnect_Click"/>
>                 <Separator Width="20"/>
>                 <TextBlock Text="设备：" VerticalAlignment="Center" Margin="0,0,5,0"/>
>                 <ComboBox x:Name="CmbDevice" Width="120">
>                     <ComboBoxItem>PLC-01</ComboBoxItem>
>                     <ComboBoxItem>PLC-02</ComboBoxItem>
>                 </ComboBox>
>             </StackPanel>
>         </Border>
>         
>         <!-- 中间：主内容区（占位，实际项目放 DataGrid/图表等） -->
>         <Border Grid.Row="1" Background="White" CornerRadius="6" Padding="10"
>                 BorderBrush="#e0e0e0" BorderThickness="1">
>             <TextBlock Text="主监控区域（数据表格、图表、报警列表在此）"
>                        FontSize="16" Foreground="Gray"
>                        HorizontalAlignment="Center" VerticalAlignment="Center"/>
>         </Border>
>         
>         <!-- 底部：状态栏 -->
>         <StatusBar Grid.Row="2" Background="White" Margin="0,8,0,0"
>                    BorderBrush="#e0e0e0" BorderThickness="1">
>             <StatusBarItem>
>                 <StackPanel Orientation="Horizontal">
>                     <TextBlock x:Name="TxtStatus" Text="● 未连接"/>
>                     <Separator Width="20"/>
>                     <TextBlock x:Name="TxtTime" Text="2024-01-01 00:00:00"/>
>                 </StackPanel>
>             </StatusBarItem>
>         </StatusBar>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // MainWindow.xaml.cs — 窗口逻辑
> using System;
> using System.Windows;
> using System.Windows.Threading;
> 
> namespace PlcMonitor
> {
>     public partial class MainWindow : Window
>     {
>         private DispatcherTimer _clockTimer;   // 时钟刷新定时器
>         private bool _isConnected = false;
> 
>         public MainWindow()
>         {
>             InitializeComponent();  // 这行绝对不能删！它把 XAML 控件初始化
>         }
> 
>         private void Window_Loaded(object sender, RoutedEventArgs e)
>         {
>             // 窗口加载完后启动时钟
>             _clockTimer = new DispatcherTimer
>             {
>                 Interval = TimeSpan.FromSeconds(1)
>             };
>             _clockTimer.Tick += (s, args) =>
>             {
>                 TxtTime.Text = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
>             };
>             _clockTimer.Start();
>             TxtStatus.Text = "● 未连接";
>         }
> 
>         private void BtnConnect_Click(object sender, RoutedEventArgs e)
>         {
>             _isConnected = true;
>             TxtStatus.Text = "● 已连接";
>         }
> 
>         private void BtnDisconnect_Click(object sender, RoutedEventArgs e)
>         {
>             _isConnected = false;
>             TxtStatus.Text = "● 未连接";
>         }
> 
>         private void Window_Closing(object sender, 
>                                     System.ComponentModel.CancelEventArgs e)
>         {
>             if (_isConnected)
>             {
>                 var result = MessageBox.Show("设备仍在连接中，确定要退出吗？", 
>                                              "确认退出", MessageBoxButton.YesNo,
>                                              MessageBoxImage.Question);
>                 if (result == MessageBoxResult.No)
>                 {
>                     e.Cancel = true;  // 取消关闭
>                 }
>             }
>             _clockTimer?.Stop();
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 所有 WPF 上位机程序的唯一或主要窗口
> ✅ 设备监控主屏：全屏显示设备运行状态、报警信息
> ✅ 多窗口应用：MainWindow 是入口，从它打开配置窗口、历史数据窗口等子窗口
> ❌ 简单弹窗（如配置对话框）——应该用单独的 `Window` 而不要往 MainWindow 上堆

> [!pitfall] 常见踩坑
> 坑 1：**删掉了 `InitializeComponent()` 方法调用** → 编译能过，但运行时所有 XAML 中声明的控件全部为 `null`，一访问就 `NullReferenceException`。`InitializeComponent()` 就是「把 XAML 中声明的控件创建出来并赋值给对应的字段」的方法，绝对不要删。
>
> 坑 2：**在构造函数里访问 XAML 控件（如 `TxtStatus.Text = "xxx"`）** → `InitializeComponent()` 执行之前，所有控件都是 `null`。如果你把控件访问写在构造函数的 `InitializeComponent()` 之前，必定 NullReferenceException。**解决方案**：控件初始化逻辑放在 `Loaded` 事件中，此时所有控件已构造完毕。
>
> 坑 3：**窗口运行时位置不在屏幕中央** → `WindowStartupLocation="CenterScreen"` 是控制「首次显示」的位置。如果你运行后拖动窗口、关闭、再打开，位置是上次关闭的位置（WPF 不会自动记住）。**解决方案**：需要记忆窗口位置的话，在 `OnExit` 中把 `Left`、`Top`、`Width`、`Height` 写入配置文件，在构造函数中读回。

> [!best] 最佳实践
> - `Loaded` 事件是初始化起点：不要往构造函数里塞业务逻辑，全部放 `Loaded` 事件中
> - `Closing` 事件是安全退出的最后防线：检查未保存数据、确认是否真要退出、释放非托管资源
> - 窗口尺寸用 `MinHeight/MinWidth` 兜底：上位机界面在低分辨率屏幕上（如工控机的 1024x768）不能缩太小导致控件不可见
> - 一个主窗口拆分成多个 UserControl：不要把几百行 XAML 全部堆在 MainWindow 里，用 `<local:DevicePanel/>` 这样的 UserControl 拆分模块
> - 用 `DispatcherTimer` 而不是 `System.Timers.Timer` 做 UI 更新：DispatcherTimer 的回调在 UI 线程执行，可以安全地更新控件

> [!practice] 上手练习
> **Lv.1 照猫画虎**：新建 WPF 项目，把上述 MainWindow.xaml 和 MainWindow.xaml.cs 的完整示例代码替换到你的项目中。运行，测试：点击连接/断开按钮观察状态变化、拖动窗口大小验证最小尺寸限制、点击 X 关闭按钮验证确认对话框。
>
> **Lv.2 小试牛刀**：给状态栏加一个时钟（每秒钟刷新）。在窗口右下角加一个始终置顶的「紧急停止」按钮（红色背景、白色文字），点击后弹窗提示「紧急停止信号已发送到 PLC」。
>
> **Lv.3 融会贯通**：设计一个完整的上位机主窗口框架（不需要实际通讯功能）：顶部菜单栏（文件/视图/帮助）、左侧设备树（TreeView）、中间主监控区（TabControl 切换不同页面）、底部状态栏（设备总数、报警数量、通讯状态、时钟）。要求窗口标题栏显示「[未连接] 监控系统」或「[COM3] 监控系统」根据连接状态动态变化。

> [!related] 相关知识链接
> - ← App.xaml 应用程序入口——StartupUri 指向的就是 MainWindow
> - ⇄ WPF App 项目模板——模板帮你自动生成初始 MainWindow
> - → WPF 布局系统——Grid、StackPanel 等容器的深入使用
> - → MVVM 模式——把 MainWindow 的后台逻辑迁移到 ViewModel
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.window
