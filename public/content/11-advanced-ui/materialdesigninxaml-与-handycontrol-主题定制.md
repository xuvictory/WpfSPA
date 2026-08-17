---
title: MaterialDesignInXAML 与 HandyControl 主题定制
section: 11-advanced-ui
parent: 11.3 主题与换肤
---

# MaterialDesignInXAML 与 HandyControl 主题定制

> [!plain] 白话理解
> 第三方控件库像**外购的标准件**：不用自己车螺丝、铣齿轮，直接选型装配就行。`MaterialDesignInXAML` 是"谷歌 Material 风格"的一整套标准件——卡片、悬浮按钮、开关，自带光影和圆角；`HandyControl` 是"国产工控风格"的一整套标准件——仪表盘、进度条、呼吸灯、弹层，更贴近工业上位机的操作习惯。两者都能在 `App.xaml` 里合并它们的主题资源字典，然后用 `md:`/`hc:` 前缀直接用它们控件。示例把两家"标准件"装进同一个面板：`md:Card` 放按钮开关，`hc:Gauge` 显示转速，一个开关联动另一个库的仪表——风格混搭，各取所长。

> [!def] 官方定义
> **MaterialDesignInXAML**：开源 WPF 控件库（GitHub: MaterialDesignInXAML/MaterialDesignInXAML，NuGet 包 `MaterialDesignThemes`），将 Google Material Design 规范实现为 WPF 控件与主题，通过 `pack://` 方式合并 `MaterialDesignTheme.Light/Dark.xaml` 与 `MaterialDesign2.Defaults.xaml` 资源字典启用。**HandyControl**：国产开源 WPF 控件库（GitHub: HandyOrg/HandyControl，NuGet 包 `HandyControl`），提供 Gauge、ProgressBar、Card、Growl、RangeSlider 等工控风格控件，通过合并 `SkinDefault.xaml` + `Theme.xaml` 启用，支持 `hc:Skin` 皮肤机制。两者均基于标准 WPF 资源系统，可共存。详见官方仓库：MaterialDesignInXAML 文档（github.com/MaterialDesignInXAML/MaterialDesignInXAML）、HandyControl 文档（handyorg.github.io/handycontrol）。

> [!origin] 由来背景
> WPF 原生控件（2006 年随 .NET Framework 3.0 发布）功能完整但外观朴素、样式老化，而工业上位机需要的是"直观、醒目、耐看"的界面语言。**MaterialDesignInXAML** 2014 年前后诞生，把谷歌的 Material Design（2014 年发布）扁平化、卡片化设计语言移植到 WPF，提供完整主题与动效；**HandyControl** 则由中国开发者团队于 2017 年发起，针对国内工控/桌面项目常见的"仪表、状态、弹层、导航"需求做了大量本土化控件，文档与社区均为中文，是目前国内 WPF 项目中应用最广的开源控件库之一。两者把"主题定制"从"自己写整套资源字典"降级为"合并资源 + 选控件"。

> [!essentials] 核心要点
> - **安装**：NuGet 安装 `MaterialDesignThemes` 与 `HandyControl` 两个包；XAML 声明命名空间 `xmlns:md="http://materialdesigninxaml.net/winfx/xaml/themes"`、`xmlns:hc="https://handyorg.github.io/handycontrol"`
> - **资源合并**：`App.xaml` 的 `MergedDictionaries` 依次合并 Material 的 `MaterialDesignTheme.Light/Dark.xaml` + `MaterialDesign2.Defaults.xaml`，以及 Handy 的 `SkinDefault.xaml` + `Theme.xaml`（示例注释有完整 Source 写法）
> - **主题切换**：Material 用 `PaletteHelper` 切换 `Theme`；HandyControl 用 `SkinManager.Current.Skin` 切换皮肤（`Default`/`Dark`/`Violet` 等）
> - **特色控件**：Material 提供 `md:Card`/`md:Button`/`md:ToggleButton`/`md:Snackbar`/`md:DialogHost`；Handy 提供 `hc:Gauge`/`hc:ProgressBar`/`hc:Card`/`hc:Growl`/`hc:RangeSlider`
> - **混用注意**：两库都会接管全局控件默认样式，混用时注意资源合并顺序与样式覆盖；控件默认样式冲突时显式指定 `Style`
> - **主题色定制**：通过 `PaletteHelper`/`SkinManager` 的 API 读取主题色并替换（对应"主题定制"）

