---
title: DatePicker 日期选择器
section: 04-controls
parent: 4.6 日期与信息显示控件
---

# DatePicker 日期选择器

> [!plain] 白话理解
> "选开始日期"往往只需要一个小输入框，弹一整块日历太占地方。`DatePicker` 就是"一行文本框 + 点击弹出日历"的省地方案：平时只显示一个日期，点右侧图标弹出日历面板选日期，选中后自动写回文本框。
> 它与 `Calendar` 的关系：DatePicker 内部就嵌着一个 Calendar。区别在于 DatePicker 是"单选 + 省空间"，Calendar 是"常驻面板 + 可多选"。生产计划、巡检日期、报表统计区间的起止日期，都是 DatePicker 的典型场景。

> [!def] 官方定义
> DatePicker 是 WPF 中用于"选择单个日期"的下拉式控件，位于 `System.Windows.Controls` 命名空间。核心属性：`SelectedDate`（`DateTime?`，选中日期，未选为 null）、`SelectedDateFormat`（`Short`/`Long` 显示格式）、`DisplayDateStart`/`DisplayDateEnd`（日历可查看范围）、`BlackoutDates`（禁用日期集合）、`IsDropDownOpen`（弹出状态）。核心事件 `SelectedDateChanged`。内部组合了一个 `Calendar` 与文本编辑区。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.datepicker

> [!origin] 由来背景
> WinForms 的 DateTimePicker 支持日期时间选择，但定制能力弱、禁用日期复杂、格式与本地化支持有限。WPF 的 DatePicker 采用"组合"思路：一个可编辑的文本框 + 一个内嵌 `Calendar`，两者由 `SelectedDate` 属性桥接。这种设计让"点开选日期"与"直接键入日期"都可用，且 `BlackoutDates` 等禁用逻辑与 Calendar 完全一致。对生产计划这类"选起止日期"的表单，DatePicker 比 Calendar 省空间、比裸 TextBox 可靠（格式自动校验），成为上位机日期输入的默认选择。

> [!essentials] 核心要点
> - **SelectedDate 可为 null**：未选择时为 `null`，使用时先 `HasValue` 判断（示例即此写法）
> - **SelectedDateFormat**：`Short`（yyyy/M/d）与 `Long`（带星期）两种显示格式
> - **BlackoutDates 禁用**：与 Calendar 一致，`CalendarDateRange` 声明不可选区间
> - **DisplayDate 范围**：限定日历能翻看的范围，防用户选到业务外的日期
> - **SelectedDateChanged**：选择变化触发，回显/联动在此处理
> - **内部 Calendar**：弹出的是内嵌 Calendar，理解 Calendar 即理解 DatePicker 的日历部分

