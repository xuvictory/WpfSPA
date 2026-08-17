---
title: P/Invoke 基础
section: 11-advanced-ui
parent: 11.6 WPF 与 Windows API 交互
---

# P/Invoke 基础

> [!plain] 白话理解
> WPF 是"装修好的现代化车间"，但有些老设备（Windows 原生能力）只有 Win32 的"旧接口"——比如原生消息框、屏幕分辨率、系统运行时长，.NET 没直接给。P/Invoke 就是**请一名翻译官（CLR）帮你对接旧接口**：你写一行 `[DllImport("user32.dll")]` 声明"我要找 user32.dll 里的谁"，CLR 负责把 C# 的参数翻译成 C 的格式（封送）、调用、再把返回值翻译回来。示例里 `NativeMessageBox` 就是把 .NET 的窗口句柄交给 Win32 的原生弹窗，两边语言不通但数据照传。

> [!def] 官方定义
> P/Invoke（Platform Invocation Services，平台调用）是 .NET 提供的调用非托管代码（Win32 API、C/C++ DLL）的机制。用 `System.Runtime.InteropServices.DllImport` 特性标记 `static extern` 方法，声明目标 DLL、`EntryPoint`（函数名，默认与方法名一致）、`CharSet`（字符串编码）等；CLR 在首次调用时加载 DLL、解析函数地址，并按封送规则（`Marshal`）在托管与非托管边界转换参数与返回值。结构体传递需用 `LayoutKind.Sequential` 等布局标记；句柄等资源建议用 `SafeHandle` 派生类封装。详见官方文档：[P/Invoke 平台调用](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/pinvoke)、[DllImportAttribute 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.dllimportattribute)。

> [!origin] 由来背景
> Win32 API 是 Windows 自 1993 年 Windows NT 3.1 / 1995 年 Windows 95 起提供的 C 语言原生接口（`user32.dll`/`kernel32.dll`/`gdi32.dll`），几十年积累了大量功能。.NET Framework 1.0（2002 年）发布时，不可能把全部 Win32 能力重写一遍，于是提供了 P/Invoke：托管代码按 C 签名声明函数，CLR 自动完成加载与封送。WPF（2006 年）虽自身高度托管化，但底层窗口句柄（`HwndSource`）、系统消息仍绕不开 Win32。上位机场景常借助 P/Invoke 拿系统信息、控制电源、操作串口等 .NET 未直接暴露的能力，但规则同样严格：签名必须与 C 声明一致，否则内存出错甚至崩溃。

> [!essentials] 核心要点
> - **`[DllImport("dll 名")]`**：声明目标库，函数默认同名（可 `EntryPoint` 改名）；`static extern` 是硬性写法
> - **`CharSet`**：`CharSet.Unicode` 处理字符串，避免 ANSI/Unicode 混用导致乱码（示例 `NativeMessageBox`）
> - **句柄获取**：WPF 拿窗口句柄用 `new WindowInteropHelper(this).Handle`（示例 `OnNativeMessageBox`）
> - **常量与枚举**：Win32 常量（`SM_CXSCREEN`）按文档写 `const`，与原生值完全一致（示例）
> - **返回值类型**：严格按原生签名（`int`/`uint`/`IntPtr`），`GetTickCount` 返回 `uint`（毫秒，49.7 天回绕）
> - **平台兼容**：P/Invoke 依赖 Windows，跨平台项目要加 `OperatingSystem.IsWindows()` 守卫或只在 Windows 目标编译

