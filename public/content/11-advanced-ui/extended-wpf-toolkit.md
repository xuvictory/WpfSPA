---
title: Extended WPF Toolkit
section: 11-advanced-ui
parent: 11.7 第三方 UI 控件库
---

# Extended WPF Toolkit

> [!plain] 白话理解
> Extended WPF Toolkit 是**补 WPF 原生控件缺口的"万能工具箱"**：WPF 自带控件少，很多常用的"小零件"它都没提供——颜色选择器、日期时间选择、数字步进器、带水印的输入框。这个库把这些都补上了，而且用起来和原生控件一样：引用命名空间、拖控件、读属性。示例里 `xctk:ColorPicker` 给设备指示灯选颜色、`xctk:DateTimePicker` 定检修时间、`xctk:IntegerUpDown` 输温度上限、`xctk:WatermarkTextBox` 输备注——四个高频需求，四个现成控件，不用自己写一个。

> [!def] 官方定义
> **Extended WPF Toolkit** 是 Xceed Software 开发并开源的 WPF 控件扩展包（GitHub: xceedsoftware/wpftoolkit，NuGet 包 `Extended.Wpf.Toolkit`），提供 60+ 原生 WPF 没有的控件与组件，如 `ColorPicker`（颜色选择）、`DateTimePicker`（日期时间选择）、`IntegerUpDown`/`DoubleUpDown`（数字步进）、`WatermarkTextBox`（水印输入框）、`BusyIndicator`（加载指示）、`CheckComboBox`、`PropertyGrid`、`DataGrid` 增强等。XAML 引用 `xmlns:xctk="http://schemas.xceed.com/wpf/xaml/toolkit"`。详见官方仓库：https://github.com/xceedsoftware/wpftoolkit 。

> [!origin] 由来背景
> WPF（2006 年随 .NET Framework 3.0 发布）的原始控件集刻意保持精简（Button/TextBox/DataGrid 等基础件），企业软件常用的"颜色选、日期选、数字步进"等控件一直没有内置。加拿大 Xceed Software 公司早年以商业组件闻名（Xceed DataGrid 等），2008 年起把部分控件以 **Extended WPF Toolkit** 名义开源（CodePlex 时代起步，后迁至 GitHub），免费供社区使用。它秉承"补齐原生缺憾、不改原生行为"的设计：控件 API 风格与 WPF 原生一致，`xctk:` 前缀下即插即用。因其覆盖面广、稳定成熟，成为 WPF 生态引用量最高的第三方控件包之一，上位机参数配置界面尤其受益。

> [!essentials] 核心要点
> - **安装与命名空间**：NuGet 包 `Extended.Wpf.Toolkit`；XAML `xmlns:xctk="http://schemas.xceed.com/wpf/xaml/toolkit"`（示例）
> - **常用控件**：`ColorPicker`（`SelectedColor`）、`DateTimePicker`（`Value` 为 `DateTime?`）、`IntegerUpDown`/`DoubleUpDown`（`Value`/`Minimum`/`Maximum`/`Increment`）、`WatermarkTextBox`（`Watermark` 提示）
> - **取值方式**：与原生控件一致——`SelectedColor`/`Value`/`Text` 直接读（示例 `OnReadParams`）
> - **其他亮点**：`BusyIndicator`（异步加载遮罩）、`PropertyGrid`（属性网格）、`CheckComboBox`、`DropDownButton`、`RichTextBox` 增强
> - **样式可定制**：`xctk:` 控件同样支持 `Style`/模板/主题资源，可与第三方主题库共存
> - **版本注意**：部分控件在 NuGet 的不同包（`Extended.Wpf.Toolkit` 覆盖大部分；个别如 DataGrid 增强在 `Extended.Wpf.Toolkit` 同名包内）

