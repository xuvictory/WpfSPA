---
title: ListBox 列表框
section: 04-controls
parent: 4.4 选择类控件
---

# ListBox 列表框

> [!plain] 白话理解
> 报警列表、设备清单、通道选择——上位机经常要展示"一列可选中"的数据。`ItemsControl` 只会展示不会选中，`ListBox` 则在它之上加上了"选中"能力：点哪条哪条高亮，`SelectedItem` 告诉你当前选中了谁。
> 它支持多选（`SelectionMode="Extended"` 配合 Ctrl/Shift 连续多选、`Multiple` 点击多选）、支持 `ItemTemplate` 定制每条的外观（不只显示一行字）。批量确认报警、选择操作对象，这类"从一堆里挑出若干条"的交互是它的主场。

> [!def] 官方定义
> ListBox 是 WPF 中"可选中列表"控件，位于 `System.Windows.Controls` 命名空间，继承自 `Selector`（再往上继承 `ItemsControl`）。核心属性：`ItemsSource`（数据源）、`SelectedItem`/`SelectedIndex`（单选选中项）、`SelectedItems`（多选集合）、`SelectionMode`（`Single`/`Multiple`/`Extended`）。它复用 ItemsControl 的 `ItemTemplate`/`ItemsPanel` 模型，并自带滚动与虚拟化（`VirtualizingStackPanel`）。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.listbox

> [!origin] 由来背景
> 列表选择是 Windows 最古老的交互之一，但 WinForms 的 ListBox 有三宗罪：数据绑定要靠 `DataSource` + `DisplayMember` 间接完成，选择事件回调拿不到强类型数据；自定义每项外观必须 OwnerDraw（自绘）模式，代码繁琐；大数据量性能堪忧。WPF 的 ListBox 构建在 ItemsControl 模型之上：`ItemsSource` 直接绑集合、`SelectedItem` 直接拿数据对象、`ItemTemplate` 声明式定义外观，选择逻辑与显示逻辑彻底分离。这让"报警批量确认""设备选择"这类工业高频交互只需声明 XAML 即可完成。

> [!essentials] 核心要点
> - **SelectedItem 拿数据**：选中后直接得到数据对象，配合 `as` 强转使用
> - **SelectionMode**：`Single` 单选 / `Multiple` 点击多选 / `Extended` Ctrl+Shift 多选
> - **SelectedItems 集合**：多选结果在 `SelectedItems`（后台代码读取）
> - **ItemTemplate 定制**：每条内容可做多列/多元素布局，不限单行文本
> - **自带虚拟化**：大数据量滚动流畅，优于裸 ItemsControl
> - **SelectionChanged 事件**：选中变化时触发，注意绑定方式不要误用

