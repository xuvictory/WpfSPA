---
title: Application.Current 全局访问
section: 01-quickstart
parent: 1.3 应用程序生命周期
---

# Application.Current 全局访问

> [!plain] 白话理解
> `Application.Current` 就像是整栋大楼的"广播喇叭"——无论在哪个房间（窗口），你都可以通过它听到整栋楼的通知，或者对整栋楼喊话。你在 Deep 嵌套的某个 UserControl 里想关掉整个程序？`Application.Current.Shutdown()`。想在所有窗口共享一个数据对象？`(App)Application.Current`.SharedData。不需要一层层往上找 parent，直接全局直达。

> [!def] 官方定义
> `Application.Current` 是 `Application` 类的一个静态属性（static property），返回当前 `AppDomain` 中唯一的 `Application` 实例。通过它可以访问应用程序级别的所有资源、属性、方法、窗口集合，是实现跨窗口通信和全局状态管理的基础设施。

> [!origin] 由来背景
> 在 WinForms 中，"获取当前应用"的方式很不统一——有时用 `Application.OpenForms`、有时用自定义的 `Program.MainForm`，而且这些 API 分散在框架各处。WPF 的设计者将所有全局访问点统一到 `Application.Current` 这一个静态属性上，无论你在程序的哪个角落，都能用同一种方式获取同一个 Application 实例。这是"单一入口原则"在框架设计中的体现。

> 本章节背景：WPF 快速入门让你快速领略 WPF 的魅力。本章节目的不是深入理解每个概念，而是建立感性认知。

> [!essentials] 核心要点
> - `Application.Current` 返回当前进程唯一的 Application 实例（`AppDomain` 级别单例）
> - 通过它可以访问：`MainWindow`（主窗口）、`Windows`（所有打开窗口）、`Resources`（全局资源）、`ShutdownMode`
> - 可以调用：`Shutdown()`（退出）、`Shutdown(int exitCode)`（带退出码）
> - 可以强制转换为自己定义的 App 子类：`(App)Application.Current` 来访问自定义属性/方法
> - 在非 UI 线程上访问时 `Application.Current` 可能为 null——后台线程操作需要先判断

