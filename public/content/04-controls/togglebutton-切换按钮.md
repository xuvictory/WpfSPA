---
title: ToggleButton 切换按钮
section: 04-controls
parent: 4.2 按钮类控件
---

# ToggleButton 切换按钮

> [!plain] 白话理解
> 有些按钮不是"点一下干一件事"，而是"点一下换一个状态"：手动/自动模式的切换开关、巡检功能的开启/关闭。这种按钮需要记住"当前是开还是关"，并让界面把状态展示出来。
> ToggleButton 就是"带开关状态"的按钮：`IsChecked` 保存当前状态（true/false），每点一次自动翻转，`Checked`/`Unchecked` 事件告诉你状态变化。它还能开启三态（`IsThreeState`），用 `null` 表示"部分选中"这类中间态。`CheckBox`、`RadioButton` 都是它的子类。

> [!def] 官方定义
> ToggleButton 是"可保持选中状态"的按钮基类，位于 `System.Windows.Controls.Primitives` 命名空间，继承自 `ButtonBase`。核心属性 `IsChecked`（`bool?`：true 选中 / false 未选中 / null 不确定），`IsThreeState` 开启三态后每点一次在 true→null→false→true 间循环。状态变化触发 `Checked`、`Unchecked`、`Indeterminate` 路由事件。`CheckBox` 与 `RadioButton` 均派生自它，分别实现"多选开关"与"组内单选"语义。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.primitives.togglebutton

> [!origin] 由来背景
> 普通 Button 是"瞬时动作"，而大量工业操作需要"状态记忆"：模式开关、通道使能、报警静音。WinForms 用 `CheckBox.Checked` 加自定义外观模拟，但"开关按钮"与"复选开关"在视觉与交互上差异明显，且状态通知不统一。WPF 提炼出 ToggleButton 基类：把"选中/未选中/不确定"三种状态与 `IsChecked` 属性、三个路由事件统一定义；`CheckBox` 与 `RadioButton` 继承它补充各自的组合规则。于是"带状态的开关"成为第一类控件，开发者只需绑定 `IsChecked` 即可。

> [!essentials] 核心要点
> - **IsChecked 三值状态**：true / false / null（`IsThreeState=true` 时出现 null 中间态）
> - **状态事件**：`Checked`、`Unchecked`、`Indeterminate` 各自触发，无需在 Click 里判断
> - **继承关系**：`CheckBox`、`RadioButton` 都是它的子类，理解它即理解勾选类控件的底层
> - **三态循环**：`IsThreeState` 下点击在 true→null→false 间循环，常用于"全选/部分选/全不选"
> - **绑定驱动**：`IsChecked` 支持双向绑定，ViewModel 修改状态即可驱动界面

