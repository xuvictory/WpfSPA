---
title: Per-Monitor DPI Awareness
section: 11-advanced-ui
parent: 11.9 高 DPI 适配
---

# Per-Monitor DPI Awareness

> [!plain] 白话理解
> 如果说"DPI 感知"是向 Windows 做"视力声明"，Per-Monitor V2 就是声明"**我每换一块屏幕都自动重新配度数**"。旧模式（System DPI Aware）像戴一副固定度数的眼镜：在哪个屏上启动就以哪个屏为准，拖到另一块不同缩放的屏上就"看不清"（模糊一阵再恢复）。Per-Monitor V2 则让 Windows 在窗口跨屏的一瞬间发一条通知（`WM_DPICHANGED`），程序立刻按新屏幕的缩放重新渲染——示例就是这套流程的缩影：manifest 声明 `PerMonitorV2`，窗口跨屏时通过 `HwndSource.AddHook` 拦截 `WM_DPICHANGED`，实时读出新屏 DPI 并刷新字号与说明。

> [!def] 官方定义
> Per-Monitor V2（`DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2`，manifest 中写 `dpiAwareness=PerMonitorV2`）是 Windows 10 1703（Creators Update）引入的 DPI 感知模式，系统会在窗口进入不同 DPI 的显示器时发送 **`WM_DPICHANGED`（0x02E0）** 消息，`wParam` 携带新 DPI、`lParam` 携带系统建议的新窗口矩形；窗口需按新 DPI 重建布局。感知上下文还支持 `SetThreadDpiAwarenessContext` 按线程动态切换。WPF 侧，`UIElement` 有 `DpiChanged` 事件，`VisualTreeHelper.GetDpi` 可获取元素的 DPI 缩放（`DpiScale`）。托管程序通常经 `HwndSource.AddHook` 挂接窗口过程拦截该消息（示例做法）。详见官方文档：[DPI 感知上下文](https://learn.microsoft.com/zh-cn/windows/win32/hidpi/dpi-awareness-context)、[WM_DPICHANGED](https://learn.microsoft.com/zh-cn/windows/win32/hidpi/wm-dpichanged)、[WPF 高 DPI 缩放与分辨率](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/high-dpi-scaling-and-resolution)。

> [!origin] 由来背景
> 多显示器 + 不同缩放的需求在 Win7 时代就存在，但那时整个系统只有一个"系统 DPI"档位，跨屏必然模糊。Win8.1 首次实现 per-monitor DPI，却因"旧程序默认不感知、新程序要自行处理缩放"产生大量兼容性问题，且窗口跨屏时会先按新 DPI 缩放再重新布局，视觉上"先抖再定"，体验很差。Win10 1703 发布 Per-Monitor V2，补上了三块关键短板：**窗口位置由系统建议矩形保持不漂移、子窗口与对话框自动重缩放、非客户区（标题栏）同步缩放**，从此成为 Windows 桌面应用的推荐 DPI 模式。WPF 自 .NET Framework 4.6.2（2017 年）开始完整支持；对用 WPF 写的上位机而言，从"单工位 1080p"走向"大屏 4K + 副屏 1080p 投屏"的现场，正是 PerMonitorV2 的主场。

> [!essentials] 核心要点
> - **声明**：manifest 中同时写 `<dpiAwareness>PerMonitorV2</dpiAwareness>`（2016 schema）与 `<dpiAware>true</dpiAware>`（2005 schema，兼容旧系统）
> - **拦截消息**：`HwndSource.FromHwnd(hwnd).AddHook(WndProc)` 挂钩，`msg == 0x02E0`（WM_DPICHANGED）时刷新（示例核心）
> - **读取 DPI**：`GetDpiForWindow(hwnd)`（窗口所在屏）、`VisualTreeHelper.GetDpi(element)`（WPF 元素级，返回 `DpiScale`）
> - **建议矩形**：`WM_DPICHANGED` 的 `lParam` 是系统算好的新窗口矩形，照搬可避免位置漂移
> - **事件替代**：WPF 4.6.2+ 可直接订阅元素的 `DpiChanged` 事件，不必手工挂钩
> - **运行条件**：仅 Windows 10 1703+；旧系统自动回退 System Aware，代码需兼容

> [!example] 完整示例
> **Per-Monitor DPI Awareness 演示：manifest 声明 PerMonitorV2，窗口跨屏移动时监听 DpiChanged 事件，实时读取新显示器 DPI 并动态换算字号与布局，保证高 DPI 屏上界面依然清晰：**
>
> **说明：PerMonitorV2 是 Win10 1703+ 的推荐模式，需在 app.manifest 中声明：**
>
> **app.manifest（片段）：**
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
>   <application xmlns="urn:schemas-microsoft-com:asm.v3">
>     <windowsSettings>
>       <!-- PerMonitorV2：每个显示器独立 DPI，跨屏拖拽时动态适配 -->
>       <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
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
>         Title="Per-Monitor DPI Awareness" Height="400" Width="500"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Per-Monitor DPI Awareness（跨屏动态适配）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <TextBlock Text="把窗口拖到另一块不同缩放的屏幕，DPI 会实时更新" Foreground="#8B949E"
>                    Margin="0,10,0,0" TextWrapping="Wrap"/>
>         <Border Margin="0,18,0,0" Background="#161B22" BorderBrush="#21262D"
>                 BorderThickness="1" CornerRadius="6" Padding="14">
>             <StackPanel>
>                 <TextBlock x:Name="TitleInfo" Text="当前显示器 DPI：--" Foreground="White"
>                            FontSize="16" FontWeight="Bold"/>
>                 <TextBlock x:Name="ScaleInfo" Text="缩放比例：--" Foreground="#8B949E"
>                            Margin="0,6,0,0"/>
>                 <TextBlock x:Name="PixelInfo" Text="1 DIP = -- 物理像素" Foreground="#58A6FF"
>                            Margin="0,6,0,0"/>
>             </StackPanel>
>         </Border>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Interop;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             SourceInitialized += OnSourceInitialized;
>         }
>
>         // 窗口句柄就绪后：订阅 DpiChanged 消息，并读取初始 DPI
>         private void OnSourceInitialized(object sender, EventArgs e)
>         {
>             var hwnd = new WindowInteropHelper(this).Handle;
>             var source = HwndSource.FromHwnd(hwnd);
>             source?.AddHook(WndProc);
>             UpdateDpiInfo();
>         }
>
>         // 拦截窗口消息：DPI 变化（WM_DPICHANGED = 0x02E0）时刷新显示
>         private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
>         {
>             if (msg == 0x02E0) // WM_DPICHANGED
>             {
>                 UpdateDpiInfo();
>                 handled = true;
>             }
>             return IntPtr.Zero;
>         }
>
>         // 读取当前窗口所在显示器 DPI 并换算显示
>         private void UpdateDpiInfo()
>         {
>             var hwnd = new WindowInteropHelper(this).Handle;
>             double dpi = GetDpiForWindow(hwnd);
>
>             TitleInfo.Text = $"当前显示器 DPI：{dpi:0}";
>             ScaleInfo.Text = $"缩放比例：{dpi / 96.0:P0}";
>             PixelInfo.Text = $"1 DIP = {dpi / 96.0:F2} 物理像素";
>         }
>
>         [System.Runtime.InteropServices.DllImport("user32.dll")]
>         private static extern uint GetDpiForWindow(IntPtr hwnd);
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 工程师在 4K 笔记本写程序、现场工位是 1080p：同一程序跨不同缩放屏拖动保持清晰
> ✅ 主屏 100% 写报表 + 副屏 150% 投大屏：监控画面在投屏侧必须按副屏缩放重新布局
> ✅ 触摸一体机分辨率高、系统放大到 150%：控件与触控热区随缩放变大，方便手指点按
> ✅ 远程桌面（RDP）中缩放档位随客户端变化：窗口自动适配不糊不偏
> ❌ 单屏固定 100% 缩放的封闭工控环境（PerMonitorV2 无收益，声明 System Aware 即可）
> ❌ 目标系统仍是 Win7/Win8 的老项目（PerMonitorV2 不生效，需维护两套缩放逻辑）

