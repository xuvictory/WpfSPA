---
title: MediaElement 媒体播放器
section: 04-controls
parent: 4.6 日期与信息显示控件
---

# MediaElement 媒体播放器

> [!plain] 白话理解
> 现场监控视频、设备操作培训录像、报警联动回放——上位机要在界面里嵌视频。`MediaElement` 就是 WPF 内置的媒体播放控件：给它一个 `Source`，它就能播放本地视频/音频文件。
> 控制逻辑很直观：`Play()`/`Pause()`/`Stop()` 对应播放/暂停/停止，`SpeedRatio` 调倍速，`LoadedBehavior`/`UnloadedBehavior` 定义"媒体加载后/控件卸载时"自动干什么。对工业现场，最常见的坑是"文件格式与编码不支持"——MediaElement 依赖系统 WMF 解码器，H.264 等格式需额外组件支持。

> [!def] 官方定义
> MediaElement 是 WPF 中用于"播放音频与视频"的控件，位于 `System.Windows.Controls` 命名空间。核心属性：`Source`（媒体 URI）、`LoadedBehavior`/`UnloadedBehavior`（`MediaState`：`Manual`/`Play`/`Pause`/`Stop`/`Close`，决定媒体就绪与卸载时的行为）、`SpeedRatio`（播放速率）、`Stretch`（画面缩放）、`IsMuted`/`Volume`（音量）。核心方法 `Play()`/`Pause()`/`Stop()`/`Close()`。底层依赖 Windows Media Foundation（WMF）解码器，支持格式受系统编解码器限制。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.mediaelement

> [!origin] 由来背景
> 在 WPF 之前，WinForms 嵌入视频要靠 Windows Media Player 的 ActiveX 控件：COM 组件、事件模型笨重、与 .NET 类型体系割裂。WPF 把媒体播放封装成第一类控件 MediaElement：`Source` + `Play/Pause/Stop` 声明式控制，`LoadedBehavior` 自动播放/手动控制由属性表达，倍速（SpeedRatio）、音量（Volume）都是依赖属性，可绑定。它建立在 WMF（Windows Media Foundation）之上，与系统媒体能力天然集成。工业 HMI 的"监控回放、培训视频、报警联动画面"因此无需第三方播放器即可嵌入。

> [!essentials] 核心要点
> - **Source + 方法控制**：设 `Source` 指定媒体，`Play()`/`Pause()`/`Stop()` 控制播放
> - **LoadedBehavior=Manual**：示例手写播放按钮时必须设 `Manual`，否则媒体自动播放/自动暂停
> - **UnloadedBehavior**：控件卸载时自动 `Stop`/`Close`，释放媒体资源
> - **SpeedRatio 倍速**：`2.0` 双倍速播放（监控回放常用 1x/2x/4x）
> - **格式兼容**：支持 WMV/WMA/MP3 等 WMF 原生格式；MP4/H.264 需系统装对应解码器
> - **不阻塞 UI**：播放与解码在后台进行，UI 线程不卡

> [!example] 完整示例
> **现场监控视频回放演示：LoadedBehavior/UnloadedBehavior、Play/Pause/Stop 控制、倍速播放：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="监控回放 - MediaElement" Height="480" Width="680"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="12">
>         <!-- 视频区：Source 指向视频文件 -->
>         <MediaElement x:Name="player" DockPanel.Dock="Top" Height="340"
>                       Source="videos/camera1.mp4" LoadedBehavior="Manual"
>                       UnloadedBehavior="Stop" Stretch="Uniform" Margin="0,0,0,10"
>                       Background="Black"/>
>
>         <!-- 控制条 -->
>         <StackPanel DockPanel.Dock="Bottom" Orientation="Horizontal" HorizontalAlignment="Center">
>             <Button Content="播放" Click="OnPlay" Padding="12,6" Margin="0,0,8,0"/>
>             <Button Content="暂停" Click="OnPause" Padding="12,6" Margin="0,0,8,0"/>
>             <Button Content="停止" Click="OnStop" Padding="12,6" Margin="0,0,8,0"/>
>             <Button Content="2 倍速" Click="OnSpeed" Padding="12,6"/>
>         </StackPanel>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnPlay(object sender, RoutedEventArgs e) => player.Play();
>
>         private void OnPause(object sender, RoutedEventArgs e) => player.Pause();
>
>         private void OnStop(object sender, RoutedEventArgs e) => player.Stop();
>
>         private void OnSpeed(object sender, RoutedEventArgs e)
>         {
>             // 设置播放速率（1.0 为正常速度）
>             player.SpeedRatio = player.SpeedRatio >= 2.0 ? 1.0 : player.SpeedRatio + 0.5;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 监控视频回放：本地录像文件回放（播放/暂停/停止/倍速）
> ✅ 操作培训视频：内置教学视频播放
> ✅ 报警联动画面：报警发生时自动播放关联录像
> ✅ 音频提示：报警蜂鸣/语音播报（`Volume`/`IsMuted` 控制）
> ❌ 需要流媒体/RTSP 实时监控（MediaElement 不支持流协议，需第三方库）
> ❌ 需要字幕/弹幕等复杂播放器功能（用成熟的播放控件）

> [!pitfall] 常见踩坑
> 坑 1：**MP4/H.264 播不了** → 黑屏或报"找不到解码器"。原因：MediaElement 依赖系统 WMF，H.264 需装 HEVC/解码扩展。解决：用 WMV/WMA 等 WMF 原生格式，或部署时确认解码器，或用第三方控件
>
> 坑 2：**设置了 Source 却自动播放** → 界面加载就开始放。原因：默认 `LoadedBehavior=Play`。解决：手写播放按钮时设 `LoadedBehavior="Manual"`
>
> 坑 3：**重复设置 Source 播放卡顿/残留** → 切换视频不干净。原因：旧媒体未关闭。解决：切换前 `player.Close()`，再赋新 Source 并 `Play()`
>
> 坑 4：**画面变形** → 视频被拉伸。原因：`Stretch` 默认 Fill。解决：`Stretch="Uniform"` 等比显示，黑边区域补背景

> [!best] 最佳实践
> - 明确部署环境解码能力：现场工控机装解码器列表要写进验收清单
> - 手动控制一律 `LoadedBehavior="Manual"` + `UnloadedBehavior="Stop"`，行为完全由代码决定
> - 切换视频先 `Close()` 再赋新 Source，防止媒体残留
> - 视频区用 `Stretch="Uniform"` + 黑背景，画面比例不失真
> - 播放控制按钮（播放/暂停/停止）用「button-按钮」+ 图标按钮风格，状态随播放状态联动

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，播放/暂停/停止一段 WMV 视频，点"2 倍速"体验倍速
> **Lv.2 小试牛刀**：加一个"重新播放"按钮：`Position = TimeSpan.Zero; Play()`；加"静音"CheckBox 绑 `IsMuted`
> **Lv.3 融会贯通**：实现"播放进度条"：DispatcherTimer 每秒读取 `player.Position` 同步到 ProgressBar/Slider
> **Lv.4 挑战**：实现"报警联动回放"：报警列表中双击记录，自动加载该时段的录像文件并播放（文件名含时间戳规则）

> [!related] 相关知识链接
> - ← 前置知识：「button-按钮」播放控制；「slider-滑块」做播放进度条
> - → 后续必学：「image-图片显示」静态画面；「openfiledialog-打开文件对话框」选择视频文件
> - ⇄ 关联概念：「statusbar-状态栏」显示播放状态；「combobox-下拉选择框」切换摄像头/视频源
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.mediaelement