> [!example] 完整示例
> 演示 Application.Current 的多种使用场景——跨窗口通信、全局资源访问、快捷退出。
>
> ```xml
> <!-- App.xaml -->
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <SolidColorBrush x:Key="PrimaryBrush" Color="#FF6B35"/>
>         <SolidColorBrush x:Key="DangerBrush" Color="#F85149"/>
>     </Application.Resources>
> </Application>
> ```
>
> ```csharp
> // App.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class App : Application
> {
>     // 全局共享数据——通过 (App)Application.Current 访问
>     public string OperatorName { get; set; } = "未登录";
>     public DateTime LoginTime { get; set; }
>     public bool IsAdmin { get; set; }
> }
> ```
>
> MainWindow 中展示多种用法：
>
> ```xml
> <!-- MainWindow.xaml -->
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Application.Current 演示" Height="420" Width="550"
>         Background="#0D1117">
>     <Grid Margin="20">
>         <StackPanel VerticalAlignment="Center">
>             <TextBlock Text="Application.Current 全局访问" FontSize="20" 
>                        FontWeight="Bold" Foreground="#FF6B35" Margin="0,0,0,16"/>
>            
>             <!-- 使用全局资源的按钮 -->
>             <Button Content="使用全局资源（颜色）" Height="40"
>                     Background="{StaticResource PrimaryBrush}"
>                     Foreground="White" Cursor="Hand" Margin="0,4"/>
>            
>             <Border CornerRadius="8" Background="#161B22" Padding="16" Margin="0,12">
>                 <StackPanel>
>                     <TextBlock x:Name="txtInfo" Foreground="#C9D1D9" FontSize="14"/>
>                     <TextBlock x:Name="txtWindows" Foreground="#8B949E" FontSize="12" 
>                                Margin="0,8,0,0"/>
>                 </StackPanel>
>             </Border>
>
>             <StackPanel Orientation="Horizontal" 
>                         HorizontalAlignment="Center" Margin="0,12,0,0">
>                 <Button Content="打开新窗口" Width="110" Height="36"
>                         Click="BtnOpenWindow_Click"
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
>                 <Button Content="关闭所有窗口" Width="110" Height="36"
>                         Click="BtnCloseAll_Click" Margin="12,0,0,0"
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
> // MainWindow.xaml.cs
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo;
>
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>         Loaded += (s, e) => RefreshInfo();
>     }
>
>     private void BtnOpenWindow_Click(object sender, RoutedEventArgs e)
>     {
>         // 创建新窗口并添加到 Application.Windows 集合
>         var child = new ChildWindow();
>         child.Show();
>         RefreshInfo();
>     }
>
>     private void BtnCloseAll_Click(object sender, RoutedEventArgs e)
>     {
>         // 方法1：直接关闭整个应用
>         // Application.Current.Shutdown();
>        
>         // 方法2：只关闭所有子窗口，保留主窗口
>         var windows = Application.Current.Windows;
>         for (int i = windows.Count - 1; i >= 0; i--)
>         {
>             if (windows[i] != Application.Current.MainWindow)
>             {
>                 (windows[i] as Window)?.Close();
>             }
>         }
>         RefreshInfo();
>     }
>
>     private void RefreshInfo()
>     {
>         // 获取自定义 App 实例
>         var app = (App)Application.Current;
>        
>         // 统计打开的窗口
>         int windowCount = Application.Current.Windows.Count;
>        
>         // 访问全局资源
>         var primaryBrush = (SolidColorBrush)Application.Current
>             .Resources["PrimaryBrush"];
>        
>         txtInfo.Text = $"登录用户：{app.OperatorName}\n" +
>                        $"登录时间：{app.LoginTime:HH:mm:ss}\n" +
>                        $"管理员权限：{(app.IsAdmin ? "是" : "否")}";
>        
>         txtWindows.Text = $"当前打开窗口数：{windowCount} | " +
>                           $"主窗口标题：{Application.Current.MainWindow?.Title} | " +
>                           $"全局主色：{primaryBrush.Color}";
>     }
> }
> ```
>
> 子窗口中也能同样访问：
>
> ```csharp
> // ChildWindow.xaml.cs
> public ChildWindow()
> {
>     InitializeComponent();
>    
>     // 在子窗口中也能通过 Application.Current 访问全局信息
>     var app = (App)Application.Current;
>     Title = $"子窗口 - {app.OperatorName}";
>    
>     // 子窗口中关闭主程序
>     // Application.Current.Shutdown();
>    
>     // 获取主窗口引用
>     var main = Application.Current.MainWindow;
>     if (main is MainWindow mw)
>     {
>         // 可以调用主窗口的公共方法
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 全局状态共享——当前登录用户、系统配置、语言设置等放在 App 类中，任何地方用 `(App)Application.Current` 读取
> ✅ 全局资源访问——颜色、画笔、样式等定义在 App.xaml Resources 中，用 `Application.Current.Resources["key"]` 获取
> ✅ 窗口管理——`Application.Current.Windows` 获取所有打开窗口、`MainWindow` 获取主窗口
> ✅ 快捷退出——任何嵌套控件的 Click 事件中都可以 `Application.Current.Shutdown()`
> ❌ 后台非 UI 线程访问——`Application.Current` 可能为 null，必须先判空

> [!pitfall] 常见踩坑
> 坑 1：**在后台线程中访问 Application.Current 为 null** → `Application.Current` 是线程静态的，只有 UI 线程上才有值。后台线程需要用 `Application.Current.Dispatcher.Invoke()` 调度到 UI 线程
> 
> 坑 2：**滥用 Application.Current 做全局数据总线** → 把几十个变量都扔到 App 类中，代码耦合度飙升。应该只在真正"全局共享"的数据上使用，优先考虑依赖注入而非全局变量
>
> 坑 3：**Application.Current.Windows 返回的是实时集合** → 遍历 Windows 集合时如果同时有窗口被关闭（如另一个线程触发了 Close），会抛 `InvalidOperationException`。解决办法：用 for 倒序遍历，或者先 `.Cast<Window>().ToList()` 拷贝一份

> [!best] 最佳实践
> - 全局数据放在 App 类中时，用属性封装（get/set），不要直接暴露 public 字段
> - 对 `Application.Current` 的访问封装成辅助方法，如 `App.CurrentApp`，这样单元测试时可以 mock
> - 不要在 UserControl 的构造函数中访问 `Application.Current`——UserControl 可能在设计时被加载（VS 设计器），此时没有 Application 实例
> - 自定义 App 类用 partial class 分离全局数据和全局方法：`App.cs`（数据）+ `App.Events.cs`（事件）+ `App.Log.cs`（日志）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行上面的示例代码，点击"打开新窗口"多次，观察窗口计数变化。在子窗口中调用 `Application.Current.Shutdown()` 验证退出效果
> **Lv.2 小试牛刀**：在 App 类中添加一个 `ThemeColor` 属性，MainWindow 中用一个按钮切换"橙色主题"和"蓝色主题"，所有子窗口也从 `(App)Application.Current.ThemeColor` 读取并实时更新
> **Lv.3 融会贯通**：实现一个"全局通知系统"——App 类中定义 `event Action<string> GlobalNotification`，任何窗口都可以订阅或发布通知，实现跨窗口的消息传递

> [!related] 相关知识链接
> - ← 前置知识：Application 类详解（理解 Application 类的全部功能）
> - ← 前置知识：应用程序事件（Startup、Exit 等）（理解 Application 的生命周期）
> - → 后续必学：ShutdownMode 属性（控制 Shutdown() 的行为）
> - → 后续必学：窗口传值与数据交互（相比 Application.Current，更优雅的跨窗口通信方式）
> - ⇄ 关联概念：Dispatcher.Invoke（线程调度）、依赖注入容器、MVVM 的 Messenger/EventAggregator
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.application.current
