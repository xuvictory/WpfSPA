---
title: MediaElement 媒体播放
section: 06-graphics
parent: 6.8 音频与视频
---

# MediaElement 媒体播放

> [!plain] 白话理解
> MediaElement 就像给上位机"装了一台播放器"：把一段 mp4/wmv 培训视频或 mp3 语音放到界面上，它就能直接出画面、出声。你可以把它当成一个"能播媒体的普通控件"，摆个播放/暂停/停止按钮、拖一个音量滑块，操作培训视频、语音播报这类功能就齐了。它和 SoundPlayer 的区别在于：SoundPlayer 只播 WAV 短音，MediaElement 是"能出画面的大播放器"。

> [!def] 官方定义
> `System.Windows.Controls.MediaElement` 继承自 `FrameworkElement`，是对 Windows 媒体播放管线的托管封装，负责音视频的加载、解码与渲染。核心成员：`Source`（媒体 Uri）、`LoadedBehavior`/`UnloadedBehavior`（枚举 `MediaState`：Manual/Play/Pause/Stop/Close，决定媒体加载后是否自动播放）、`Position`、`Volume`、`SpeedRatio`、`Balance`、`Stretch`；事件 `MediaOpened`、`MediaEnded`、`MediaFailed`、`MediaError`。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.mediaelement

> [!origin] 由来背景
> MediaElement 随 WPF（.NET Framework 3.0，2006 年）发布，设计动机是让托管应用无需直接面对底层的媒体管线（解码、渲染、同步）即可播放音视频。它早期封装 Windows Media Player 组件，后期底层迁移到 Windows Media Foundation。对工控上位机而言，它提供了"把培训视频、产品演示、语音播报直接嵌进 XAML 界面"的能力，且能与其他 WPF 元素（按钮、滑块、特效）自由组合。

> [!essentials] 核心要点
> - **Source**：指定媒体地址（相对路径、绝对路径或 pack URI），运行时可切换
> - **LoadedBehavior/UnloadedBehavior**：设为 `Manual` 后播放完全由代码控制，否则自动播放，两者搭配 MediaOpened 事件最稳
> - **生命周期事件**：`MediaOpened`（就绪）、`MediaEnded`（播完）、`MediaFailed`（失败），监听状态做联动
> - **控制 API**：`Play()`/`Pause()`/`Stop()`，`Position` 可定位、`Volume`（0~1）调音量、`SpeedRatio` 调倍速
> - **格式限制**：只支持 Windows Media 能解的格式（wmv/mp4(h264)/avi/mp3/wav），mkv、flv 不支持

