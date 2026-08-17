---
title: ComboBox 下拉选择框
section: 04-controls
parent: 4.4 选择类控件
---

# ComboBox 下拉选择框

> [!plain] 白话理解
> 面板空间宝贵，让"串口列表、采样频率、协议类型"这些选项各自占一排太奢侈。`ComboBox` 平时只显示一行（当前选中项），点击才弹出完整列表——"收起时省空间，展开时任意选"。
> 它支持两种数据来源：`ItemsSource` 绑定集合（配合 `DisplayMemberPath` 指定显示字段），或直接在 XAML 里放 `ComboBoxItem`。选中变化通过 `SelectionChanged` 事件或 `SelectedItem`/`SelectedIndex` 读取。上位机里"通道选择""频率档位"这类离散选项，它是最省地的答案。

> [!def] 官方定义
> ComboBox 是 WPF 中"下拉单选"控件，位于 `System.Windows.Controls` 命名空间，继承自 `Selector`。它平时只展示 `SelectedItem`，点击展开 `Items` 列表（内部含 `Popup`）。核心属性：`ItemsSource`/`Items`、`SelectedItem`/`SelectedIndex`/`SelectedValue`、`DisplayMemberPath`（指定显示字段）、`IsEditable`（允许输入）。核心事件 `SelectionChanged`。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.combobox

> [!origin] 由来背景
> "下拉选择"源自图形界面节省空间的经典设计：WinForms 的 ComboBox 已具备基本功能，但"绑定集合 + 自定义选项外观"与 ListBox 一样要绕行 DataSource/ItemTemplate 体系，且可编辑模式与选项列表耦合过深。WPF 的 ComboBox 基于 Selector/ItemsControl 统一模型：`ItemsSource` 直接绑定、`ItemTemplate` 声明式定义选项外观、`DisplayMemberPath` 一行指定显示字段；`IsEditable` 让"下拉 + 自由输入"一键切换。上位机里的协议选择、串口号、采样档位等配置项，用它对面板空间的占用远小于 RadioButton 组。

> [!essentials] 核心要点
> - **SelectedItem 取对象**：选中后直接拿到数据对象，用 `as` 强转读取字段
> - **DisplayMemberPath**：`ItemsSource` 绑集合时指定显示哪个字段
> - **两种填充方式**：`ItemsSource` 绑集合 或 XAML 内嵌 `ComboBoxItem`
> - **SelectionChanged 时机**：初始化时 `SelectedIndex=0` 也会触发，注意空值判断
> - **IsEditable 可输入**：开启后允许用户输入非列表值（需自行校验）
> - **省空间王者**：5 个以上离散选项时优先用它而非 RadioButton