> [!example] 完整示例
> **生产计划日期演示：SelectedDate 回显、BlackoutDates 禁用不可用日期、SelectedDateFormat 格式：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="生产计划 - DatePicker" Height="360" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Width="380">
>         <TextBlock Text="选择生产计划开始日期：" Foreground="White"/>
>         <DatePicker x:Name="dpStart" SelectedDateFormat="Long"
>                     SelectedDateChanged="OnDateChanged"
>                     Margin="0,6,0,12" Padding="4" Background="#161B22"
>                     Foreground="White"/>
>
>         <TextBlock Text="选择计划截止日期：" Foreground="White"/>
>         <DatePicker x:Name="dpEnd" Margin="0,6,0,12" Padding="4"
>                     Background="#161B22" Foreground="White"/>
>
>         <Button Content="生成排产单" Click="OnCreate" Padding="8"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="0,12,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
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
>
>             dpStart.SelectedDate = DateTime.Today;
>
>             // 禁用过去日期与周末（BlackoutDates 添加禁用区间）
>             dpStart.BlackoutDates.Add(new CalendarDateRange(DateTime.MinValue,
>                                                             DateTime.Today.AddDays(-1)));
>             dpStart.BlackoutDates.Add(new CalendarDateRange(DateTime.Today.AddDays(3),
>                                                             DateTime.Today.AddDays(5)));
>         }
>
>         private void OnDateChanged(object sender, SelectionChangedEventArgs e)
>         {
>             tipText.Text = dpStart.SelectedDate.HasValue
>                 ? $"开始日期：{dpStart.SelectedDate:yyyy-MM-dd}"
>                 : "未选择日期";
>         }
>
>         private void OnCreate(object sender, RoutedEventArgs e)
>         {
>             if (dpStart.SelectedDate is DateTime start && dpEnd.SelectedDate is DateTime end)
>             {
>                 int days = (end - start).Days;
>                 tipText.Text = $"排产单已生成：{start:yyyy-MM-dd} 至 {end:yyyy-MM-dd}，共 {days} 天";
>             }
>             else
>             {
>                 tipText.Text = "请先选择开始与截止日期";
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 生产计划起止日期：开始/截止日期表单输入
> ✅ 巡检/维保排期：安排下一维护日期
> ✅ 报表统计区间：选择统计起止日
> ✅ 任何"只选一个日期 + 省空间"的表单字段
> ❌ 需要多选日期段（用「calendar-日历控件」）
> ❌ 日期范围跨月多选（两个 DatePicker 或 Calendar 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**没判 `HasValue` 就取 `SelectedDate.Value`** → 抛 `InvalidOperationException`。原因：用户没选日期时 `SelectedDate` 为 null。解决：`SelectedDate is DateTime dt` 模式匹配（示例）或先判 `HasValue`
>
> 坑 2：**起止日期互不约束** → 用户选"结束早于开始"。原因：两个 DatePicker 独立。解决：`dpEnd.DisplayDateStart` 联动 `dpStart.SelectedDate`，或生成时校验（示例 `OnCreate` 判断）
>
> 坑 3：**BlackoutDates 无效** → 历史日期仍可选。原因：禁用区间添加时机/范围错误。解决：`BlackoutDates.Add(new CalendarDateRange(DateTime.MinValue, DateTime.Today.AddDays(-1)))` 覆盖过去全部
>
> 坑 4：**日期格式本地化不对** → 显示英文/错误格式。原因：系统区域设置或 `SelectedDateFormat` 未指定。解决：显式 `SelectedDateFormat="Long"` 或自定义 CultureInfo

> [!best] 最佳实践
> - 取日期统一 `SelectedDate is DateTime dt` 模式匹配，天然防 null
> - 起止日期联动：`dpEnd.DisplayDateStart = dpStart.SelectedDate` 防"结束早于开始"
> - 业务禁用区间（历史/停产日）用 `BlackoutDates` 在构造函数集中声明
> - 需要精确到时间（班次）时 DatePicker 不适用，改自定义日期+时间组合
> - 日期绑定用 `SelectedDate`（DateTime?）双向绑定，格式转换交给 `StringFormat`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，选开始日期后点"生成排产单"，观察天数计算
> **Lv.2 小试牛刀**：给"截止日期"加 `DisplayDateStart` 联动：开始日期选了之后，截止日期不能早于它
> **Lv.3 融会贯通**：实现"统计区间"：开始/结束两个 DatePicker + 数据表格，选完自动查询该区间报警记录
> **Lv.4 挑战**：实现"排产冲突检测"：多个 DatePicker 选区叠加时红色高亮冲突日期，并在提交时提示（结合集合比较）

> [!related] 相关知识链接
> - ← 前置知识：「calendar-日历控件」是它的内部日历；第 5 章「什么是数据绑定」绑定 SelectedDate
> - → 后续必学：「listview-列表视图」显示查询结果表格（日期区间联动场景）
> - ⇄ 关联概念：「textbox-文本框」可做日期手动输入替代；「combobox-下拉选择框」选"今天/昨天/本周"快捷档
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.datepicker
