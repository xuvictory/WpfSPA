---
title: DPI 感知模式设置
section: 11-advanced-ui
parent: 11.9 高 DPI 适配
---

# DPI 感知模式设置

> [!plain] 白话理解
> DPI 感知模式就是程序向 Windows 做的"**视力声明**"：系统问你"你知道我的屏幕是 125% 缩放吗？"，你说"知道"（DPI Aware），Windows 就把文字、控件按真实尺寸清晰地渲染给你；你说"不知道"（Unaware），Windows 就把整个窗口当 96 DPI 的图"拍照放大"，放大后的位图全是锯齿和模糊——就像把一张小照片硬拉大。示例用 `app.manifest` 声明了 `dpiAware=true`（System DPI Aware），再用 `GetDpiForWindow` 读出当前窗口的真实 DPI 并换算缩放比例，让你直观看到"声明过"和"没声明"时画面清晰度的天壤之别。

> [!def] 官方定义
> DPI 感知模式（DPI Awareness）是 Windows 为高 DPI 显示器定义的应用程序缩放行为分类，共四级：**Unaware**（不感知，由系统位图拉伸）、**System DPI Aware**（感知系统 DPI，即主屏启动时的 DPI，`dpiAware=true`）、**Per-Monitor DPI Aware**（感知各显示器 DPI）、**Per-Monitor V2**（Win10 1703+ 增强版，`dpiAwareness=PerMonitorV2`）。声明方式是在 `app.manifest` 的 `<application><windowsSettings>` 节点写 `dpiAware`（2005 schema）与 `dpiAwareness`（2016 schema）。运行时可通过 P/Invoke 调用 `user32.dll` 的 `GetDpiForWindow`（指定窗口所在显示器 DPI）与 `GetDpiForSystem`（系统 DPI）读取实际值，96 为 100% 基准。WPF 4.6.2 起原生支持 Per-Monitor V2。详见官方文档：[高 DPI 桌面应用程序开发](https://learn.microsoft.com/zh-cn/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows)、[WPF 中的高 DPI 缩放与分辨率](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/high-dpi-scaling-and-resolution)、[GetDpiForWindow](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-getdpiforwindow)。

> [!origin] 由来背景
> 早期 Windows 所有程序都按固定 96 DPI（每英寸 96 像素）设计，显示器分辨率低时无所谓；2000 年代高分辨率屏普及后，Windows XP/Vista 提供"系统缩放"（System DPI scaling），但缩放方式是**整窗位图拉伸**——不感知 DPI 的程序会被系统虚拟化放大，文字边缘一片模糊。微软从 Windows Vista 开始支持 manifest 声明 `dpiAware`，让程序主动声明感知级别以换取清晰渲染；Win8.1 引入 per-monitor 感知但实现粗糙（窗口跨屏拖动会变形），Win10 1703 才推出成熟的 Per-Monitor V2。WPF 自 4.6.2（2017 年）起完整支持该模式。对上位机而言，**工控屏、触摸一体机的缩放档位经常被运维改成 125%/150% 以放大字体**，不设置 DPI 感知，整套监控界面会"糊成一片"，这是现场售后最常见的投诉之一。

> [!essentials] 核心要点
> - **声明入口**：`app.manifest` 的 `<dpiAware>true</dpiAware>`（System Aware）与 `<dpiAwareness>PerMonitorV2</dpiAwareness>`（Per-Monitor V2，Win10 1703+）
> - **感知四级**：Unaware（位图拉伸最模糊）→ System Aware（全屏统一缩放）→ Per-Monitor（逐屏感知）→ Per-Monitor V2（推荐，自动处理子窗口与坐标）
> - **读取 DPI**：`GetDpiForWindow(hwnd)` 拿窗口所在屏 DPI、`GetDpiForSystem()` 拿系统 DPI，均为 `user32.dll` P/Invoke（示例即此用法）
> - **换算公式**：缩放比例 = DPI / 96；像素 ↔ DIP：`DIP = 像素 × 96 / DPI`
> - **WPF 默认**：未声明时 WPF 按 System Aware 处理；声明 PerMonitorV2 后跨屏拖动会自动重缩放
> - **范围差异**：`dpiAware` 只影响启动时所属显示器，多屏混缩放必须用 `dpiAwareness=PerMonitorV2`

> [!example] 完整示例
> **DPI 感知模式设置演示：通过 app.manifest 声明 System DPI Aware，再用 GetDpiForWindow 读取当前窗口 DPI 并换算缩放因子，展示不同感知模式对界面清晰度的影响：**
>
> **说明：在项目 app.manifest 中添加 DPI 感知声明（默认 manifest 需显式加入）：**
>
> **app.manifest（片段）：**
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
>   <!-- System DPI Aware：系统自动按 DPI 缩放，画面清晰无模糊 -->
>   <application xmlns="urn:schemas-microsoft-com:asm.v3">
>     <windowsSettings>
>       <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
>     </windowsSettings>
>   </application>
> </assembly>
> ```
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DPI 感知模式设置" Height="340" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="DPI 感知模式设置（GetDpiForWindow）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Button Content="读取当前窗口 DPI" Click="OnReadDpi" Padding="12,6" Margin="0,18,0,0"
>                 HorizontalAlignment="Left" Background="#21262D" Foreground="White"/>
>         <TextBox x:Name="DpiBox" Margin="0,14,0,0" IsReadOnly="True" TextWrapping="Wrap"
>                  Height="140" Background="#161B22" Foreground="#8B949E" BorderBrush="#21262D"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 获取指定窗口所在显示器的 DPI（每英寸点数，96 = 100% 缩放）
>         [DllImport("user32.dll")]
>         private static extern uint GetDpiForWindow(IntPtr hwnd);
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnReadDpi(object sender, RoutedEventArgs e)
>         {
>             // 拿到窗口句柄后调用 Win32 API 读取实际 DPI
>             var hwnd = new System.Windows.Interop.WindowInteropHelper(this).Handle;
>             uint dpi = GetDpiForWindow(hwnd);
>
>             DpiBox.AppendText($"当前窗口 DPI：{dpi}\n");
>             DpiBox.AppendText($"缩放比例：{dpi / 96.0:P0}\n");   // 96 DPI 为基准
>             DpiBox.AppendText($"1 英寸实际像素：{dpi}\n");
>             DpiBox.AppendText("系统 DPI Aware 模式下字体、控件由系统统一缩放，不会模糊。\n");
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 触摸一体机 / 工控平板工位：运维为看得清把系统缩放到 150%，界面必须按 DPI 清晰渲染
> ✅ 一台主机拖多块不同缩放屏幕：主屏 100% 写报表、副屏 150% 投大屏，窗口跨屏切换不糊
> ✅ 远程桌面（RDP）会话：客户端分辨率与缩放随时变化，程序需实时感知
> ✅ 现场演示 / 会议投影：演示机缩放到 125%，上位机界面仍保持锐利
> ❌ 固定 1024×768 的老式工控一体机（系统锁 100% 缩放，声明与否无差别）
> ❌ 依赖屏幕像素精确定位的旧程序改造（可先保持 System Aware，逐步迁移）

> [!pitfall] 常见踩坑
> 坑 1：**不声明 `dpiAware`，整窗被位图拉伸** → 现象：Win10 125% 缩放下，上位机界面字迹模糊、边框发虚，截图却清晰 → 原因：未声明时系统按 Unaware 处理，把 96 DPI 渲染结果整图放大 → 解决：在 `app.manifest` 声明 `<dpiAware>true</dpiAware>`（示例第一步），立即恢复清晰
> 
> 坑 2：**只声明 System Aware，跨屏拖动依然模糊** → 现象：窗口从 100% 主屏拖到 150% 副屏，画面先模糊后恢复，文字短暂虚化 → 原因：System Aware 只按启动屏 DPI 渲染，跨屏不重算 → 解决：声明 `dpiAwareness=PerMonitorV2`（见 `per-monitor-dpi-awareness`），让窗口跨屏自动重缩放
>
> 坑 3：**`OnRender` 自定义绘制按固定像素画** → 现象：声明 PerMonitorV2 后字体变清晰了，但自绘的曲线、刻度还是错位或糊 → 原因：`DrawingContext` 坐标是 DIP，自绘代码里却按物理像素假设画 → 解决：绘制前用 `VisualTreeHelper.GetDpi(this)` 拿到 `DpiScale`，按 `DpiScale.PixelsPerDip` 换算笔宽/字号

> [!best] 最佳实践
> - 新建 WPF 上位机项目一律声明 Per-Monitor V2（`dpiAwareness` + 旧版 `dpiAware` 兼容字段），一劳永逸避免后期返工
> - 读取 DPI 统一封装静态类 `DpiHelper`（`GetDpiForWindow` / `GetDpiForSystem` / `PxToDip` / `DipToPx`），业务代码不直接 P/Invoke
> - 图片、图标等位图资源按 100%/125%/150%/200% 各备一套，或用 `viewbox-缩放适配` 做矢量兜底
> - 使用系统 DPI 感知声明后，`Window.Left/Top/Width/Height` 均为 DIP，与 `Screen.WorkingArea` 像素比对前先换算（见 `多屏适配拼接屏场景`）
> - 验收清单：在 100% / 125% / 150% 三档缩放下分别启动程序，检查文字锐利度、控件间距、自绘图形三处

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，把系统缩放切到 125% 再切回 100%，对比声明前后（注释掉 manifest 的 `dpiAware`）界面清晰度差异
> **Lv.2 小试牛刀**：在示例基础上加"获取系统 DPI"按钮，输出 `GetDpiForSystem()`，并新增换算函数把屏幕像素坐标转成 DIP 坐标
> **Lv.3 融会贯通**：封装 `DpiHelper` 静态类，在自绘的温度曲线控件 `OnRender` 中按 DPI 缩放画笔粗细，验证 150% 缩放下曲线依然锐利
> **Lv.4 拆层挑战**：把 manifest 升级为 `PerMonitorV2`，再结合 `per-monitor-dpi-awareness` 的 `DpiChanged` 事件，让自绘控件在窗口跨屏时动态重建绘制参数，实现全 DPI 自适应

> [!related] 相关知识链接
> - ← 前置知识：`p-invoke-基础`（`GetDpiForWindow` 的 P/Invoke 声明）、`viewbox-缩放适配`（UI 内层缩放手段）
> - → 后续必学：`per-monitor-dpi-awareness`（逐屏感知，多屏混缩放的关键）、`多屏适配拼接屏场景`（多屏定位 + DPI 换算）
> - ⇄ 关联概念：`常用-win32-api-封装`（DPI 相关 Win32 的工程化封装）
> - 📖 官方文档：[高 DPI 桌面应用程序开发](https://learn.microsoft.com/zh-cn/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows)、[GetDpiForWindow](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-getdpiforwindow)、[WPF 高 DPI 支持](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/high-dpi-scaling-and-resolution)
