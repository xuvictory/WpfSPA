---
title: HandyControl
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# HandyControl

> [!plain] 白话理解
> 如果说 MaterialDesignInXAML 是"装修队"，那么 **HandyControl** 就是"全屋定制的家具厂"——同样是开源 WPF 控件库，它给上位机界面提供的控件更全：卡片、分组框、时钟、气泡通知（Growl）、步骤条、环形进度条、侧边菜单样样都有，且**中文文档和中文社区支持更友好**。对做设备监控、参数面板、报警列表的上位机项目来说，用它搭界面基本不用再手写复杂样式。

> [!def] 官方定义
> **HandyControl** 是一个**社区开源**的 WPF 控件库（GitHub：https://github.com/HandyOrg/HandyControl ，NuGet：`HandyControl`），基于 .NET Framework 4.5+ 与 .NET Core/.NET 5+，内置 80+ 常用控件与样式。它**不是微软官方产物**，但提供了官方控件库没有的增强控件（如 `Growl` 气泡通知、`Card` 卡片、`SimplePagination` 分页）与一整套视觉主题（浅色/深色），官网：https://handyorg.github.io/handycontrol/ 。它与微软官方 WPF 控件（`System.Windows.Controls`，见 https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/ ）互补：官方控件保底，HandyControl 提供更现代的交互体验。

> [!origin] 由来背景
> HandyControl 由国内开发者 NaBian（SangDrac）于 2018 年前后发起，最初源于作者在 WPF 项目中反复编写相同样式与控件的痛点，于是把积累的样式整理成开源库。因其**中文文档、控件数量多、上手快**，很快成为国内 WPF 社区最流行的控件库之一（GitHub Star 数位居 WPF 控件库前列），并持续维护至今。上位机行业大量使用它做设备看板、参数配置界面，形成"HandyControl 搭界面 + MVVM 框架管逻辑"的主流组合。

> [!essentials] 核心要点
> - **引入资源**：安装包后在 `App.xaml` 合并 `pack://application:,,,/HandyControl;component/Themes/SkinDefault.xaml` 与 `Theme.xaml`，全局生效
> - **Card 卡片**：`<hc:Card>` 自带圆角与阴影，适合做设备状态卡片
> - **Growl 通知**：`Growl.Success("已保存")` / `Growl.Error("通信超时")` 右上角气泡提醒，替代 `MessageBox` 更不打断操作
> - **主题切换**：`hc:Skin` 资源配合 `Application.Current.Resources["Skin"] = SkinType.Dark` 一键切换深浅色
> - **内置图标与样式**：通过 `hc:IconElement` 使用内置矢量图标；控件 `Style` 均以 `{StaticResource}` 形式可整体覆盖
> - **MVVM 友好**：大量控件支持 `Command` 绑定，与 `communitytoolkitmvvm` 搭配无需写事件