> [!example] 完整示例
> **报警通道列表演示：SelectionMode 多选、SelectedItem 读取选中项、ItemTemplate 定制外观：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="报警通道 - ListBox" Height="460" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="选中要确认的报警（可多选）：" Foreground="White" Margin="0,0,0,6"/>
>         <!-- SelectionMode=Extended 支持 Ctrl/Shift 多选 -->
>         <ListBox x:Name="lstAlarms" SelectionMode="Extended"
>                  Height="220" Background="#161B22" BorderBrush="#2A4A6C"
>                  BorderThickness="1" Foreground="White">
>             <ListBox.ItemTemplate>
>                 <DataTemplate>
>                     <StackPanel Orientation="Horizontal">
>                         <TextBlock Text="{Binding Time}" Foreground="#8B949E" Width="70"/>
>                         <TextBlock Text="{Binding Level}" Foreground="#F85149" Width="50"/>
>                         <TextBlock Text="{Binding Message}" Foreground="#C9D1D9"/>
>                     </StackPanel>
>                 </DataTemplate>
>             </ListBox.ItemTemplate>
>         </ListBox>
>         <Button Content="批量确认" Click="OnConfirm" Padding="8" Margin="0,12,0,0"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
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
>             lstAlarms.ItemsSource = new List<Alarm>
>             {
>                 new Alarm { Time = "10:12", Level = "紧急", Message = "电机 M-101 过热" },
>                 new Alarm { Time = "10:30", Level = "严重", Message = "压力 P1 过高" },
>                 new Alarm { Time = "11:05", Level = "一般", Message = "通信中断恢复" }
>             };
>         }
>
>         private void OnConfirm(object sender, RoutedEventArgs e)
>         {
>             // SelectedItems 是多选集合；SelectedItem 是当前焦点项
>             int count = lstAlarms.SelectedItems.Count;
>             tipText.Text = count > 0
>                 ? $"已确认 {count} 条报警"
>                 : "请先选中要确认的报警";
>         }
>     }
>
>     public class Alarm
>     {
>         public string Time { get; set; }
>         public string Level { get; set; }
>         public string Message { get; set; }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 报警批量确认：ListBox 常驻展示报警列表，多选后统一"确认"操作
> ✅ 设备/通道选择：从设备清单中单选或多选操作对象
> ✅ 操作目标列表：批量下发、批量删除前先选中的目标项
> ✅ 需要滚动且可选中数据项的任意列表
> ❌ 只是展示不允许选中的列表（用「itemscontrol-条目控件」更轻）
> ❌ 需要多列表格展示字段（用「listview-列表视图」）

> [!pitfall] 常见踩坑
> 坑 1：**多选后读 `SelectedItem` 只拿到第一条** → 其余选中项丢失。原因：多选时 `SelectedItem` 只代表"主选中项"。解决：多选结果从 `SelectedItems` 集合读取
>
> 坑 2：**绑定的集合增删后选中项乱掉** → 选中状态错乱。原因：集合元素无稳定标识，重建后 SelectionChanged 连锁触发。解决：绑定 `ObservableCollection` 并维护稳定的数据对象引用，必要时 `_isSyncing` 守卫
>
> 坑 3：**ItemTemplate 太复杂导致滚动卡顿** → 大数据量卡顿。原因：虚拟化被破坏（如模板里用了 `ScrollViewer`）。解决：保持 `VirtualizingStackPanel.IsVirtualizing="True"`，模板保持轻量
>
> 坑 4：**SelectionChanged 初始化时误触发** → 窗口加载就执行了选择逻辑。原因：初始 `SelectedIndex=0` 也触发事件。解决：判断 `e.AddedItems` 是否为空或加 `_initialized` 标志

> [!best] 最佳实践
> - 单选读取 `SelectedItem`，多选统一走 `SelectedItems`，二者分工明确
> - 绑定集合用 `ObservableCollection<T>`，让数据增删自动驱动列表与选中联动
> - 每条外观统一 `ItemTemplate`（含数据绑定），后台不再手工拼行
> - 批量操作（确认/删除）按钮的 `IsEnabled` 绑定"选中数>0"，无选择时置灰
> - 大数据量注意保持虚拟化，模板避免嵌套 ScrollViewer

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，单选/多选设备后点击"批量确认"，观察 `SelectedItems` 输出
> **Lv.2 小试牛刀**：把列表绑定换成 `ObservableCollection<Device>`，按钮事件里 `Add` 新设备验证自动刷新
> **Lv.3 融会贯通**：给"批量确认"按钮的 `IsEnabled` 绑定"是否有选中项"，无选中时置灰
> **Lv.4 挑战**：实现"联动主从列表"：左侧 ListBox 选设备，右侧 ListBox 自动显示该设备的报警记录（`SelectedItem` 驱动右侧 `ItemsSource`）

> [!related] 相关知识链接
> - ← 前置知识：「itemscontrol-条目控件」理解数据+模板模型；第 5 章「什么是数据绑定」掌握集合绑定
> - → 后续必学：「listview-列表视图」是 ListBox 的多列表格形态；「combobox-下拉选择框」是省空间的下拉形态
> - ⇄ 关联概念：「checkbox-复选框」配合实现列表项勾选；「scrollbar-滚动条」了解虚拟化滚动
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.listbox
