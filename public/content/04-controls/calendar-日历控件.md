---
title: Calendar 日历控件
section: 04-controls
parent: 4.6 日期与信息显示控件
---

# Calendar 日历控件

> [!plain] 白话理解
> 排产计划、设备维保排期、班次安排——上位机里常有"选一个或多个日期"的需求。自己画日期网格要处理大小月、闰年、星期对齐，费时又易错；`Calendar` 把整个日历面板封装好：点选日期、多选日期段、翻月翻年都是现成的。
> 几个实战要点：`DisplayDateStart`/`DisplayDateEnd` 限定"能翻看到的范围"，`BlackoutDates` 禁用不可选日期，`SelectionMode` 控制单选/多选，`SelectedDates` 拿到所有选中的日期集合。工业场景里"排产选天""维护窗口选日期"都靠它。

> [!def] 官方定义
> Calendar 是 WPF 中用于"选择/展示日期"的日历面板控件，位于 `System.Windows.Controls` 命名空间。核心属性：`DisplayDate`/`DisplayDateStart`/`DisplayDateEnd`（当前显示月与可查看范围）、`SelectedDate`（单选，`DateTime?`）、`SelectedDates`（多选集合）、`SelectionMode`（`Single`/`SingleRange`/`MultipleRange`/`None`）、`BlackoutDates`（禁用日期集合 `CalendarDateRange`）、`DisplayMode`（月/年/十年视图）。核心事件 `SelectedDatesChanged`。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.calendar

> [!origin] 由来背景
> 日期选择在 WinForms 中只有 DatePicker（下拉式），"整块日历 + 多选 + 禁用日期"需要第三方控件或手写。WPF 将日历面板独立为 Calendar 控件：整月网格、翻月翻年、多选模式、日期禁用全部内置，`SelectedDates` 直接给出日期集合，`BlackoutDates` 用 `CalendarDateRange` 声明禁用区间。这对"排产/维保排期"类工业应用非常契合——计划员拖选一段日期作为排产窗口，历史/周末日期通过 BlackoutDates 禁掉，选择逻辑与业务规则在声明层完成。

> [!essentials] 核心要点
> - **DisplayDate 范围**：`DisplayDateStart`/`DisplayDateEnd` 限定用户能翻看到的范围
> - **SelectedDates 多选**：多选模式下 `SelectedDates` 保存全部选中日期（示例排产多选）
> - **BlackoutDates 禁用**：`CalendarDateRange` 声明不可选区间（如历史日期、停产日）
> - **SelectionMode 模式**：`Single`/`SingleRange`（单选段）/`MultipleRange`（多段多选）
> - **SelectedDatesChanged**：选择变化时触发，处理前先判 `e.AddedItems` 数量
> - **CalendarDayButtonStyle**：可定制每个日期格的外观（周末高亮等）

> [!example] 完整示例
> **排产日历演示：DisplayDateStart/End 限定可显示范围、SelectedDates 多选、标记日期样式：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="排产日历 - Calendar" Height="480" Width="620"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Orientation="Horizontal">
>         <Calendar x:Name="cal" SelectionMode="MultipleRange"
>                   SelectedDatesChanged="OnSelectedDatesChanged"
>                   Background="#161B22" Foreground="White"/>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Width="220"
>                    Margin="20,0,0,0" TextWrapping="Wrap" VerticalAlignment="Top"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Controls.Primitives;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 只允许查看/选择近两个月
>             cal.DisplayDateStart = DateTime.Today;
>             cal.DisplayDateEnd = DateTime.Today.AddMonths(2);
>
>             // 预先标记最近三天为"已排产"日期
>             for (int i = 0; i < 3; i++)
>             {
>                 cal.SelectedDates.Add(DateTime.Today.AddDays(i));
>             }
>
>             // 通过样式高亮周末（示例：周六日背景）
>             cal.CalendarDayButtonStyle = CreateDayStyle();
>         }
>
>         private Style CreateDayStyle()
>         {
>             var style = new Style(typeof(CalendarDayButton));
>             style.Setters.Add(new Setter(Control.ForegroundProperty, Brushes.White));
>             return style;
>         }
>
>         private void OnSelectedDatesChanged(object sender, SelectionChangedEventArgs e)
>         {
>             tipText.Text = $"已选择 {cal.SelectedDates.Count} 天：\n" +
>                            string.Join("\n", cal.SelectedDates);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 排产日历：`MultipleRange` 多选排产窗口，`BlackoutDates` 禁停线/假日
> ✅ 维保排期：选择维护窗口、标记计划停机日
> ✅ 常驻日历面板：调度中心/计划看板中长期展示的日历区域
> ✅ 报表统计区间：选择日期段统计产量/报警数据
> ❌ 只选单个日期且想省空间（用「datepicker-日期选择器」）
> ❌ 纯展示日期（用 TextBlock/格式化字符串即可，日历太占地）

> [!pitfall] 常见踩坑
> 坑 1：**多选模式下点日期变成"段选择"** → 行为不符合预期。原因：`SelectionMode` 决定了点选交互。解决：多选离散日期用 `MultipleRange`（按住 Ctrl 点选多个），单选用 `Single`
>
> 坑 2：**`BlackoutDates` 添加后仍可选** → 禁用失效。原因：区间边界/类型错误。解决：用 `CalendarDateRange`（起止），并确认 `DisplayDateStart` 范围没有覆盖
>
> 坑 3：**SelectedDatesChanged 里读到的集合包含上一次选择** → 统计错误。原因：事件触发时集合已更新但未做增量处理。解决：直接用 `cal.SelectedDates` 全量读取（示例），或对比 `e.AddedItems`/`e.RemovedItems`
>
> 坑 4：**样式定制不生效** → 高亮不了周末/节假日。原因：需要定制 `CalendarDayButtonStyle` 且模板已加载。解决：`CalendarDayButtonStyle` 在 XAML 设置并触发 `Trigger` 判断日期

> [!best] 最佳实践
> - 计划类场景先规划"可查看范围 + 禁用区间"，用 `DisplayDateStart/End` + `BlackoutDates` 双重约束
> - 多选后统一从 `SelectedDates` 全量读取，别依赖增量事件参数
> - 周末/节假日高亮通过 `CalendarDayButtonStyle` 的 `DataTrigger` 实现
> - 需要联动（选日期 → 查询该日数据）时在 `SelectedDatesChanged` 中统一处理
> - 日历在弹出面板里用「popup-弹出层」或窗口，避免挤占主界面

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，按住 Ctrl 多选几个日期，观察右侧已选列表
> **Lv.2 小试牛刀**：用 `BlackoutDates` 禁用最近 3 天与下周一，验证不可选
> **Lv.3 融会贯通**：做一个"排产看板"：Calendar 多选排产日期，选完自动生成排产天数统计
> **Lv.4 挑战**：用 `CalendarDayButtonStyle` + `DataTrigger` 高亮周末为橙色、节假日（自定义集合）为红色，并禁用停产日

> [!related] 相关知识链接
> - ← 前置知识：第 5 章「什么是数据绑定」理解 SelectedDates 绑定；「datepicker-日期选择器」是它的省空间形态
> - → 后续必学：「combobox-下拉选择框」等选择类控件对比（见「选择类控件对比指南」）
> - ⇄ 关联概念：「groupbox-分组框」承载日历面板；「popup-弹出层」组合为下拉日历
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.calendar