> [!example] 完整示例
> **HandyControl 卡片控件与设备状态演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:hc="https://handyorg.github.io/handycontrol"
>         Title="HandyControl 演示" Height="420" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="HandyControl 卡片控件" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <UniformGrid Columns="2" Margin="0,0,0,10">
>             <hc:Card Background="#161B22" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="1 号泵" Foreground="#8B949E"/>
>                     <TextBlock x:Name="Pump1Status" Text="运行中" Foreground="#238636" FontSize="16" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </hc:Card>
>             <hc:Card Background="#161B22" CornerRadius="6" Margin="4">
>                 <StackPanel>
>                     <TextBlock Text="2 号泵" Foreground="#8B949E"/>
>                     <TextBlock x:Name="Pump2Status" Text="已停止" Foreground="#DA3633" FontSize="16" Margin="0,6,0,0"/>
>                 </StackPanel>
>             </hc:Card>
>         </UniformGrid>
>         <Button Content="切换 1 号泵状态" Click="OnToggleClick" Margin="0,0,0,8" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 HandyControl 包（Install-Package HandyControl）
>         private bool _running = true;
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnToggleClick(object sender, RoutedEventArgs e)
>         {
>             _running = !_running;
>             if (_running)
>             {
>                 Pump1Status.Text = "运行中";
>                 Pump1Status.Foreground = Brushes.LimeGreen;
>                 StatusText.Text = "1 号泵已启动";
>             }
>             else
>             {
>                 Pump1Status.Text = "已停止";
>                 Pump1Status.Foreground = Brushes.OrangeRed;
>                 StatusText.Text = "1 号泵已停止";
>             }
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 设备状态看板（Card + 状态色组合，一眼可读）
> ✅ 参数设置、配方管理页面（表单控件齐全）
> ✅ 报警列表与气泡通知（Growl 不打断操作）
> ✅ 需要一键切换深浅色主题的交付项目
> ❌ 需要与老款工控机系统风格完全统一的老项目改造
> ❌ 团队已有成熟自定义 UI 规范、不想被控件库样式约束的项目

> [!pitfall] 常见踩坑
> 坑 1：**忘记合并主题资源导致样式错乱** → 现象：控件显示异常或编译提示找不到 `SkinDefault.xaml` 资源 → 原因：只装了 NuGet 包，没在 `App.xaml` 合并 HandyControl 主题 → 解决：在 `App.xaml` 中依次合并 `pack://application:,,,/HandyControl;component/Themes/SkinDefault.xaml` 与 `Theme.xaml`
>
> 坑 2：**Growl 在非主窗口弹不出来** → 现象：在子窗口调用 `Growl.Info` 无显示或弹到主窗口 → 原因：`Growl` 依赖主窗口的 `GrowlPanel` 挂载位置 → 解决：在主窗口 XAML 中显式放置 `<hc:GrowlPanel/>`，或用 `Growl.InfoGlobal` 全局弹窗
>
> 坑 3：**与 MaterialDesignInXAML 同时引用冲突** → 现象：两库都定义了同名 `ResourceDictionary` 键或样式优先级混乱 → 原因：两套主题同时合并互相覆盖 → 解决：一个项目只选一套控件库做主题基础，另一套只用于个别控件（或干脆统一用 HandyControl）

> [!best] 最佳实践
> - 在 `App.xaml` 统一引入主题资源，避免每个窗口单独引入造成样式漂移
> - 状态类提示优先用 `Growl`，`MessageBox` 只留给"必须阻断操作"的确认场景
> - 设备状态卡片统一用 `Card` + 三色状态（绿运行/红停止/黄告警），配合模板复用
> - 深浅色主题用 `hc:Skin` 资源切换，避免硬编码颜色导致换肤后界面难看
> - 升级 HandyControl 版本前查看 GitHub Releases 的 Breaking Changes，老项目锁版本

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把 1 号泵状态色从绿色改成黄色，观察刷新效果
> **Lv.2 小试牛刀**：给示例页面加一个 `hc:Growl.Success("参数已保存")`，替换原来的 `StatusText` 提示
> **Lv.3 融会贯通**：用 `hc:Card` 把示例改造为 4 台设备状态看板，并实现一键"全部启动/全部停止"
> **Lv.4 拆层挑战**：独立搭建一个包含设备卡片、报警列表、Growl 通知三块区域的监控页面，全部用 HandyControl 控件 + MVVM 命令完成

> [!related] 相关知识链接
> - ← 前置知识：[`什么是样式`](什么是样式)、[`资源字典`](资源字典)（05-core-concepts）
> - → 后续必学：[`materialdesigninxaml`](materialdesigninxaml)（另一套主流控件库，风格对比）
> - ⇄ 关联概念：[`livecharts2`](livecharts2)（曲线可视化搭配）、`什么是-mvvm`（07，命令绑定基础）
> - 📖 官方文档：https://github.com/HandyOrg/HandyControl ；官网：https://handyorg.github.io/handycontrol/