> [!example] 完整示例
> **通道选择演示：ItemsSource 绑定数据源、SelectedItem/SelectedValue 读取选中项：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="通道选择 - ComboBox" Height="340" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Width="340">
>         <TextBlock Text="选择采集通道：" Foreground="White"/>
>         <!-- DisplayMemberPath 决定下拉显示哪个属性 -->
>         <ComboBox x:Name="cmbChannel" DisplayMemberPath="Name"
>                   SelectionChanged="OnChannelChanged"
>                   Margin="0,6,0,12" Padding="6" Background="#161B22"
>                   Foreground="White"/>
>
>         <TextBlock Text="选择采样频率：" Foreground="White"/>
>         <ComboBox x:Name="cmbRate" Margin="0,6,0,12" Padding="6"
>                   Background="#161B22" Foreground="White">
>             <ComboBoxItem Content="1 Hz"/>
>             <ComboBoxItem Content="10 Hz" IsSelected="True"/>
>             <ComboBoxItem Content="100 Hz"/>
>         </ComboBox>
>
>         <Button Content="开始采集" Click="OnStart" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="0,10,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Collections.Generic;
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
>             // ItemsSource 绑定集合；也可用 Items.Add 逐个添加
>             cmbChannel.ItemsSource = new List<Channel>
>             {
>                 new Channel { Id = 1, Name = "温度通道 T1" },
>                 new Channel { Id = 2, Name = "压力通道 P1" },
>                 new Channel { Id = 3, Name = "流量通道 F1" }
>             };
>             cmbChannel.SelectedIndex = 0;
>         }
>
>         private void OnChannelChanged(object sender, SelectionChangedEventArgs e)
>         {
>             if (cmbChannel.SelectedItem is Channel c)
>             {
>                 tipText.Text = $"已选择通道：{c.Name}（ID={c.Id}）";
>             }
>         }
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             string rate = (cmbRate.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "10 Hz";
>             tipText.Text = $"开始采集，频率 {rate}";
>         }
>     }
>
>     public class Channel
>     {
>         public int Id { get; set; }
>         public string Name { get; set; }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 串口/协议选择：波特率、数据位、通信协议等离散配置项
> ✅ 采样档位：采样周期、量程、滤波等级等选项较多的选择
> ✅ 省空间参数面板：设置区选项多，用下拉一行搞定
> ✅ 可输入的下拉：`IsEditable` 支持自定义输入（如输入自定义设备名称）
> ❌ 选项少（≤5）且需要常驻可见（用「radiobutton-单选按钮」组）
> ❌ 需要常驻列表浏览/多选（用「listbox-列表框」）

> [!pitfall] 常见踩坑
> 坑 1：**`SelectedValue` 和 `SelectedItem` 分不清** → 取到 null 或类型不对。原因：两者语义不同（值 vs 对象）。解决：绑对象用 `SelectedItem`，绑值字段用 `SelectedValue` + `SelectedValuePath`
>
> 坑 2：**初始化时 `SelectedIndex=0` 触发 SelectionChanged** → 启动就执行了副作用逻辑。原因：事件在赋值时触发。解决：事件里判空（`e.AddedItems`），或用 `IsLoaded` 标志
>
> 坑 3：**DisplayMemberPath 写错字段** → 每项显示类名或空白。原因：路径与数据属性不符。解决：确认集合元素字段名，`DisplayMemberPath` 只写属性名（不写 `{Binding}`）
>
> 坑 4：**IsEditable 后输入值不匹配任何项** → 逻辑混乱。原因：可编辑模式下值可能非列表项。解决：校验输入是否在选项内，或启用 `TextSearch` 让输入自动匹配

> [!best] 最佳实践
> - 静态选项用 `ComboBoxItem` 内嵌，动态选项用 `ItemsSource` 绑集合（配 `DisplayMemberPath`）
> - 取选中项优先 `SelectedItem as 类型`，比 `SelectedValue` 更符合面向对象习惯
> - 默认选中在 XAML 用 `SelectedIndex="0"` 声明，别在代码里赋值防闪烁
> - `SelectionChanged` 事件里先判空再处理，避免初始化误触发
> - 选项超过 10 个考虑分组（`ComboBoxItem` 内嵌 `HeaderedItemsControl`）提升查找效率

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，切换波特率观察 `SelectedItem` 的文本输出
> **Lv.2 小试牛刀**：把选项改成 `ItemsSource` 绑定 `List<string>`，验证 `DisplayMemberPath` 用法
> **Lv.3 融会贯通**：实现"协议联动"：ComboBox 选 Modbus TCP 时，下方自动显示 IP/端口输入区；选串口时显示波特率/数据位区
> **Lv.4 挑战**：用枚举 + 数据模板实现"可搜索下拉"：选项绑定枚举列表，`IsEditable` 下输入关键字自动过滤显示匹配项

> [!related] 相关知识链接
> - ← 前置知识：「itemscontrol-条目控件」理解集合绑定；「listbox-列表框」是同族的常驻列表形态
> - → 后续必学：「listview-列表视图」多列表格；「选择类控件对比指南」全局选型决策
> - ⇄ 关联概念：「radiobutton-单选按钮」选项少的替代方案；「label-标签」`Target` 聚焦下拉框
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.combobox