> [!example] 完整示例
> **操作培训视频演示：用 MediaElement 播放视频并控制播放/暂停/停止/音量，LoadedBehavior 与媒体事件协同：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="培训视频 - MediaElement" Height="460" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备操作培训视频" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- MediaElement：Source 指定视频，LoadedBehavior=Manual 由代码控制播放 -->
>         <Border Grid.Row="1" Margin="0,10,0,0" CornerRadius="6" Background="#161B22" BorderBrush="#30363D" BorderThickness="1">
>             <MediaElement x:Name="Player" Source="Assets/training.mp4"
>                           LoadedBehavior="Manual" UnloadedBehavior="Manual"
>                           Stretch="Uniform" MediaOpened="OnMediaOpened"/>
>         </Border>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="播放" Click="OnPlay" Padding="10" Background="#238636" Foreground="White" Margin="0,0,8,0"/>
>             <Button Content="暂停" Click="OnPause" Padding="10" Background="#21262D" Foreground="White" Margin="0,0,8,0"/>
>             <Button Content="停止" Click="OnStop" Padding="10" Background="#DA3633" Foreground="White" Margin="0,0,16,0"/>
>             <TextBlock Text="音量" Foreground="#8B949E" VerticalAlignment="Center" Margin="0,0,6,0"/>
>             <Slider x:Name="VolumeSlider" Width="140" Minimum="0" Maximum="1" Value="0.6"
>                     ValueChanged="OnVolumeChanged" VerticalAlignment="Center"/>
>         </StackPanel>
>     </Grid>
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
>         }
>
>         private void OnMediaOpened(object sender, RoutedEventArgs e)
>         {
>             // 媒体打开后设置初始音量
>             Player.Volume = VolumeSlider.Value;
>         }
>
>         private void OnPlay(object sender, RoutedEventArgs e) => Player.Play();
>         private void OnPause(object sender, RoutedEventArgs e) => Player.Pause();
>         private void OnStop(object sender, RoutedEventArgs e)
>         {
>             Player.Stop();
>             Player.Position = System.TimeSpan.Zero;
>         }
>
>         private void OnVolumeChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
>         {
>             if (Player != null) Player.Volume = VolumeSlider.Value;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 操作培训视频：设备保养/换料流程演示，循环播放挂在看板旁
> ✅ 语音播报：mp3 格式的"设备完成/缺料提醒"，自动或按事件触发
> ✅ 开机引导：首次开机播放操作指引视频（wmv）
> ✅ 产品演示：展会/验收时大屏循环播放设备宣传片
> ❌ 只需"滴"一声的短提示音：用 soundplayer-系统声音 更轻
> ❌ 需要精确逐帧处理的视频分析：MediaElement 不具备视频帧处理能力

> [!pitfall] 常见踩坑
> 坑 1：**视频没声音或黑屏** → 现象：画面正常但无声，或只有声音没有画面 → 原因：媒体编码不被系统支持（如 mkv/h265），或音量被设为 0 → 解决：统一转码为 h264 的 mp4/wmv；确认 `Volume` 与系统音量未静音
> 
> 坑 2：**播放按钮点了没反应** → 现象：点击"播放"视频不动 → 原因：`LoadedBehavior="Play"` 下 UI 未布局完成就播，或媒体还没加载完就调 Play → 解决：用 `LoadedBehavior="Manual"`，在 `MediaOpened` 事件后再 `Play()`（示例已示范）
>
> 坑 3：**播完一次后无法重播** → 现象：`MediaEnded` 后再次 Play() 无效果 → 原因：媒体停在末尾，Play() 不会自动回到开头 → 解决：重播前先 `Stop()` 并把 `Position = TimeSpan.Zero` 再 `Play()`（示例 OnStop 已示范）

> [!best] 最佳实践
> - 视频资源用 pack URI（`pack://application:,,,/Assets/training.mp4`）或 Content 方式，避免相对路径部署后失效
> - 统一 `LoadedBehavior="Manual"`，播放全部由代码控制，杜绝自动播放竞态
> - 循环播放培训视频：在 `MediaEnded` 里"Stop + Position=0 + Play"，或设 `Position` 后重播
> - 长语音播报用 `Visibility="Hidden"` 隐藏画面（如上位机音频场景），不占界面
> - 播放大文件前监听 `MediaOpened` 再启动 UI 控件（如音量滑块赋值），避免未就绪异常

> [!practice] 上手练习
> **Lv.1 运行体验**：运行示例，点播放/暂停/停止/拖音量，确认视频与声音同步可控
> **Lv.2 动手改造**：增加"循环播放"复选框——勾选后 `MediaEnded` 自动重播
> **Lv.3 综合实战**：加一个倍速 Slider（SpeedRatio 0.5~2.0），实现培训视频 1.5 倍速快学
> **Lv.4 挑战进阶**：做一个"培训考试系统"：视频播完后自动显示"开始答题"按钮，答完记录成绩并归档

> [!related] 相关知识链接
> - ← 前置知识：soundplayer-系统声音 短音效与长音频的分工；image-控件 资源加载与 pack URI
> - → 后续必学：上位机音频场景 把两类音频组合成完整方案
> - ⇄ 关联概念：第 7 章「什么是数据绑定」播报内容数据驱动；第 8 章「线程与调度」UI 与播放线程
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.mediaelement