> [!example] 完整示例
> **Extended WPF Toolkit 参数配置演示：NuGet 安装 Extended.Wpf.Toolkit 后，用 xctk: 命名空间的 ColorPicker（颜色选择）、DateTimePicker（时间选择）、IntegerUpDown（数字步进）搭建上位机参数配置界面：**
>
> **说明：先通过 NuGet 安装 `Install-Package Extended.Wpf.Toolkit`。**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:xctk="http://schemas.xceed.com/wpf/xaml/toolkit"
>         xmlns:sys="clr-namespace:System;assembly=System.Runtime"
>         Title="Extended WPF Toolkit 参数配置" Height="460" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="Extended WPF Toolkit 控件（NuGet：Extended.Wpf.Toolkit）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Grid.Row="1" Margin="0,15,0,0">
>             <!-- ColorPicker：选择设备指示灯颜色 -->
>             <TextBlock Text="指示灯颜色" Foreground="#8B949E" Margin="0,0,0,4"/>
>             <xctk:ColorPicker x:Name="LampColor" SelectedColor="#58A6FF" Width="200"
>                               HorizontalAlignment="Left" Margin="0,0,0,14"/>
>             <!-- DateTimePicker：设定计划检修时间 -->
>             <TextBlock Text="计划检修时间" Foreground="#8B949E" Margin="0,0,0,4"/>
>             <xctk:DateTimePicker x:Name="MaintainTime" Value="{x:Static sys:DateTime.Now}"
>                                  Width="200" HorizontalAlignment="Left" Margin="0,0,0,14"/>
>             <!-- IntegerUpDown：输入最高温度 -->
>             <TextBlock Text="最高温度（℃）" Foreground="#8B949E" Margin="0,0,0,4"/>
>             <xctk:IntegerUpDown x:Name="MaxTemp" Value="80" Minimum="0" Maximum="200"
>                                 Width="200" HorizontalAlignment="Left"/>
>             <!-- WatermarkTextBox：带水印提示的输入框 -->
>             <TextBlock Text="备注" Foreground="#8B949E" Margin="0,14,0,4"/>
>             <xctk:WatermarkTextBox x:Name="Remark" Watermark="请输入备注信息" Padding="6"
>                                    Background="#161B22" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <Button Grid.Row="2" Content="读取参数并预览" Click="OnReadParams" Padding="12,6"
>                 HorizontalAlignment="Left" Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="ResultText" Grid.Row="2" Foreground="#8B949E"
>                    VerticalAlignment="Bottom" TextWrapping="Wrap" Margin="0,0,0,30"/>
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
>         // 汇总读取各扩展控件的值，验证与普通控件一致的取值方式
>         private void OnReadParams(object sender, RoutedEventArgs e)
>         {
>             ResultText.Text = $"指示灯颜色：{LampColor.SelectedColor}\n" +
>                               $"检修时间：{MaintainTime.Value:yyyy-MM-dd HH:mm}\n" +
>                               $"最高温度：{MaxTemp.Value}℃\n" +
>                               $"备注：{Remark.Text}";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机参数配置界面：颜色、日期、数字、水印输入（示例场景）
> ✅ 需要"属性网格"式配置（`PropertyGrid` 直接编辑对象属性）
> ✅ 异步加载时需要遮罩提示（`BusyIndicator`）
> ✅ 原生 WPF 缺控件时的快速补位：`CheckComboBox`、`DropDownButton`、`TimePicker` 等
> ❌ 只需要一两个控件的小项目（单独引整个包偏重，可只引所需源码/子包）
> ❌ 界面风格要求完全统一的深度定制项目（第三方控件默认样式需要额外适配主题）

> [!pitfall] 常见踩坑
> 坑 1：**包名与命名空间混淆** → 现象：NuGet 装了 `Extended.Wpf.Toolkit` 但 XAML 命名空间写错报解析失败 → 原因：命名空间是 `http://schemas.xceed.com/wpf/xaml/toolkit`，不是包名 → 解决：严格按示例写 `xmlns:xctk="http://schemas.xceed.com/wpf/xaml/toolkit"`
> 
> 坑 2：**`DateTimePicker.Value` 为 `DateTime?`** → 现象：`MaintainTime.Value:yyyy-MM-dd` 格式化报空引用 → 原因：`Value` 是可空类型，可能为 null → 解决：格式化前判空（`Value?.ToString("yyyy-MM-dd HH:mm")`），或在 XAML 里确保已赋值
>
> 坑 3：**旧版本控件在新 .NET 上报兼容问题** → 现象：升级 .NET 后某个 `xctk:` 控件编译不过或运行时异常 → 原因：Toolkit 各版本对 .NET Framework/.NET 支持范围不同 → 解决：选用与目标框架匹配的版本，遇问题查 GitHub Issues（该库社区活跃，常见问题有解决方案）

> [!best] 最佳实践
> - 配置界面优先用 `xctk:` 现成控件替代手写弹窗/自绘，开发效率高且交互成熟
> - 控件的值统一在提交时读取校验（示例 `OnReadParams`），不散落监听事件
> - `WatermarkTextBox` 替代"Label + TextBox"组合，界面更简洁
> - 与主题库共存时给 `xctk:` 控件统一套 `Style` 适配深色主题，保持视觉一致
> - 大型项目把配置表单封装成 `UserControl`，`xctk:` 控件值绑定 VM 属性，避免事件满天飞

> [!practice] 上手练习
> **Lv.1 照猫画虎**：安装 `Extended.Wpf.Toolkit`，运行示例操作四个控件后点"读取参数并预览"，确认取值正确
> **Lv.2 小试牛刀**：再加一个 `xctk:DoubleUpDown`（精度 0.1、Increment 0.5）设置"压力上限"，并加 `xctk:BusyIndicator` 模拟加载遮罩
> **Lv.3 融会贯通**：把示例表单值绑定到 VM（`INotifyPropertyChanged`），点"保存"生成配置对象并输出 JSON，验证第三方控件与绑定体系无缝衔接
> **Lv.4 拆层挑战**：用 `xctk:PropertyGrid` 直接编辑 `DeviceConfig` 对象（颜色/温度/时间属性），对比"手写表单"与"属性网格"两种配置界面的取舍

> [!related] 相关知识链接
> - ← 前置知识：「第 4 章·控件基础」「textbox-文本框」等原生控件基础、「第 5 章·数据绑定」「什么是数据绑定」（控件值绑定）
> - → 后续必学：`资源字典组织主题`（给第三方控件适配主题）、`datatemplateselector-选择器`（与表格/网格数据结合）
> - ⇄ 关联概念：`handycontrol`/`materialdesigninxaml`（同为第三方控件库，取舍对比）、`livecharts2-图表`（数据可视化补充）
> - 📖 官方文档：Extended WPF Toolkit GitHub：https://github.com/xceedsoftware/wpftoolkit ；NuGet：https://www.nuget.org/packages/Extended.Wpf.Toolkit ；Xceed 官方：https://xceed.com/controls/
