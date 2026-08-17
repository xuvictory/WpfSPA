---
title: SoundPlayer 系统声音
section: 06-graphics
parent: 6.8 音频与视频
---

# SoundPlayer 系统声音

> [!plain] 白话理解
> SoundPlayer 是 Windows 自带的"轻量小喇叭"：把报警音、按键音这类 WAV 小文件丢给它，调用一下 `Play()` 就响，比 MediaElement 轻量得多，没有完整的媒体播放器包袱。工控场景里最典型的用法是"设备报警时循环响、解除报警就停"，再配上一盏红色状态灯，声光联动提醒操作员。

> [!def] 官方定义
> `System.Media.SoundPlayer`（程序集 System.Media）是 .NET Framework 2.0 起提供的小型音频类，用于播放 WAV 格式声音文件。构造可传 `SoundLocation`（文件路径/URL）或 `Stream`（资源流）；方法 `Load()`/`LoadAsync()`（预加载）、`Play()`（异步播放，不阻塞 UI）、`PlaySync()`（同步，阻塞调用线程）、`PlayLooping()`（循环）、`Stop()`；属性 `SoundLocation`、`IsLoadCompleted`。只支持 WAV（PCM 为主），不支持 mp3/wma。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.media.soundplayer

> [!origin] 由来背景
> SoundPlayer 脱胎于 .NET Framework 2.0（2005 年）引入的 System.Media 命名空间，本质是 Win32 `sndPlaySound` API 的托管封装。设计动机是给桌面应用一个"播个提示音"的极简入口，不必为此引入完整的媒体播放组件。WPF 沿用了这套 API，因为上位机的报警音、提示音恰恰是短小的 WAV 文件，用 SoundPlayer 恰到好处——省内存、启动快、接口只有几个方法。

> [!essentials] 核心要点
> - **只认 WAV**：PCM 编码的 .wav 文件，mp3/wma/ogg 一律播不出声
> - **异步优先**：`Play()` 异步不阻塞 UI 线程；`PlaySync()` 会卡住调用线程，慎用于界面按钮
> - **预加载**：`Load()`/`LoadAsync()` 把声音先读进内存，首次播放不卡顿
> - **循环报警**：`PlayLooping()` 循环响，配合 `Stop()` 做"报警→解除"联动
> - **资源加载**：既支持磁盘路径（SoundLocation），也支持嵌入资源流（Stream），部署不丢文件

> [!example] 完整示例
> **报警提示音演示：用 SoundPlayer 播放 WAV 格式报警音（同步/异步两种方式），并结合状态灯联动提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="报警音 - SoundPlayer" Height="380" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="报警提示音（SoundPlayer）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <StackPanel Grid.Row="1" HorizontalAlignment="Center" VerticalAlignment="Center">
>             <Ellipse x:Name="AlarmLamp" Width="80" Height="80" Fill="#21262D"
>                      Stroke="#30363D" StrokeThickness="3"/>
>             <TextBlock x:Name="AlarmText" Text="无报警" Foreground="#8B949E" FontSize="18"
>                        HorizontalAlignment="Center" Margin="0,12,0,0"/>
>         </StackPanel>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,12,0,0">
>             <Button Content="触发报警" Click="OnAlarm" Padding="10" Background="#DA3633"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="解除报警" Click="OnReset" Padding="10" Background="#238636"
>                     Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Media;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 加载 WAV 文件（可换成自己的报警音资源）
>         private readonly SoundPlayer _player = new SoundPlayer("Assets/alarm.wav");
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnAlarm(object sender, RoutedEventArgs e)
>         {
>             AlarmLamp.Fill = new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33));
>             AlarmText.Text = "正在报警！";
>             AlarmText.Foreground = Brushes.OrangeRed;
>             // 异步播放：不阻塞 UI 线程
>             _player.Load();
>             _player.Play();
>         }
>
>         private void OnReset(object sender, RoutedEventArgs e)
>         {
>             AlarmLamp.Fill = new SolidColorBrush(Color.FromRgb(0x21, 0x26, 0x2D));
>             AlarmText.Text = "无报警";
>             AlarmText.Foreground = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>             _player.Stop();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 报警提示音：设备报警时循环播放，解除即停（最典型）
> ✅ 按键反馈音：操作工点击按钮时"滴"一声确认
> ✅ 测试/自检音效：设备自检时发出对应状态音
> ✅ 语音播报前的"嘟"提示音，引导操作员注意
> ❌ 长语音播报（几十秒以上）：用 mediaelement-媒体播放 或语音合成
> ❌ mp3/wma 背景音乐：SoundPlayer 只支持 WAV，需转格式或换 MediaElement

> [!pitfall] 常见踩坑
> 坑 1：**扔个 mp3 进去没声音** → 现象：`Play()` 调用无异常但就是不响 → 原因：SoundPlayer 只支持 WAV（PCM），mp3/wma 静默失败 → 解决：把音频转成 WAV（格式→PCM），或改用 MediaElement 播放 mp3
> 
> 坑 2：**首次播放卡顿一下** → 现象：第一次点按钮声音延迟/界面顿一下，之后正常 → 原因：`Play()` 前没 `Load()`，首次播放临时读盘 → 解决：窗口初始化时 `_player.Load()` 预加载，或用 `LoadAsync()` 异步加载
>
> 坑 3：**报警音停不下来** → 现象：`PlayLooping()` 后怎么都停不掉 → 原因：循环播放后忘了 `Stop()`，或重复 new 了多个播放器实例 → 解决：报警解除时显式 `Stop()`；全局只用一个 SoundPlayer 实例管理报警音

> [!best] 最佳实践
> - 报警音走"全局单实例"：程序里只 new 一个 SoundPlayer，报警/解除只调 Play/Stop，避免多实例混响
> - 音频做成项目资源（Content 属性），用绝对路径或流加载，部署到工控机不丢文件
> - 报警音文件尽量小：16bit 采样、时长 1 秒以内，打包体积和加载都轻
> - 界面按钮一律用 `Play()` 异步，绝不用 `PlaySync()`（会卡死 UI 线程）
> - 音量控制：SoundPlayer 没有音量属性，需要独立音量时改用 MediaElement 的 Volume

> [!practice] 上手练习
> **Lv.1 运行体验**：运行示例，触发报警/解除报警，听声音与看状态灯联动
> **Lv.2 动手改造**：把 `Play()` 换成 `PlayLooping()`，实现"报警循环响、解除才停"
> **Lv.3 综合实战**：报警时状态灯变红 + 循环报警音，解除时灯变绿 + Stop，模拟完整声光报警
> **Lv.4 挑战进阶**：用 `LoadAsync()` 异步预加载，并增加"音效开关"（Mute 时只闪灯不出声）

> [!related] 相关知识链接
> - ← 前置知识：mediaelement-媒体播放 长音频方案；image-控件 资源嵌入与加载方式
> - → 后续必学：上位机音频场景 两类音频的组合与互斥
> - ⇄ 关联概念：第 7 章「命令与路由事件」按钮触发；第 5 章「什么是样式」状态灯样式统一
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.media.soundplayer