> [!pitfall] 常见踩坑
> 坑 1：**只声明 `dpiAwareness` 不声明 `dpiAware`** → 现象：Win10 1703+ 正常，Win10 早期版本或某些设备上界面被放大模糊 → 原因：旧版 `dpiAware` 字段是部分系统读取的入口，缺了它感知声明不完整 → 解决：两个字段同时写（示例 manifest 即兼容写法）
> 
> 坑 2：**在 `WM_DPICHANGED` 里直接改 `Window.Width/Height` 造成闪烁抖动** → 现象：窗口跨屏时疯狂缩放、来回抖 → 原因：自己改尺寸没有参考系统建议，且修改又触发新一轮消息 → 解决：直接采用 `lParam` 给出的建议矩形（`Marshal.PtrToStructure<RECT>(lParam)`）一次到位，或让 WPF 走 `DpiChanged` 事件自动处理
>
> 坑 3：**自定义控件没响应 DPI 变化** → 现象：框架控件都清晰了，自绘的报警灯、曲线刻度却错位 → 原因：`OnRender` 缓存了绘制参数，跨屏后未重算 → 解决：控件订阅 `DpiChanged` 或重写 `OnDpiChanged`，用 `VisualTreeHelper.GetDpi` 重新计算画笔粗细与布局后 `InvalidateVisual()`
>
> 坑 4：**窗口跨屏后位置漂移** → 现象：窗口从 150% 屏拖到 100% 屏，尺寸变化但停靠位置偏了 → 原因：跨屏时 DIP 与像素换算基准变化，坐标未按建议矩形修正 → 解决：PerMonitorV2 下由系统 `lParam` 建议矩形接管位置，程序不要自行设置 `Left/Top`