> [!example] 完整示例
> **模式切换演示：两态开关 + 三态（IsThreeState）开关的使用：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="模式切换 - ToggleButton" Height="360" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <!-- 两态：选中/未选中 -->
>         <ToggleButton x:Name="PowerBtn" Content="手动模式 OFF" Click="OnPowerToggle"
>                       Padding="10" Margin="5" Background="#21262D" Foreground="White"/>
>         <ToggleButton x:Name="AutoBtn" Content="自动巡检 OFF" Click="OnAutoToggle"
>                       Padding="10" Margin="5" Background="#21262D" Foreground="White"/>
>         <!-- 三态：未选中 / 选中 / 不确定（IsChecked == null） -->
>         <ToggleButton x:Name="TriBtn" IsThreeState="True" Click="OnTriToggle"
>                       Content="三态：全不选" Padding="10" Margin="5"
>                       Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="StateText" Foreground="#8B949E" Margin="5" TextWrapping="Wrap"/>
>     </StackPanel>
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
>         public MainWindow() => InitializeComponent();
>
>         private void OnPowerToggle(object sender, RoutedEventArgs e)
>         {
>             var isOn = PowerBtn.IsChecked == true;
>             PowerBtn.Content = isOn ? "手动模式 ON" : "手动模式 OFF";
>             StateText.Text = isOn ? "已切入手动模式，可单台启停" : "已切回自动模式";
>         }
>
>         private void OnAutoToggle(object sender, RoutedEventArgs e)
>         {
>             AutoBtn.Content = AutoBtn.IsChecked == true ? "自动巡检 ON" : "自动巡检 OFF";
>         }
>
>         private void OnTriToggle(object sender, RoutedEventArgs e)
>         {
>             // 三态判断：true / false / null（不确定）
>             TriBtn.Content = TriBtn.IsChecked switch
>             {
>                 true => "三态：全选",
>                 false => "三态：全不选",
>                 null => "三态：不确定（部分通道）"
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 模式切换开关：手动/自动、本地/远程、巡检开/关等两态模式
> ✅ 三态联动：全选/部分选/全不选的状态指示（部分子项选中时为 null）
> ✅ 自定义开关样式：用 `ControlTemplate` 把 ToggleButton 做成拨杆开关、ON/OFF 滑块
> ✅ 通道使能：采集通道、报警通道的逐项启用开关
> ❌ 需要一次性动作（用「button-按钮」）
> ❌ 需要组内互斥单选（用「radiobutton-单选按钮」）或多选独立开关（用「checkbox-复选框」）

> [!pitfall] 常见踩坑
> 坑 1：**三态模式下 `IsChecked` 判断只写 true/false** → 中间态(null)被漏判。原因：`bool?` 与 `bool` 不等价。解决：用 `switch`/三态判断显式处理 null，如示例中的 `is true / is false / null` 分支
>
> 坑 2：**在 Click 里读 IsChecked 读到旧值** → 逻辑错位。原因：Click 在状态翻转前触发。解决：用 `Checked`/`Unchecked` 事件或在 Click 后读取；更稳妥是绑定 `IsChecked` 属性由 ViewModel 驱动
>
> 坑 3：**不实现 INotifyPropertyChanged 就绑定 IsChecked** → 界面状态与逻辑状态不同步。原因：双向绑定缺通知。解决：ViewModel 属性 setter 触发通知
>
> 坑 4：**自定义模板后开关视觉不随状态变化** → 样式无选中反馈。原因：模板未处理 `IsChecked` 视觉状态。解决：在 `ControlTemplate` 的触发器里针对 `IsChecked=true` 设置颜色/形状

> [!best] 最佳实践
> - 两态开关用 `IsChecked` 绑定，不写 Click，状态逻辑全部收敛到 ViewModel
> - 三态"全选"联动时用 null 表示部分选中，配合子项 `Checked` 事件计算
> - 需要 ON/OFF 视觉时，重写 `ControlTemplate` 用 `Trigger` 切换前景/背景色，保留默认交互
> - 开关语义的控件不要用普通 Button 拼，`IsChecked` 的绑定与通知是现成的
> - 同一界面多个 ToggleButton 按功能分组命名（PowerBtn/AutoBtn），避免状态判断混淆

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，分别点击两个开关和三态开关，观察 `IsChecked` 取值与显示变化
> **Lv.2 小试牛刀**：把"手动/自动"开关改成 `IsChecked` 双向绑定：ViewModel 中修改值，界面开关同步翻转
> **Lv.3 融会贯通**：用 `ControlTemplate` 把 ToggleButton 做成"拨杆开关"：选中时轨道变绿、圆钮右移
> **Lv.4 挑战**：实现"通道全选"联动：5 个子通道 CheckBox，任一变化时父级 ToggleButton 自动呈现 全选/部分选/全不选 三态，且点父级可整体翻转

> [!related] 相关知识链接
> - ← 前置知识：「button-按钮」理解 ButtonBase 与点击事件；`IsChecked` 绑定见第 5 章「什么是数据绑定」
> - → 后续必学：「checkbox-复选框」「radiobutton-单选按钮」是它的两大子类，分别实现多选与单选
> - ⇄ 关联概念：「itemscontrol-条目控件」中的列表容器常与 ToggleButton 子类配合（如 ListBox 选中项）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.primitives.togglebutton
