---
title: Frame 页面框架
section: 04-controls
parent: 4.7 容器与分组控件
---

# Frame 页面框架

> [!plain] 白话理解
> Frame 就像上位机主界面的「页面放映机」：主窗口里嵌一块固定区域，往里面放哪个 Page，它就显示哪个页面，还能记住你刚才看过哪几页、允许返回和前进。和 TabControl 的「翻页」不同，Frame 是真正的「页面导航」——每个页面是独立的 Page 对象，有各自的代码逻辑，适合做多页面应用的主框架。

> [!def] 官方定义
> `Frame`（全限定名 `System.Windows.Controls.Frame`）是一个用于承载内容并支持页面导航的 `ContentControl`：通过 `Navigate(Uri)` / `Navigate(Page)` 加载页面，内部维护 `Journal`（导航历史），支持 `GoBack()` / `GoForward()` 前进后退，并提供 `NavigationService` 供页面内跳转使用。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.frame

> [!origin] 由来背景
> Frame 源自浏览器「内容区域 + 前进后退历史」的导航模型。WPF 在 .NET Framework 3.0 中引入 NavigationWindow 与 Frame，把浏览器式导航带进了桌面应用，配合 `Page` 类实现页面级路由。对于上位机这类「主框架固定、各功能页独立开发」的应用，Frame 让功能页可以单独编译、单独测试，主界面只负责挂载——这正是它区别于纯容器控件的关键价值。

> [!essentials] 核心要点
> - `Navigate(...)`：加载页面（传 Page 实例或 URI）
> - `GoBack()` / `GoForward()`：按 Journal 历史前进后退，调用前先判断 `CanGoBack` / `CanGoForward`
> - `Journal`：自动记录导航历史，默认开启
> - `Source` 属性：以 URI 形式指定当前页，可绑定
> - 页面内通过 `NavigationService` 发起跳转，可向目标页面传参

> [!example] 完整示例
> **多页面导航演示：Frame 承载不同 Page、Navigate 跳转、Journal 前进后退：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="导航 - Frame" Height="460" Width="640"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel>
>         <!-- 顶部导航按钮 -->
>         <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Margin="10">
>             <Button Content="首页" Click="OnHome" Padding="10,5" Margin="0,0,6,0"/>
>             <Button Content="设备监控" Click="OnMonitor" Padding="10,5" Margin="0,0,6,0"/>
>             <Button Content="数据报表" Click="OnReport" Padding="10,5" Margin="0,0,6,0"/>
>             <Button Content="返回" Click="OnBack" Padding="10,5" Margin="0,0,6,0"/>
>             <Button Content="前进" Click="OnForward" Padding="10,5"/>
>         </StackPanel>
>
>         <!-- Frame 承载被导航的 Page -->
>         <Frame x:Name="mainFrame" Margin="10" BorderBrush="#2A4A6C"
>                BorderThickness="1" Background="#161B22"/>
>     </DockPanel>
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
>             mainFrame.Navigate(new Page1()); // 启动时加载首页
>         }
>
>         private void OnHome(object sender, RoutedEventArgs e) => mainFrame.Navigate(new Page1());
>
>         private void OnMonitor(object sender, RoutedEventArgs e) => mainFrame.Navigate(new Page2());
>
>         private void OnReport(object sender, RoutedEventArgs e) => mainFrame.Navigate(new Page3());
>
>         // 前进/后退由 Frame 的导航历史（Journal）管理
>         private void OnBack(object sender, RoutedEventArgs e) => mainFrame.GoBack();
>
>         private void OnForward(object sender, RoutedEventArgs e) => mainFrame.GoForward();
>     }
>
>     // 三个简单 Page（真实项目各自独立文件）
>     public class Page1 : Page { public Page1() { Content = new TextBlock { Text = "首页：欢迎使用设备监控系统", Foreground = System.Windows.Media.Brushes.White }; } }
>     public class Page2 : Page { public Page2() { Content = new TextBlock { Text = "设备监控：实时数据看板", Foreground = System.Windows.Media.Brushes.White }; } }
>     public class Page3 : Page { public Page3() { Content = new TextBlock { Text = "数据报表：趋势曲线与统计", Foreground = System.Windows.Media.Brushes.White }; } }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 主窗口 + 多个独立功能页（首页 / 监控 / 报表）的应用主框架
> ✅ 需要前进后退历史的多级导航（如「参数 → 子参数」逐级下钻）
> ✅ 功能页较多、希望各页独立开发和测试的模块化结构
> ✅ 从菜单 / 工具栏触发页面跳转的桌面应用
> ❌ 页面内容相对固定、不需要历史记录时（用 [contentcontrol-内容控件](contentcontrol-内容控件) 直接换内容更轻量）
> ❌ 同屏分区展示多页内容时（改用 [tabcontrol-选项卡](tabcontrol-选项卡)）

> [!pitfall] 常见踩坑
> 坑 1：**页面间传参用静态字段，切换后数据串页** → 现象：A 页设置的数据在 B 页显示出来，不同设备的数据互相覆盖。原因：页面对象被复用或静态状态未清理。解决：用 `Navigate(page, state)` 传参，或在导航事件中按当前设备上下文重新加载数据，避免在页面类里放全局静态数据。
> 
> 坑 2：**GoBack 在无历史时抛异常** → 现象：程序刚启动就点「返回」按钮，抛出 InvalidOperationException。原因：`Journal` 为空时 `GoBack()` 不可调用。解决：调用前判断 `mainFrame.CanGoBack`，并把「返回」按钮的 `IsEnabled` 与 `CanGoBack` 同步。
>
> 坑 3：**导航到同一页面多次，状态丢失** → 现象：从报表页返回再进入，之前的筛选条件没了。原因：每次 `Navigate(new Page3())` 都创建新实例。解决：用 `NavigationService` 保存页面实例，或在页面 `OnNavigatedTo` 里从 ViewModel / 缓存恢复状态。

> [!best] 最佳实践
> - 每个功能页用独立的 `Page` 类，页面内部只做展示，数据放 ViewModel
> - 「返回 / 前进」按钮与 `CanGoBack` / `CanGoForward` 联动，无历史时禁用
> - 页面间传参优先用 `Navigate(page, parameter)` 或共享 ViewModel，避免全局静态变量
> - 导航后页面状态通过绑定恢复，不依赖页面对象存活
> - 深层级导航前先 `RemoveBackEntry` 清理无用历史，避免返回路径过长

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，依次点「首页 → 设备监控 → 数据报表」，再点「返回」「前进」观察历史导航
> **Lv.2 小试牛刀**：新增第四个 Page（如「报警查询」）并在顶部导航栏加对应按钮；把「返回」按钮初始设为 `IsEnabled="False"`，有历史记录后才启用
> **Lv.3 融会贯通**：实现带参数的导航：从设备列表页导航到设备详情页，并把设备 ID 通过 `Navigate` 参数传入详情页显示
> **Lv.4 挑战进阶**：实现「面包屑导航」：用 Frame 的 Journal 记录访问路径，在页面顶部动态显示「首页 / 设备监控 / 设备详情」的可点击路径链，点击任意一级可跳回

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[contentcontrol-内容控件](contentcontrol-内容控件)」理解内容模型，再学 Frame 的页面级导航
> - → 后续必学：第 7 章「什么是-MVVM」中的导航服务与页面状态管理
> - ⇄ 关联概念：分区切换用「[tabcontrol-选项卡](tabcontrol-选项卡)」，点击跳转的入口见「[menu-菜单栏](menu-菜单栏)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.frame