> [!best] 最佳实践
> - 新项目统一 PerMonitorV2 + 兼容字段双声明，并把"系统缩放 125%/150%"写进测试用例
> - DPI 相关代码集中到 `DpiHelper`（`GetDpiForWindow` / `DpiChanged` 订阅 / `PxToDip`），示例中的挂钩逻辑直接下沉为工具类
> - 自绘控件（仪表、曲线、报警灯）一律通过 `VisualTreeHelper.GetDpi` 取缩放，禁止硬编码像素
> - 位图资源按多档 DPI 提供或改矢量，避免跨屏后位图被拉伸发虚（可配合 `viewbox-缩放适配`）
> - 与 `多屏适配拼接屏场景` 配合时，先换算 DIP ↔ 像素再定位窗口，两条链路别混用

> [!practice] 上手练习
> **Lv.1 照猫画虎**：双屏（不同缩放档位）环境运行示例，把窗口从 100% 屏拖到 150% 屏，观察 DPI、缩放比例、`1 DIP` 数值实时变化
> **Lv.2 小试牛刀**：给 `WndProc` 加分支，把 `lParam` 中的建议矩形解析出来（`RECT` 结构），在状态栏打印新位置与尺寸，确认系统建议值
> **Lv.3 融会贯通**：把示例的挂钩逻辑封装成 `DpiMonitor` 帮助类（挂载窗口 + `DpiChanged` 事件），并让一个自绘的指针仪表控件在跨屏后按新 DPI 重绘
> **Lv.4 拆层挑战**：实现"跨屏自动铺满"：结合 `多屏适配拼接屏场景` 的 `Screen.AllScreens` 与 PerMonitorV2，窗口被拖入目标屏时自动按该屏工作区（换算后）重设大小与位置

> [!related] 相关知识链接
> - ← 前置知识：`dpi-感知模式设置`（感知模式分级与 manifest 声明）、`p-invoke-基础`（`WM_DPICHANGED` 消息与 `RECT` 封送）
> - → 后续必学：`多屏适配拼接屏场景`（多屏枚举 + DPI 换算的完整落地）
> - ⇄ 关联概念：`viewbox-缩放适配`（UI 内部缩放）、`常用-win32-api-封装`（DPI 消息的工程化封装）
> - 📖 官方文档：[DPI 感知上下文](https://learn.microsoft.com/zh-cn/windows/win32/hidpi/dpi-awareness-context)、[WM_DPICHANGED](https://learn.microsoft.com/zh-cn/windows/win32/hidpi/wm-dpichanged)、[WPF 高 DPI 支持](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/high-dpi-scaling-and-resolution)