> [!example] 完整示例
> **第三方库主题定制演示：在同一个窗口同时引入 MaterialDesignInXAML（md: 命名空间）与 HandyControl（hc: 命名空间），合并两者主题资源字典，用各自的特色控件构建上位机监控面板。运行前需通过 NuGet 安装 MaterialDesignThemes 与 HandyControl 两个包：**
>
> **MainWindow.xaml：**
> ```xml
> <!-- 前置准备：
>      1. NuGet 安装 MaterialDesignThemes（提供 materialDesign 资源字典与 md: 控件）
>      2. NuGet 安装 HandyControl（提供 hc: 控件与皮肤资源字典）
>      3. App.xaml 中合并：
>         <ResourceDictionary Source="pack://application:,,,/MaterialDesignThemes.Wpf;component/Themes/MaterialDesignTheme.Light.xaml"/>
>         <ResourceDictionary Source="pack://application:,,,/MaterialDesignThemes.Wpf;component/Themes/MaterialDesign2.Defaults.xaml"/>
>         <ResourceDictionary Source="pack://application:,,,/HandyControl;component/Themes/SkinDefault.xaml"/>
>         <ResourceDictionary Source="pack://application:,,,/HandyControl;component/Themes/Theme.xaml"/> -->
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:md="http://materialdesigninxaml.net/winfx/xaml/themes"
>         xmlns:hc="https://handyorg.github.io/handycontrol"
>         Title="第三方库主题定制" Height="420" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="MaterialDesignInXAML + HandyControl 主题定制"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Grid Grid.Row="1" Margin="0,12,0,0">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             <!-- MaterialDesign 卡片：md:Card + 按钮 + 开关 -->
>             <md:Card Padding="16" Margin="0,0,6,0">
>                 <StackPanel>
>                     <TextBlock Text="Material 风格" Foreground="White"
>                                FontWeight="Bold" FontSize="15"/>
>                     <TextBlock Text="卡面悬浮阴影 + 圆角按钮" Foreground="#8B949E"
>                                Margin="0,6,0,0" TextWrapping="Wrap"/>
>                     <md:Button Content="开始采集" Margin="0,14,0,0" HorizontalAlignment="Left"/>
>                     <md:ToggleButton x:Name="MdSwitch" Content="自动巡检" Margin="0,10,0,0"
>                                      HorizontalAlignment="Left" Checked="OnMdChecked"
>                                      Unchecked="OnMdUnchecked"/>
>                 </StackPanel>
>             </md:Card>
>             <!-- HandyControl 控件：仪表盘 + 进度条 -->
>             <hc:Card Grid.Column="1" Padding="16" Margin="6,0,0,0">
>                 <StackPanel>
>                     <TextBlock Text="HandyControl 风格" Foreground="White"
>                                FontWeight="Bold" FontSize="15"/>
>                     <hc:Gauge x:Name="SpeedGauge" Width="130" Height="110"
>                               Value="80" Maximum="120" Foreground="#58A6FF"/>
>                     <TextBlock Text="主轴转速 r/min" Foreground="#8B949E"
>                                HorizontalAlignment="Center" FontSize="12"/>
>                     <hc:ProgressBar x:Name="LoadBar" Value="62" Foreground="#238636"
>                                     Height="8" Margin="0,10,0,0"/>
>                 </StackPanel>
>             </hc:Card>
>         </Grid>
>     </Grid>
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
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // MaterialDesign 开关选中：更新 HandyControl 仪表盘数值，演示两库协作
>         private void OnMdChecked(object sender, RoutedEventArgs e)
>         {
>             SpeedGauge.Value = 95;
>             LoadBar.Value = 85;
>         }
>
>         private void OnMdUnchecked(object sender, RoutedEventArgs e)
>         {
>             SpeedGauge.Value = 40;
>             LoadBar.Value = 35;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机监控面板想要现代工业风：Material 卡片布局 + Handy 仪表盘/进度条（示例场景）
> ✅ 需要现成的"漂亮控件"而不想自己写模板：开关、滑块、弹层、消息通知
> ✅ 快速出效果的原型/产品：合并主题字典后直接获得完整设计语言
> ✅ 需要皮肤切换的成品项目（HandyControl `SkinManager`、Material `PaletteHelper`）
> ❌ 对包体积/启动性能极度敏感的项目（第三方库资源字典较庞大，启动有开销）
> ❌ 需要完全自控外观的定制项目（第三方库默认样式会接管全局，改造成本高）

> [!pitfall] 常见踩坑
> 坑 1：**忘了在 `App.xaml` 合并主题资源字典** → 现象：`md:`/`hc:` 控件能编译但运行时报"资源找不到"或控件无样式 → 原因：只装了 NuGet 包，没合并 `MaterialDesignTheme.*.xaml`/`SkinDefault.xaml`/`Theme.xaml` → 解决：按示例注释把四份资源字典加进 `App.xaml` 的 `MergedDictionaries`
> 
> 坑 2：**两库样式互相覆盖** → 现象：某控件的默认样式一会儿是 Material 一会儿是 Handy → 原因：两库都定义全局隐式样式，`MergedDictionaries` 顺序决定谁覆盖谁 → 解决：调整合并顺序，明确"主样式库"；需要混搭的控件显式指定 `Style`
>
> 坑 3：**库版本与 .NET 版本不匹配** → 现象：编译报版本冲突或 API 不存在 → 原因：`MaterialDesignThemes`/`HandyControl` 各版本要求不同 .NET Framework/.NET 目标框架 → 解决：先查 NuGet 包依赖说明，选择与项目目标框架匹配的版本

> [!best] 最佳实践
> - 一个项目**选一个主库**做全局主题（建议 HandyControl 用于工控风格），另一个库只取个别控件显式使用，减少样式冲突
> - 主题定制优先用库 API（`SkinManager.Current.Skin`、`PaletteHelper.SetTheme`）而非手改资源字典，升级不破坏
> - 两库控件混用时给易冲突的控件（Button/TextBox 等基础控件）显式指定 `Style` 归属
> - 版本锁定：写进 `Directory.Packages.props` 或 lock 文件，团队统一版本避免"我这儿能跑你那儿不行"
> - 上位机长期运行项目，升级控件库前先跑一遍全界面截图对比，防止默认样式变化影响工控配色

> [!practice] 上手练习
> **Lv.1 照猫画虎**：NuGet 安装两个包并合并资源字典（示例注释四步），运行示例切换 `MdSwitch` 观察 Gauge 与 LoadBar 联动
> **Lv.2 小试牛刀**：用 `hc:Growl.SuccessGlobal("采集完成")` 加一个通知；把 `SpeedGauge` 最大值改为 200 并实时刷新一个随机转速值
> **Lv.3 融会贯通**：用 `SkinManager.Current.Skin` 在深色/浅色皮肤间切换，并用 `PaletteHelper` 修改 Material 主色调为工控蓝，验证两库主题联动
> **Lv.4 拆层挑战**：把示例改造成 MVVM：`Gauge.Value` 绑定 VM 属性，`MdSwitch` 绑定 `IsAuto` 并触发命令更新转速，验证第三方控件同样遵循绑定/命令体系

> [!related] 相关知识链接
> - ← 前置知识：`资源字典组织主题`（第三方库的合并机制同根同源）、`动态切换主题`（`SkinManager`/`PaletteHelper` 底层就是换字典）
> - → 后续必学：`livecharts2-图表`（与 Handy/Material 搭配的图表库）、`extended-wpf-toolkit`（另一类专业控件补充）
> - ⇄ 关联概念：「第 5 章·什么是样式」「什么是样式」（库默认样式接管全局的机制）、`itemcontainerstyle-列表项样式`（库内列表控件容器定制）
> - 📖 官方文档：MaterialDesignInXAML：https://github.com/MaterialDesignInXAML/MaterialDesignInXAML ；HandyControl：https://github.com/HandyOrg/HandyControl ；HandyControl 文档：https://handyorg.github.io/handycontrol/ ；NuGet：https://www.nuget.org/packages/MaterialDesignThemes
