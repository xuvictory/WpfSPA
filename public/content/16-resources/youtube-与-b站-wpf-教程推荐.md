---
title: YouTube 与 B 站 WPF 教程推荐
section: 16-resources
parent: 16.4 在线教程与文档
---

# YouTube 与 B 站 WPF 教程推荐

> [!plain] 白话理解
> 看文字教程容易"看着会、写不会"，视频教程则像**师傅带徒弟**：人家一边敲代码一边讲思路，你跟着敲一遍，很多"只可意会"的技巧就懂了。YouTube 和 B 站上有大量免费 WPF 教程，从"Hello World"到"完整项目实战"都有。**选对 UP 主/博主，相当于请了个免费私教。**

> [!def] 官方定义
> **YouTube 与 B 站（bilibili）**是第三方视频平台上的 **WPF 教程资源**（不是微软官方渠道）。代表性内容：
> - **YouTube**：`AngelSix`（Angelo Belchambers）的完整 WPF 系列教程（从零到项目，讲得细致）；`SingletonSean` 的 WPF/MVVM 系列；`IAmTimCorey` 的 C#/.NET 入门（英文，逻辑清晰）
> - **B 站**：大量"WPF 入门到精通""WPF 上位机开发"系列，多位 UP 主以真实上位机/工控项目为素材（设备监控、串口通信、Modbus 调试等）
> - 微软官方也有部分 WPF 演示视频发布在其 YouTube 频道（https://www.youtube.com/@dotnet ）
>
> 注意：视频教程**非官方、可能过时**，学习时以代码能运行为准，术语与 API 以官方文档（https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/ ）为准。

> [!origin] 由来背景
> WPF 视频教程的兴起与 WPF 自身"演示效果直观"的特性有关：WPF 界面在视频里看得见摸得着，比抽象语言更适合视频教学。2010 年代 YouTube 上 `AngelSix` 等博主开始做完整 WPF 系列，风格"边写边讲"，成为英文社区经典。国内 B 站自 2015 年起涌现大量 .NET/WPF 教程，且**比英文频道更贴近工控场景**（串口、PLC、上位机），深受工程师欢迎。视频教程弥补了文档"缺乏演示过程"的短板，成为入门者最友好的学习方式。

> [!essentials] 核心要点
> - **选材标准**：看"发布年份 + 框架版本 + 评论反馈"，避开过老教程（.NET Framework 专属 API）
> - **跟练方式**：一行行跟着敲，不暂停不看效果，等于白看
> - **项目向优先**：优先选"完整项目实战"（上位机、串口、看板），比纯语法演示收益大
> - **英文能力**：YouTube 可开字幕 + 减速播放（0.75x），顺带练英文技术阅读
> - **B 站优势**：中文讲解、贴近国内工控场景、弹幕提问有热心解答
> - **时间管理**：视频学习"倍速 + 跟敲"，1 小时视频尽量 45 分钟内完成

> [!example] 完整示例
> **视频教程跟练成果演示：模仿教程完成"设备状态面板"：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="视频教程跟练演示" Height="360" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="跟练视频教程完成的设备状态面板" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <UniformGrid Columns="2" Margin="0,0,0,12">
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="1 号泵" Foreground="#8B949E"/>
>                     <Ellipse x:Name="Dot1" Width="14" Height="14" Fill="#238636" Margin="0,8,0,0"
>                              HorizontalAlignment="Left"/>
>                 </StackPanel>
>             </Border>
>             <Border Background="#161B22" Padding="10" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="2 号泵" Foreground="#8B949E"/>
>                     <Ellipse x:Name="Dot2" Width="14" Height="14" Fill="#DA3633" Margin="0,8,0,0"
>                              HorizontalAlignment="Left"/>
>                 </StackPanel>
>             </Border>
>         </UniformGrid>
>         <Button Content="切换 1 号泵状态" Click="OnToggleClick" Padding="8" Margin="0,0,0,8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Shapes;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private bool _running = true;
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnToggleClick(object sender, RoutedEventArgs e)
>         {
>             // 与教程一致的状态灯切换：运行绿 / 停止红
>             _running = !_running;
>             Dot1.Fill = _running ? Brushes.LimeGreen : Brushes.OrangeRed;
>             StatusText.Text = _running ? "1 号泵运行中" : "1 号泵已停止";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 入门期"边看边敲"建立手感
> ✅ 项目向实战教程（上位机、串口、看板）的跟练
> ✅ 文档看不下去时的"换口味"学习
> ✅ 上班通勤用手机刷概念（碎片学习）
> ❌ 已熟练 WPF 后的深度提升（视频性价比低于源码/文档）
> ❌ 需要精确查 API 的场景（视频效率远低于文档）

> [!pitfall] 常见踩坑
> 坑 1：**教程太旧，代码跑不起来** → 现象：照着老视频敲，`xxx` API 在新版找不到 → 原因：视频基于旧 .NET Framework/旧库版本 → 解决：选近 2 年发布的教程；报错时以官方文档对应版本为准改代码
>
> 坑 2：**只看不敲，手生** → 现象：收藏夹吃灰，看完忘光 → 原因：视频是被动学习 → 解决：必须暂停跟敲，每节视频产出一个小项目/片段
>
> 坑 3：**被"炫技式"教程带偏** → 现象：学了花哨动画/深奥技巧，基础却薄弱 → 原因：教程选题偏展示 → 解决：先扎实学官方文档/书籍的基础体系，视频只当补充

> [!best] 最佳实践
> - 按"项目导向"选教程：优先"上位机/串口/看板"完整项目，学完就有成品
> - 跟练时开 1.25~1.5 倍速 + 暂停跟敲，控制总时长
> - 每看一节，把代码整理进自己的项目并加注释，形成个人知识库
> - 弹幕/评论区找"同坑战友"，报错先搜"关键词 + WPF"看是否别人已解决
> - 学到的技巧回到 `microsoft-docs-wpf-官方文档` 验证一遍，确保 API 没记错

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，跟敲一遍并给代码加中文注释
> **Lv.2 小试牛刀**：找一个 B 站上位机项目视频，跟到"串口收发"部分并跑通
> **Lv.3 融会贯通**：把视频里学的某个技巧（如状态灯、曲线）整合进自己的监控页面
> **Lv.4 拆层挑战**：给团队新人挑选 3 个高质量 WPF 教程视频并写一份"跟练清单"（含练习任务）

> [!related] 相关知识链接
> - ← 前置知识：[`microsoft-docs-wpf-官方文档`](microsoft-docs-wpf-官方文档)（验证工具）
> - → 后续必学：[`博客园与-csdn`](博客园与-csdn)（图文笔记沉淀）
> - ⇄ 关联概念：[`net-中文社区与知乎`](net-中文社区与知乎)（答疑与讨论）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/ ；.NET 官方频道：https://www.youtube.com/@dotnet
