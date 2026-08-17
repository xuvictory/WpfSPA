---
title: WebBrowser 内嵌浏览器
section: 04-controls
parent: 4.9 装饰与辅助控件
---

# WebBrowser 内嵌浏览器

> [!plain] 白话理解
> WebBrowser 就是在上位机窗口里「内嵌一个网页浏览器」：不用跳出程序，直接在窗口里显示网页——设备的 Web 监控页、厂家的在线帮助、工艺的网页版说明都能嵌入进来。它就像给设备操作台开了一扇「网络窗口」，HTML 页面和 WPF 界面可以同时出现在一个应用里。

> [!def] 官方定义
> `WebBrowser`（全限定名 `System.Windows.Controls.WebBrowser`）是 WPF 中基于系统 IE/Edge 内核的网页浏览控件：`Navigate(Uri)` 加载网页或本地文件，`NavigateToString(string)` 直接显示 HTML 字符串，`Document` 访问页面 DOM，`ObjectForScripting` 实现 C# 与页面脚本互操作，并支持前进后退（`GoBack` / `GoForward` / `CanGoBack`）。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.webbrowser

> [!origin] 由来背景
> WebBrowser 是 WPF 对 Win32 ActiveX WebBrowser 控件与 WinForms `WebBrowser` 的延续：微软早在 1990 年代就把 IE 内核封装成可嵌入控件，让桌面程序可以显示网页。WPF 在 .NET Framework 3.0 中继续提供该控件，用于「HMI 内嵌 Web 监控页」「在线文档」「仪表盘图表」等场景。需要注意：它是基于 IE 内核实现的，不是 Chromium，功能与渲染存在兼容性限制。

> [!essentials] 核心要点
> - `Navigate(Uri)`：加载 URL 或本地文件；`NavigateToString()` 显示 HTML 字符串
> - `Document` / `ObjectForScripting`：访问页面 DOM、实现 C# 与 JS 互调
> - `CanGoBack` / `GoBack()` / `Refresh()`：导航控制
> - 基于 IE 内核：现代 Web 特性支持有限（WebSocket、ES6 等可能缺失）
> - 不可数据绑定：`Document` 等不是依赖属性，交互要写在事件 / 代码里

> [!example] 完整示例
> **内嵌设备 Web 页面演示：WebBrowser 加载本地 HTML 与导航控制（注意依赖 WebBrowser 内核）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="内嵌浏览器 - WebBrowser" Height="500" Width="760"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="10">
>         <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Margin="0,0,0,8">
>             <Button Content="设备监控页" Click="OnLoadDevice" Padding="10,4" Margin="0,0,6,0"/>
>             <Button Content="使用帮助页" Click="OnLoadHelp" Padding="10,4" Margin="0,0,6,0"/>
>             <Button Content="后退" Click="OnBack" Padding="10,4" Margin="0,0,6,0"/>
>             <Button Content="刷新" Click="OnRefresh" Padding="10,4"/>
>         </StackPanel>
>
>         <!-- WebBrowser 显示网页；WPF 中该控件依赖系统 WebBrowser(IE) 内核 -->
>         <WebBrowser x:Name="web" />
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             OnLoadDevice(null, null);
>         }
>
>         private void OnLoadDevice(object sender, RoutedEventArgs e)
>         {
>             // Navigate 支持 URL 或本地文件路径
>             web.Navigate(new Uri("https://example.com/device-monitor"));
>         }
>
>         private void OnLoadHelp(object sender, RoutedEventArgs e)
>         {
>             // 也可以直接显示 HTML 字符串（DocumentText 属性）
>             web.NavigateToString(
>                 "<html><body style='background:#161B22;color:#fff;font-family:sans-serif'>" +
>                 "<h2>设备使用帮助</h2><p>请先连接设备，再查看实时数据。</p></body></html>");
>         }
>
>         private void OnBack(object sender, RoutedEventArgs e)
>         {
>             if (web.CanGoBack) web.GoBack();
>         }
>
>         private void OnRefresh(object sender, RoutedEventArgs e) => web.Refresh();
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 内嵌设备供应商提供的 Web 监控页（如摄像头管理页）
> ✅ 在线帮助文档、工艺说明网页的展示
> ✅ 用 HTML 图表库（如 ECharts）画复杂趋势图再嵌入界面
> ✅ 打印预览、报表网页的预览显示
> ❌ 需要现代 Web 技术（WebSocket、H5 新 API）时（改用 CefSharp / WebView2）
> ❌ 需要数据绑定的富文本页面时（直接用 [textblock-轻量文本](textblock-轻量文本) / [richtextbox-富文本框](richtextbox-富文本框) 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**网页渲染效果和 Chrome 不一样** → 现象：页面在 Chrome 正常，嵌入后布局错乱、功能失效。原因：`WebBrowser` 基于系统 IE 内核（低版本兼容模式）。解决：确认页面兼容 IE11（或在注册表中启用 WebView2 / CefSharp 替代内核）。
> 
> 坑 2：**NavigateToString 的 HTML 里中文乱码** → 现象：内嵌 HTML 字符串显示乱码。原因：字符串编码不是 UTF-8，或缺少 meta charset。解决：在 HTML 头部加 `<meta charset="utf-8">`，并确保 C# 字符串本身编码正确。
>
> 坑 3：**ObjectForScripting 调用报错 / 被禁用** → 现象：JS 调用 C# 方法无反应或抛 SecurityException。原因：未设置 `ObjectForScripting`、未用 `ComVisible(true)` 标记，或 IE 安全设置拦截。解决：创建 `[ComVisible(true)]` 的公共类并赋值给 `ObjectForScripting`，调试时确认安全级别配置。

> [!best] 最佳实践
> - 现代网页需求优先考虑 WebView2（Chromium 内核），仅简单展示才用 WebBrowser
> - 本地 HTML 资源放到项目目录并复制到输出目录，用绝对 / 相对 URI 导航
> - 页面与 C# 交互通过 `ObjectForScripting` 定义最小接口，避免把业务逻辑暴露给页面
> - 页面加载失败时捕获 `LoadCompleted` / `Navigated` 事件给出提示，别让白屏
> - 深色主题下给网页容器加边框，与主界面风格衔接

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，点击「设备监控页」「使用帮助页」「后退」「刷新」观察 WebBrowser 导航行为
> **Lv.2 小试牛刀**：把 `OnLoadDevice` 的 URL 改为本地 HTML 文件路径（新建一个 device.html 放项目目录）；给网页加 `<meta charset="utf-8">` 验证中文显示
> **Lv.3 融会贯通**：用 `NavigateToString` 拼接一段带样式的 HTML 显示设备参数表格（含当前采集值）
> **Lv.4 挑战进阶**：实现 C# 与页面互调：用 `ObjectForScripting` 暴露一个「获取实时转速」方法，页面按钮点击后调用 C# 方法并回显结果，观察跨语言调用链路

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[frame-页面框架](frame-页面框架)」理解内容承载，WebBrowser 是另一种「内容源」
> - → 后续必学：第 7 章「MVVM」中把页面内嵌的 Web 逻辑封装成服务
> - ⇄ 关联概念：富文本展示见「[richtextbox-富文本框](richtextbox-富文本框)」，弹出浮层见「[popup-弹出层](popup-弹出层)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.webbrowser
