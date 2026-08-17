---
title: CheckBox 复选框
section: 04-controls
parent: 4.2 按钮类控件
---

# CheckBox 复选框

> [!plain] 白话理解
> 采集方案里要勾选"采集哪些信号"：温度、压力、流量……每项独立勾选，可以全选、可以不选、也可以选一部分。这种"多项独立开关"就是复选框的活儿。
> CheckBox 和开关按钮很像，但语义不同：它是"一个可勾选的小方块 + 文字标签"，用于从一组候选中自由多选。它还支持三态：全选/全不选/部分选，当子项"有的选、有的没选"时，父级全选框自动进入"不确定"状态（`IsChecked=null`），上位机里"全选采集通道"这类联动非常常用。

> [!def] 官方定义
> CheckBox 是"可独立勾选/取消"的选项控件，位于 `System.Windows.Controls` 命名空间，继承自 `ToggleButton`（`System.Windows.Controls.Primitives`）。`IsChecked` 为 `bool?`：true 勾选 / false 未勾选；设置 `IsThreeState=true` 后额外支持 null（不确定，常表示"部分子项被选中"）。状态变化触发 `Checked`/`Unchecked`/`Indeterminate` 路由事件，且 `IsChecked` 支持双向数据绑定，非常适合"配置集合"场景。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/checkbox

> [!origin] 由来背景
> 复选框源自纸质表格的"打勾"隐喻，用于"是/否"与"多项选择"。WinForms 的 CheckBox 提供两态，但"父项全选 + 子项部分选"这类树形勾选状态（常见于配置面板、权限树、采集通道选择）只能靠开发者用第三方控件或手写逻辑模拟。WPF 的 CheckBox 原生支持三态：用 `IsThreeState` 开启"勾选→不确定→未勾选"循环，用 null 表达"部分选中"。这让"全选联动"成为声明式能力，配置类界面的复杂度大幅下降。

> [!essentials] 核心要点
> - **独立勾选**：每个 CheckBox 状态独立，互不影响（与 RadioButton 的互斥相反）
> - **IsChecked 三值**：true/false，`IsThreeState` 开启后出现 null（部分选中）
> - **状态事件**：`Checked`/`Unchecked`/`Indeterminate` 分别触发，便于联动
> - **全选联动**：父级三态 CheckBox + 子项集合，子项变化时计算父级状态
> - **双向绑定**：`IsChecked` 可绑定 `bool?` 属性，勾选即写回数据

> [!example] 完整示例
> **采集方案配置演示：多个 CheckBox 独立开关 + 三态"全选"联动：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="采集设置 - CheckBox" Height="380" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="选择要采集的信号" FontWeight="Bold" Foreground="White" Margin="0,0,0,8"/>
>         <CheckBox x:Name="ChkTemp" Content="温度信号" IsChecked="True"
>                   Margin="5" Foreground="White"/>
>         <CheckBox x:Name="ChkPressure" Content="压力信号" IsChecked="True"
>                   Margin="5" Foreground="White"/>
>         <!-- 三态全选：用于子项"全选/部分选/全不选"的联动显示 -->
>         <CheckBox x:Name="ChkAll" Content="全选（三态示例）" IsThreeState="True"
>                   Click="OnChkAllClick" Margin="5" Foreground="White"/>
>         <Button Content="保存采集方案" Click="OnSave" Margin="5,15,5,5" Padding="8"
>                 Background="#238636" Foreground="White"/>
>     </StackPanel>
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
>         public MainWindow() => InitializeComponent();
>
>         private void OnChkAllClick(object sender, RoutedEventArgs e)
>         {
>             // 把全选框状态同步到子项
>             if (ChkAll.IsChecked == true)
>             {
>                 ChkTemp.IsChecked = ChkPressure.IsChecked = true;
>             }
>             else if (ChkAll.IsChecked == false)
>             {
>                 ChkTemp.IsChecked = ChkPressure.IsChecked = false;
>             }
>             // null（不确定）时不改变子项状态
>         }
>
>         private void OnSave(object sender, RoutedEventArgs e)
>         {
>             var items = new[] { ChkTemp, ChkPressure };
>             int count = 0;
>             foreach (var cb in items)
>             {
>                 if (cb.IsChecked == true) count++;
>             }
>             MessageBox.Show($"已保存采集方案：启用 {count} 项通道", "保存成功");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 采集信号/通道多选：温度、压力、流量等信号独立勾选
> ✅ 配置项开关：报警使能、日志记录、自动重连等"是/否"设置
> ✅ 全选联动：父级三态"全选"配合子项集合（通道组、报表列）
> ✅ 权限/功能勾选：给角色勾选可用的功能模块
> ❌ 一组中只能选一个（用「radiobutton-单选按钮」）
> ❌ 需要按住连发或模式切换的开关（用「togglebutton-切换按钮」）

> [!pitfall] 常见踩坑
> 坑 1：**三态模式下点父级全选框行为混乱** → 状态在三种间循环。原因：`IsThreeState=true` 时点击不"跳变"而是轮转。解决：明确三态用途（全选联动），不需要中间态就不要开 `IsThreeState`
>
> 坑 2：**子项变化后父级"全选"状态不更新** → 显示错乱。原因：未监听子项 Checked/Unchecked 事件。解决：子项状态变化时重新计算父级 `IsChecked`（全 true→true、全 false→false、混合→null）
>
> 坑 3：**IsChecked 绑定到普通 bool 属性** → 三态显示异常。原因：`bool?` 与 `bool` 类型不匹配。解决：绑定属性用 `bool?`，或确保不开三态
>
> 坑 4：**在 Click 里循环修改子项 CheckBox** → 事件互相触发。原因：程序化改状态也触发事件。解决：用 `_isSyncing` 标志位防止递归同步

> [!best] 最佳实践
> - 需要"全选/全不选"联动时，父级用三态 CheckBox，子项集合监听后统一计算父级状态
> - 勾选结果存 ViewModel 的 `bool?` 属性（或 `ObservableCollection<T>`），别在界面控件上直接存业务状态
> - 程序化同步子项时加 `_isSyncing` 守卫，避免事件递归死循环
> - 选项多且分层时，考虑用「treeview-树形控件」的节点勾选（TreeViewItem 内含 CheckBox）承载层级勾选
> - 复选框文字用"动词短语"或"名词"清晰描述勾选含义（如"启用温度超限报警"），避免歧义

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，勾选/取消温度与压力信号，点击"保存"观察计数变化
> **Lv.2 小试牛刀**：新增第三个子项"流量信号"，并让父级"全选"三态随三个子项状态正确联动
> **Lv.3 融会贯通**：把子项集合改造成 `ObservableCollection<SignalConfig>` 绑定 `ItemsControl`，每项自动渲染 CheckBox，勾选状态写回集合元素
> **Lv.4 挑战**：实现"通道树"：TreeView 中每个节点带 CheckBox，勾选父节点联动所有子节点，子节点部分勾选时父节点显示三态，并支持层级展开

> [!related] 相关知识链接
> - ← 前置知识：「togglebutton-切换按钮」理解 IsChecked 三态与事件模型
> - → 后续必学：「radiobutton-单选按钮」做"多选一"；「treeview-树形控件」承载层级勾选
> - ⇄ 关联概念：「itemscontrol-条目控件」绑定集合自动渲染多行 CheckBox；「groupbox-分组框」承载勾选分组
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/checkbox
