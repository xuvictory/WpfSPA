---
title: ContextMenu 右键菜单
section: 04-controls
parent: 4.8 菜单与工具栏
---

# ContextMenu 右键菜单

> [!plain] 白话理解
> ContextMenu 就是「右键菜单」：在界面的某个对象上点右键，菜单像便签一样浮出来，列出与这个对象相关的操作。上位机里右键一台设备，菜单就给出「启动 / 停止 / 删除」——不用先选中再去顶部菜单找命令，操作路径短了一大截。它好比设备铭牌旁挂着的「本机专属操作卡」，贴在哪台设备上就是哪台设备的命令。

> [!def] 官方定义
> `ContextMenu`（全限定名 `System.Windows.Controls.ContextMenu`）是一个浮动的菜单容器，作为任意 `FrameworkElement.ContextMenu` 属性值挂载到控件上：用户右键点击时自动弹出，菜单内容由 `MenuItem` 组成，点击后触发对应 `Click` 事件或命令。它默认随鼠标位置出现，关闭行为由系统管理。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.contextmenu

> [!origin] 由来背景
> 右键菜单源于 1990 年代桌面操作系统的「上下文感知交互」理念：同样的界面区域，不同对象上右键弹出不同命令，避免用户在主菜单里层层翻找。WPF 在 .NET Framework 3.0 中把 `ContextMenu` 做成了 `FrameworkElement` 的通用属性——任意控件都可以挂，且菜单项同样支持命令绑定。上位机中「设备列表右键操作」「趋势图右键缩放」等高频交互正是靠它缩短操作路径。

> [!essentials] 核心要点
> - 挂载方式：设置控件的 `ContextMenu` 属性，多个控件可共用同一个 `ContextMenu` 资源
> - `MenuItem.Click` / `Command`：菜单项触发逻辑，与普通菜单一致
> - 右键对象识别：通过 `PlacementTarget` 或控件的 `SelectedItem` 判断当前操作对象
> - `StaysOpen` / `IsOpen`：控制菜单是否自动关闭，需要时手动管理弹出状态
> - 菜单项状态（`IsEnabled` / `IsChecked`）可在 `ContextMenuOpening` 事件里动态调整

> [!example] 完整示例
> **数据表格右键菜单演示：ContextMenu 绑定到控件、识别右键对象执行操作：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="右键菜单 - ContextMenu" Height="440" Width="600"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="12">
>         <TextBlock DockPanel.Dock="Top" Text="在设备列表上单击右键试试："
>                    Foreground="#8B949E" Margin="0,0,0,8"/>
>
>         <ListBox x:Name="lstDevices" DisplayMemberPath="Name"
>                  Background="#161B22" Foreground="White" BorderBrush="#2A4A6C"
>                  BorderThickness="1">
>             <!-- ContextMenu 是 ListBox 的属性，所有条目共用 -->
>             <ListBox.ContextMenu>
>                 <ContextMenu>
>                     <MenuItem Header="启动设备" Click="OnStart"/>
>                     <MenuItem Header="停止设备" Click="OnStop"/>
>                     <Separator/>
>                     <MenuItem Header="删除设备" Click="OnDelete"/>
>                 </ContextMenu>
>             </ListBox.ContextMenu>
>         </ListBox>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="0,10,0,0"/>
>     </DockPanel>
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
>             lstDevices.ItemsSource = new List<string> { "电机 M-101", "变频器 V-202", "传感器 S-303" };
>         }
>
>         // 通过 ListBox.SelectedItem 判断右键针对哪一项
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             tipText.Text = lstDevices.SelectedItem == null
>                 ? "请先选中设备"
>                 : $"已启动 {lstDevices.SelectedItem}";
>         }
>
>         private void OnStop(object sender, RoutedEventArgs e)
>         {
>             tipText.Text = lstDevices.SelectedItem == null
>                 ? "请先选中设备"
>                 : $"已停止 {lstDevices.SelectedItem}";
>         }
>
>         private void OnDelete(object sender, RoutedEventArgs e)
>         {
>             if (lstDevices.SelectedItem is string name)
>             {
>                 lstDevices.Items.Remove(name);
>                 tipText.Text = $"已删除 {name}";
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备列表 / 数据表格行上右键：启动、停止、删除该设备
> ✅ 趋势图 / 表格上右键：缩放、导出、复制数据等图形操作
> ✅ 输入框右键：粘贴历史值、清零、锁定输入
> ✅ 告警列表右键：标记已读、删除、忽略此类告警
> ❌ 全局性、与应用状态无关的命令（应放 [menu-菜单栏](menu-菜单栏)，右键菜单只放「与当前对象相关」的命令）
> ❌ 命令较多需要完整分类目录时（右键菜单适合 3~8 项，多了反而难扫读）

> [!pitfall] 常见踩坑
> 坑 1：**右键没选中对象就执行操作** → 现象：没点中列表项直接右键，点「删除设备」把别的设备删了或报空引用。原因：菜单操作依赖 `SelectedItem`，但右键并不会自动选中条目。解决：在 `ContextMenuOpening` 事件里根据 `PlacementTarget` 手动定位被右键的条目，并把菜单项 `IsEnabled` 与是否有选中对象联动。
> 
> 坑 2：**菜单项灰色不可点，状态没更新** → 现象：右键后菜单项一直是禁用状态。原因：菜单每次弹出时 `IsEnabled` 需要重新计算，但只设置了一次。解决：在 `ContextMenuOpening` 事件中按当前上下文刷新各 `MenuItem.IsEnabled` / `IsChecked`。
>
> 坑 3：**右键菜单在数据绑定下不显示数据** → 现象：菜单项里绑定 `{Binding}` 显示空白。原因：`ContextMenu` 不在可视树中，`DataContext` 不会自动继承宿主控件。解决：用 `PlacementTarget` 获取宿主 `DataContext`，或通过 `Tag` 传参后再绑定。

> [!best] 最佳实践
> - 右键菜单只放与当前对象直接相关的命令，3~8 项为宜，用 `Separator` 分组
> - 在 `ContextMenuOpening` 里统一处理：识别对象、刷新可用状态、记录操作日志
> - 菜单项优先用 `Command` 绑定并携带 `CommandParameter`（如被右键的对象）
> - 右键时高亮选中条目，给用户明确的「操作对象」视觉反馈
> - 同一类对象（如所有设备条目）共用一个 `ContextMenu` 资源，不要每个条目建一个

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，右键设备列表，分别执行启动 / 停止 / 删除，观察提示文字变化
> **Lv.2 小试牛刀**：给菜单加「刷新列表」项；把「删除设备」改为删除前弹出确认框（用第 4.10 章「[messagebox-消息弹窗](messagebox-消息弹窗)」的 `MessageBox`）
> **Lv.3 融会贯通**：用 `ContextMenuOpening` 事件：右键空白处禁用「删除设备」，右键设备条目时启用并显示设备名
> **Lv.4 挑战进阶**：把设备列表改为绑定 `ObservableCollection<Device>`，右键菜单用 `CommandParameter` 传入被右键的 Device 对象，通过命令执行「启动 / 停止 / 删除」，并让菜单项的 `IsEnabled` 随设备运行状态动态变化

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[menu-菜单栏](menu-菜单栏)」掌握 MenuItem 用法，ContextMenu 复用同一套菜单项模型
> - → 后续必学：本章「[toolbar-工具栏](toolbar-工具栏)」把常用命令做成常驻按钮
> - ⇄ 关联概念：右键对象来自「[listbox-列表框](listbox-列表框)」等条目控件，菜单项分隔见「[separator-分隔线](separator-分隔线)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.contextmenu