> [!example] 完整示例
> **P/Invoke 调用 Win32 API 演示：用 DllImport 声明 user32.dll / kernel32.dll 中的原生函数（MessageBox、GetSystemMetrics、GetTickCount），在 WPF 按钮中直接调用，展示托管代码与非托管代码互操作：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="P/Invoke 基础" Height="380" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="P/Invoke 调用 Win32 API（DllImport 互操作）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <TextBlock Text="DllImport 特性声明外部函数，CLR 自动完成类型封送" Foreground="#8B949E"
>                    Margin="0,10,0,0" TextWrapping="Wrap"/>
>         <StackPanel Margin="0,20,0,0">
>             <Button Content="弹出原生 MessageBox（user32.dll）" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnNativeMessageBox"/>
>             <Button Content="读取屏幕分辨率（GetSystemMetrics）" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnScreenMetrics"/>
>             <Button Content="查询系统已运行时长（GetTickCount）" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnUptime"/>
>         </StackPanel>
>         <TextBlock x:Name="ResultText" Foreground="#58A6FF" Margin="0,12,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与 P/Invoke 声明：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // ---- P/Invoke 声明：DllImport 告诉运行时去哪个 DLL 找函数 ----
>
>         // user32.dll：Windows 用户界面核心库
>         [DllImport("user32.dll", CharSet = CharSet.Unicode)]
>         private static extern int NativeMessageBox(IntPtr hWnd, string text,
>             string caption, uint type);
>
>         // 屏幕指标枚举（仅列本次用到的几项）
>         private const int SM_CXSCREEN = 0;   // 主屏宽（像素）
>         private const int SM_CYSCREEN = 1;   // 主屏高（像素）
>
>         [DllImport("user32.dll")]
>         private static extern int GetSystemMetrics(int index);
>
>         // kernel32.dll：系统内核函数
>         [DllImport("kernel32.dll")]
>         private static extern uint GetTickCount();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // 调用原生 MessageBox：第一个参数传窗口句柄，实现模态归属
>         private void OnNativeMessageBox(object sender, RoutedEventArgs e)
>         {
>             NativeMessageBox(new System.Windows.Interop.WindowInteropHelper(this).Handle,
>                 "这条消息框来自 Win32 API 调用！", "P/Invoke", 0x40 /* MB_ICONINFORMATION */);
>         }
>
>         // 读取屏幕宽高，证明能获取 .NET 层没有直接暴露的系统信息
>         private void OnScreenMetrics(object sender, RoutedEventArgs e)
>         {
>             int w = GetSystemMetrics(SM_CXSCREEN);
>             int h = GetSystemMetrics(SM_CYSCREEN);
>             ResultText.Text = $"主屏幕分辨率：{w} × {h} 像素";
>         }
>
>         // 系统运行时长：返回自启动以来的毫秒数
>         private void OnUptime(object sender, RoutedEventArgs e)
>         {
>             uint ms = GetTickCount();
>             ResultText.Text = $"系统已运行：{ms / 3600000.0:F1} 小时";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 读取系统底层信息：屏幕分辨率、系统运行时长、Windows 版本（示例场景）
> ✅ 调用 .NET 未封装的 Win32 功能：电源管理、系统休眠唤醒、硬件信息（磁盘序列号）
> ✅ 与老设备驱动/串口 DLL 对接（设备厂商提供的原生 SDK）
> ✅ 弹原生对话框、置顶窗口、发送系统消息等系统级 UI 操作
> ❌ .NET 已有等价 API 的功能（优先用托管 API，`SystemParameters` 能拿分辨率就别 P/Invoke）
> ❌ 跨平台应用的非 Windows 部分（Linux/macOS 没有 Win32 DLL，需逐平台分支）

> [!pitfall] 常见踩坑
> 坑 1：**签名与原生函数不一致** → 现象：调用后内存损坏、返回值诡异甚至崩溃 → 原因：`DllImport` 声明与 Win32 实际签名（参数个数/类型/返回值）不符，封送错误 → 解决：严格对照 P/Invoke 文档（pinvoke.net / Microsoft Learn）抄签名；字符串记得 `CharSet`，指针类型用 `IntPtr`
> 
> 坑 2：**句柄/内存泄漏** → 现象：长时间运行后资源耗尽、句柄数上涨 → 原因：调用返回句柄的函数（如打开设备）后没释放 → 解决：用 `SafeHandle` 包装句柄或用 `finally` 释放（详见 `常用-win32-api-封装`）
>
> 坑 3：**DLL 加载失败** → 现象：`DllNotFoundException`/`EntryPointNotFoundException` → 原因：目标 DLL 不存在（Win7 没有新版 API）、或函数名大小写不对 → 解决：确认目标系统含该 DLL/API；用 `EntryPoint` 指定准确函数名，必要时 `SetDllDirectory` 指定目录

> [!best] 最佳实践
> - 每个 `[DllImport]` 旁写注释标明来源（dll 名、函数用途），签名务必对照官方头文件（`windows.h`）抄
> - P/Invoke 声明集中到独立类（如 `NativeMethods`），配 `internal static class`，便于复用与审查
> - 能用 .NET 托管 API 就优先用托管 API，P/Invoke 只补 .NET 没有的缺口
> - 字符串参数统一 `CharSet.Unicode`；结构体加 `[StructLayout(LayoutKind.Sequential)]` 保证内存布局
> - 调用返回句柄/内存的 API 用 `SafeHandle` 或 `try/finally` 确保释放，杜绝泄漏

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，依次点击三个按钮观察原生弹窗、分辨率与运行时长；把 `GetTickCount` 输出改成"天"单位
> **Lv.2 小试牛刀**：用 `GetSystemMetrics(SM_CXVIRTUALSCREEN)` 读取虚拟屏幕宽度（多屏时使用），在界面上显示"扩展屏总宽"
> **Lv.3 融会贯通**：P/Invoke `user32.dll` 的 `GetCursorPos` 获取鼠标全局坐标，用 `DispatcherTimer` 每秒刷新显示，并对比 `Mouse.GetPosition` 的差异
> **Lv.4 拆层挑战**：把全部 P/Invoke 声明收敛到 `NativeMethods` 静态类，封装 `ScreenInfo`（分辨率、DPI、显示器数量）与 `Uptime` 属性，供 ViewModel 绑定，验证互操作代码与 UI 解耦

> [!related] 相关知识链接
> - ← 前置知识：「第 4 章·button-按钮」「button-按钮」（示例宿主控件）、「第 8 章·Dispatcher」「dispatcher」相关文章（系统信息定时刷新）
> - → 后续必学：`常用-win32-api-封装`（句柄封装与常用 API 集合）、`per-monitor-dpi-awareness`（DPI 相关 Win32 调用）
> - ⇄ 关联概念：`dpi-感知模式设置`（`SetProcessDpiAwareness` 同为 P/Invoke）、`多屏适配拼接屏场景`（`GetSystemMetrics` 多屏扩展）
> - 📖 官方文档：[P/Invoke 平台调用](https://learn.microsoft.com/zh-cn/dotnet/standard/native-interop/pinvoke)、[DllImportAttribute 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.dllimportattribute)、[Win32 API 索引（Microsoft Learn）](https://learn.microsoft.com/zh-cn/windows/win32/api/)
