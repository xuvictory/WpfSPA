---
title: ProgressBar 进度条
section: 04-controls
parent: 4.5 范围类控件
---

# ProgressBar 进度条

> [!plain] 白话理解
> 批量导出数据、下载固件、建立通信——这些操作少则几秒、多则几分钟，用户盯着静止的界面会以为程序卡死了。进度条的价值不是"精确报告百分比"，而是"告诉用户：还在干活，别急"。
> WPF 的 `ProgressBar` 有两种形态：**确定模式**——你已知总量和当前进度，设好 `Minimum`/`Maximum`/`Value` 显示百分比；**不确定模式**——不知道还要多久（如等待设备响应），设 `IsIndeterminate="True"` 让它滚动动画表达"进行中"。选对模式，比修样式更重要。

> [!def] 官方定义
> ProgressBar 是 WPF 中用于"显示任务进度"的控件，位于 `System.Windows.Controls` 命名空间，继承自 `RangeBase`（`System.Windows.Controls.Primitives`）。确定模式下由 `Minimum`/`Maximum`/`Value`（均 `double`）定义进度比例；`IsIndeterminate="True"` 切换到不确定模式，显示循环动画表达"进行中"。`Orientation` 支持横向/纵向。Value 支持数据绑定，可绑定到后台任务进度属性。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.progressbar

> [!origin] 由来背景
> 进度条源自"任务需要时间"这一朴素认知：WinForms 的 ProgressBar 只有确定模式，且必须在 UI 线程内更新 Value，后台线程干活时想报进度还得用 Invoke 跨线程，代码繁琐。WPF 的 ProgressBar 在确定模式之外直接内置 `IsIndeterminate` 不确定模式，表达"耗时未知"不再需要额外动画；同时 Value 是可绑定依赖属性，配合 `INotifyPropertyChanged` 或 DispatcherTimer 即可从后台平滑更新。工业上位机里"固件升级、批量报表、通信握手"这类场景，靠它把"等待"变成"可预期"。

> [!essentials] 核心要点
> - **两种模式分场景**：总量已知用确定模式（Minimum/Maximum/Value），总量未知用不确定模式（IsIndeterminate）
> - **Value 三件套**：确定模式必须设好 `Minimum`、`Maximum`、`Value`，否则默认 0~100
> - **后台更新**：跨线程更新 Value 需走 `Dispatcher`（示例用 DispatcherTimer 模拟）
> - **百分比文本**：进度条本身不显示数字，需另配 TextBlock 显示 `{Value}%`
> - **IsIndeterminate 动画**：建立通信等"无总量"场景直接开启，避免假百分比误导
> - **Orientation 纵向**：`Orientation="Vertical"` 可实现竖向液位/填充指示

> [!example] 完整示例
> **批量导出进度演示：Value 百分比模式 + IsIndeterminate 不确定模式切换：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="进度展示 - ProgressBar" Height="320" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="批量导出运行数据：" Foreground="White"/>
>         <!-- 百分比模式：Minimum/Maximum/Value -->
>         <ProgressBar x:Name="bar" Minimum="0" Maximum="100" Value="0"
>                      Height="18" Margin="0,8,0,6"/>
>         <TextBlock x:Name="lblPercent" Text="0%" Foreground="#8B949E"
>                    HorizontalAlignment="Right"/>
>
>         <TextBlock Text="正在建立通信（不确定模式）：" Foreground="White" Margin="0,14,0,6"/>
>         <!-- 不确定模式：IsIndeterminate=True，动画滚动表示"进行中" -->
>         <ProgressBar IsIndeterminate="True" Height="18"/>
>
>         <Button x:Name="btnStart" Content="开始导出" Click="OnStart" Padding="8"
>                 Margin="0,18,0,0" HorizontalAlignment="Left"
>                 Background="#238636" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Threading;
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private int _progress;
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             btnStart.IsEnabled = false;
>             _progress = 0;
>             // 用 DispatcherTimer 模拟耗时任务推进进度条（真实项目用后台线程+回调）
>             var timer = new DispatcherTimer { Interval = new System.TimeSpan(0, 0, 0, 0, 100) };
>             timer.Tick += (s, args) =>
>             {
>                 _progress += 3;
>                 if (_progress >= 100)
>                 {
>                     _progress = 100;
>                     timer.Stop();
>                     btnStart.IsEnabled = true;
>                 }
>                 bar.Value = _progress;
>                 lblPercent.Text = $"{_progress}%";
>             };
>             timer.Start();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 批量导出/导入：导出报表、导入配方时显示百分比进度
> ✅ 固件升级/文件下载：总量已知，确定模式展示完成度
> ✅ 通信握手/建立连接：耗时未知，`IsIndeterminate` 表示"进行中"
> ✅ 批量下发参数：逐台设备下发时进度条跟踪"第 N/M 台"
> ❌ 任务极快（<0.5s）无需进度条（闪一下反而干扰）
> ❌ 纯静态指示（用状态 TextBlock + 颜色即可，别用进度条）

> [!pitfall] 常见踩坑
> 坑 1：**不知道总量却硬用确定模式** → 进度跳到 99% 卡半天。原因：总任务数不可预估。解决：改用 `IsIndeterminate="True"`，别用假百分比
>
> 坑 2：**后台线程直接改 `Value` 抛异常** → "调用线程无法访问此对象"。原因：UI 元素只能在 UI 线程更新。解决：用 `Dispatcher.BeginInvoke` 或绑定 `INotifyPropertyChanged` 属性
>
> 坑 3：**进度条不动/不走** → 看起来卡死。原因：耗时任务在 UI 线程同步执行，进度永远没机会刷新。解决：耗时逻辑放后台线程（Task/Thread），UI 只做显示
>
> 坑 4：**进度与文本不同步** → 显示 50% 但数字 45%。原因：两处独立更新有先后。解决：统一在同一个回调里更新 `bar.Value` 与 `lblPercent.Text`（示例即此模式）

> [!best] 最佳实践
> - 先问"总量可知吗"：可知用确定模式，不可知用 `IsIndeterminate`
> - 后台任务进度通过属性绑定或 Dispatcher 回 UI，别在 UI 线程做耗时计算
> - 进度百分比文本单独放 TextBlock，进度条本身不显示数字
> - 完成时置 100% 并保持 300ms 再隐藏，避免"闪一下就消失"的视觉抖动
> - 大批量任务用"每完成 1% 更新一次"，避免每项都触发布局刷新

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"开始导出"观察进度条与百分比联动
> **Lv.2 小试牛刀**：把导出进度改成真实业务：模拟导出 50 条记录，每条完成后 Value+2，并显示"已完成 i/50"
> **Lv.3 融会贯通**：实现"连接超时进度"：连接设备 10 秒超时，用不确定模式 + 剩余秒数文本提示
> **Lv.4 挑战**：把进度条绑定到 ViewModel 属性（`Progress`），后台 `Task.Run` 模拟下载，用 `IProgress<double>` 汇报进度，全程不写 UI 引用

> [!related] 相关知识链接
> - ← 前置知识：第 5 章「什么是数据绑定」理解 Value 绑定；「textblock-轻量文本」显示百分比文字
> - → 后续必学：「slider-滑块」「scrollbar-滚动条」是同族 RangeBase 控件
> - ⇄ 关联概念：「statusbar-状态栏」常嵌入迷你进度条；「messagebox-消息弹窗」完成时提示
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.progressbar
