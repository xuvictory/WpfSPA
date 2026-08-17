---
title: 常用 Win32 API 封装
section: 11-advanced-ui
parent: 11.6 WPF 与 Windows API 交互
---

# 常用 Win32 API 封装

> [!plain] 白话理解
> 上一节学会了"请翻译官"，但如果每个按钮都当场写 `[DllImport]`，代码会散得到处都是、签名抄错风险也高。**封装**就是把所有翻译官集中到一个办公室（`NativeMethods` 静态类），对外只提供"说人话"的方法：`SetTopmost(handle, true)`、`GetForegroundTitle()`、`GetMonitorCount()`——业务代码不用再碰裸 Win32。示例里按钮点一下，`MainWindow` 只调这三个友好方法，具体 `SetWindowPos`/`GetWindowText` 的细节全在封装类里。这就是"接口清晰、实现收敛"。

> [!def] 官方定义
> Win32 API 封装指把底层 `DllImport` 声明与调用逻辑收敛到独立的托管类（惯例命名 `NativeMethods`/`SafeNativeMethods`/`UnsafeNativeMethods`，微软代码分析建议按"是否处理不可信输入"选用前两者），向业务层暴露强类型、语义化方法。封装内容包括：DLL 函数签名、常量（`HWND_TOPMOST` 等）、结构体布局（`[StructLayout]`）、句柄获取与释放（`SafeHandle`/`WindowInteropHelper`）。这样上层代码不依赖平台细节，便于复用与单元测试。详见官方文档：[SafeNativeMethods 命名约定](https://learn.microsoft.com/zh-cn/dotnet/fundamentals/code-analysis/quality-rules/ca1400)相关规范、[WindowInteropHelper 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.interop.windowinterophelper)。

> [!origin] 由来背景
> .NET Framework 1.0（2002 年）提供 P/Invoke 后，社区很快发现"裸用 Win32"的问题：签名抄自不同资料容易出错、常量散落、句柄泄漏难追踪。微软在 .NET Framework 2.0（2005 年）起通过 FxCop/代码分析规则（CA1400 系列）引导开发者把平台调用收敛进 `NativeMethods` 类，并区分 `SafeNativeMethods`（不处理不可信输入）与 `UnsafeNativeMethods`（可能暴露指针）。这一约定沿用至今，成为 .NET 项目的标准实践。WPF 上位机项目里，置顶窗口、读前台窗口、查询显示器数量这些高频需求，都靠这种"集中封装 + 友好方法"的方式管理。

> [!essentials] 核心要点
> - **集中声明**：全部 `[DllImport]`、常量、结构体放在 `internal static class NativeMethods`，业务层只调公开方法
> - **友好方法命名**：`SetTopmost(IntPtr, bool)`/`GetForegroundTitle()`/`GetMonitorCount()`，用业务语义命名而非 Win32 原名
> - **句柄来源**：WPF 用 `new WindowInteropHelper(this).Handle` 取窗口句柄（示例 `OnToggleTopmost`）
> - **常量内聚**：`HWND_TOPMOST = new IntPtr(-1)`、`SWP_NOMOVE` 等与函数声明放一起，不散落
> - **返回值规整**：字符串用 `StringBuilder` 接（示例 `GetForegroundTitle`），指针统一 `IntPtr`
> - **可测试性**：业务代码只依赖封装方法，便于注入与单元测试；封装内部再考虑平台守卫

> [!example] 完整示例
> **常用 Win32 API 封装演示：把 P/Invoke 声明收敛到一个 NativeMethods 静态类，对外提供 置顶窗口、获取前台窗口标题、读取屏幕数量 等强类型方法，业务代码只跟友好 API 打交道：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="常用 Win32 API 封装" Height="400" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="常用 Win32 API 封装（NativeMethods 静态类）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <TextBlock Text="把 DllImport 声明收敛封装，业务层调用友好方法" Foreground="#8B949E"
>                    Margin="0,10,0,0" TextWrapping="Wrap"/>
>         <StackPanel Margin="0,20,0,0">
>             <Button Content="本窗口置顶 / 取消置顶" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnToggleTopmost"/>
>             <Button Content="读取前台窗口标题" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnReadForegroundTitle"/>
>             <Button Content="查询系统显示器数量" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnScreenCount"/>
>         </StackPanel>
>         <TextBox x:Name="ResultBox" Margin="0,12,0,0" Height="90" IsReadOnly="True"
>                  TextWrapping="Wrap" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#21262D"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与 Win32 封装类：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Text;
> using System.Windows;
>
> namespace HmiDemo
> {
>     // 统一的 Win32 API 封装类：所有 DllImport 集中在此，避免散落在业务代码中
>     public static class NativeMethods
>     {
>         [DllImport("user32.dll")]
>         private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter,
>             int x, int y, int cx, int cy, uint flags);
>
>         [DllImport("user32.dll")]
>         private static extern IntPtr GetForegroundWindow();
>
>         [DllImport("user32.dll", CharSet = CharSet.Unicode)]
>         private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
>
>         [DllImport("user32.dll")]
>         private static extern int GetSystemMetrics(int index);
>
>         private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
>         private static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
>         private const uint SWP_NOSIZE = 0x0001;
>         private const uint SWP_NOMOVE = 0x0002;
>         private const int SM_CMONITORS = 80;
>
>         // 封装 1：置顶 / 取消置顶
>         public static void SetTopmost(IntPtr handle, bool topmost)
>         {
>             SetWindowPos(handle, topmost ? HWND_TOPMOST : HWND_NOTOPMOST,
>                 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
>         }
>
>         // 封装 2：获取当前前台窗口标题
>         public static string GetForegroundTitle()
>         {
>             IntPtr hwnd = GetForegroundWindow();
>             var sb = new StringBuilder(256);
>             GetWindowText(hwnd, sb, sb.Capacity);
>             return sb.ToString();
>         }
>
>         // 封装 3：系统连接的显示器数量
>         public static int GetMonitorCount() => GetSystemMetrics(SM_CMONITORS);
>     }
>
>     public partial class MainWindow : Window
>     {
>         private bool _topmost;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnToggleTopmost(object sender, RoutedEventArgs e)
>         {
>             _topmost = !_topmost;
>             // 通过 WindowInteropHelper 拿到本窗口句柄
>             var handle = new System.Windows.Interop.WindowInteropHelper(this).Handle;
>             NativeMethods.SetTopmost(handle, _topmost);
>             ResultBox.AppendText($"本窗口已{( _topmost ? "置顶" : "取消置顶")}\n");
>         }
>
>         private void OnReadForegroundTitle(object sender, RoutedEventArgs e)
>         {
>             ResultBox.AppendText($"前台窗口标题：{NativeMethods.GetForegroundTitle()}\n");
>         }
>
>         private void OnScreenCount(object sender, RoutedEventArgs e)
>         {
>             ResultBox.AppendText($"当前系统共 {NativeMethods.GetMonitorCount()} 个显示器\n");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机需要置顶显示关键告警窗口（示例 `SetTopmost` 场景）
> ✅ 监控/操作站需要读取前台窗口标题（识别操作员当前在哪个窗口操作）
> ✅ 多屏拼接屏上位机查询显示器数量、布局参数（示例 `GetMonitorCount`）
> ✅ 多个功能都要 Win32 支撑时统一封装，一处实现多处复用
> ❌ 只有一个 P/Invoke 的微型项目（先保持简单，别过早抽象）
> ❌ 跨平台项目（封装层内部也要 `OperatingSystem.IsWindows()` 分支或由平台抽象替代）

> [!pitfall] 常见踩坑
> 坑 1：**`SetWindowPos` 后窗口位置被顶飞** → 现象：置顶后窗口跳动或位置异常 → 原因：没带 `SWP_NOMOVE|SWP_NOSIZE` 标志，`x/y/cx/cy` 传 0 被当成真实移动 → 解决：示例中置顶调用传 `SWP_NOMOVE | SWP_NOSIZE`，只改 Z 序不动位置
> 
> 坑 2：**`GetWindowText` 返回乱码/截断** → 现象：中文标题读出乱码 → 原因：`CharSet` 没指定 Unicode，或 `StringBuilder` 容量太小 → 解决：声明加 `CharSet.Unicode`，`StringBuilder` 容量给足（示例 256），返回字符数用于校验
>
> 坑 3：**封装类方法到处可改造成"隐形耦合"** → 现象：`NativeMethods` 越写越大、谁也说不清哪些 API 在用 → 原因：把整个 `user32` 都抄进来 → 解决：只封装当前业务用到的 API，按模块拆分（`WindowNativeMethods`/`MonitorNativeMethods`），并配注释标明调用方

> [!best] 最佳实践
> - 封装方法用业务语义命名（`SetTopmost`/`GetMonitorCount`），底层 Win32 名留在 `[DllImport]` 声明处
> - 常量与函数放同一封装类，紧邻声明，避免"魔法数字"散落业务代码
> - 涉及句柄的封装返回 `IntPtr` 或封装成 `SafeHandle`，调用方用 `WindowInteropHelper` 获取后传入
> - 同类 API 按领域拆封装类（窗口/显示器/文件/网络），每个类单一职责
> - 给封装方法加 XML 注释（平台要求、返回语义、调用示例），这层代码是团队复用的公共资产

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点"置顶"后打开记事本对比 Z 序变化；点"读取前台窗口标题"观察结果与当前活动窗口一致
> **Lv.2 小试牛刀**：给 `NativeMethods` 增加 `GetScreenResolution()`（`GetSystemMetrics(SM_CXSCREEN/CYSCREEN)`）与 `IsWindowVisible(IntPtr)` 两个封装并接入按钮
> **Lv.3 融会贯通**：用 `DispatcherTimer` 每秒读取前台窗口标题并显示"操作员当前在操作 XX 窗口"，验证封装后的 Win32 调用适合高频轮询
> **Lv.4 拆层挑战**：把 `NativeMethods` 拆成 `WindowNativeMethods` 与 `MonitorNativeMethods`，并写单元测试验证 `GetMonitorCount()` 在多屏/单屏环境下返回正确值

> [!related] 相关知识链接
> - ← 前置知识：`p-invoke-基础`（`DllImport`/`CharSet`/封送基础）
> - → 后续必学：`dpi-感知模式设置`（DPI 相关 Win32 调用同样走封装）、`多屏适配拼接屏场景`（显示器数量/分辨率的实际应用）
> - ⇄ 关联概念：`焦点管理`（前台窗口与键盘焦点关系）、`动态切换主题`（置顶窗口与主题弹出层共存）
> - 📖 官方文档：[WindowInteropHelper 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.interop.windowinterophelper)、[SetWindowPos（Microsoft Learn）](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-setwindowpos)、[GetSystemMetrics（Microsoft Learn）](https://learn.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-getsystemmetrics)
