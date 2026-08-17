---
title: RepeatButton 重复按钮
section: 04-controls
parent: 4.2 按钮类控件
---

# RepeatButton 重复按钮

> [!plain] 白话理解
> 设定温度时，常见的做法是放一个"＋/−"按钮，点一次温度 +0.5。可如果要从 25℃ 调到 120℃，得点 190 下。理想的交互是：按住不放，数字自动连续增加，而且刚开始慢一点（避免误按）、持续按住后加速。
> RepeatButton 就是"按住不放会连续触发"的按钮：`Click` 会在你按住期间按固定节奏反复触发。`Delay` 控制"按住多久后开始连发"，`Interval` 控制"连发的间隔"。滚动条、数字微调框里的连续滚动，内部都是它在工作。

> [!def] 官方定义
> RepeatButton 是"按住期间周期性触发 Click"的按钮，位于 `System.Windows.Controls.Primitives` 命名空间（基元控件），继承自 `ButtonBase`。它提供 `Delay`（毫秒，按下后到首次重复触发的等待时间，默认 500ms）与 `Interval`（毫秒，重复触发之间的间隔，默认 50ms）。`ScrollBar` 的上下箭头、`Slider` 的加减按钮等连续型交互内部均由 RepeatButton 实现。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.primitives.repeatbutton

> [!origin] 由来背景
> 数字微调、滚动浏览这类"需要连续增量"的操作，若用普通 Button 每次点击只触发一次，用户必须高频点按，体验差且伤手。早期实现常借助 `Timer` 自己模拟"按住连发"，逻辑散落且时序难控。WPF 在 `ButtonBase` 之上实现 RepeatButton：把"按下后延迟→周期性触发→抬起停止"的完整时序封装为 `Delay` 与 `Interval` 两个属性，让连续输入成为声明式能力。此后 ScrollBar、Slider 等需要连续反馈的控件都复用了它，上位机里的温度/转速微调由此获得标准方案。

> [!essentials] 核心要点
> - **按住连发**：Click 在按住期间按 `Interval` 周期触发，抬起即停
> - **Delay 首延**：首次重复前的等待毫秒数，防止刚按住就误触发
> - **Interval 间隔**：连发节奏，数值越小越快，注意与 UI 刷新频率匹配
> - **继承 ButtonBase**：拥有 Click、IsPressed 等按钮基础能力，Content 模型与 Button 一致
> - **隐藏应用**：ScrollBar 箭头、Slider 的增减都在用 RepeatButton，理解它等于理解了滚动条手感

> [!example] 完整示例
> **温度设定微调演示：按住"＋/−"不放会按 Interval 间隔连续触发 Click：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="温度微调 - RepeatButton" Height="260" Width="400"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="设定温度（℃）" Foreground="White"/>
>         <Grid Margin="0,10,0,0">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="Auto"/>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="Auto"/>
>             </Grid.ColumnDefinitions>
>             <!-- Delay：首次重复前的等待毫秒数；Interval：后续重复间隔毫秒数 -->
>             <RepeatButton Content="−" Click="OnDecrease" Width="40" Height="36"
>                           Delay="300" Interval="80" Grid.Column="0"
>                           Background="#21262D" Foreground="White" FontSize="18"/>
>             <TextBox x:Name="TempBox" Text="25.0" Grid.Column="1"
>                      HorizontalAlignment="Center" VerticalAlignment="Center"
>                      FontSize="20" TextAlignment="Center" Width="140"/>
>             <RepeatButton Content="＋" Click="OnIncrease" Width="40" Height="36"
>                           Delay="300" Interval="80" Grid.Column="2"
>                           Background="#21262D" Foreground="White" FontSize="18"/>
>         </Grid>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Globalization;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private double _temp = 25.0;
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnIncrease(object sender, RoutedEventArgs e)
>         {
>             _temp += 0.5;
>             TempBox.Text = _temp.ToString("F1", CultureInfo.InvariantCulture);
>         }
>
>         private void OnDecrease(object sender, RoutedEventArgs e)
>         {
>             _temp -= 0.5;
>             TempBox.Text = _temp.ToString("F1", CultureInfo.InvariantCulture);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 数值微调：温度/转速/压力设定值，按住 ＋/− 连续增减
> ✅ 步进控制：电机点动、滑台微调等需要"按住持续动作"的工业操作
> ✅ 长按滚屏/翻页：图片预览、日志浏览中按住箭头连续滚动
> ✅ 内置组合：ScrollBar、Slider 的连续反馈，理解后便于定制手感
> ❌ 只需要单击一次的动作（用「button-按钮」）
> ❌ 需要保留选中状态的开关（用「togglebutton-切换按钮」）

> [!pitfall] 常见踩坑
> 坑 1：**连发节奏太快把值刷崩** → 温度一下子跳过头。原因：Interval 太小（如 10ms），每次又增大步长。解决：`Interval` 与步长匹配，如步长 0.5 时设 `Interval≥50`，或增量随按住时长自适应
>
> 坑 2：**刚按一下就连发一大段** → 误操作明显。原因：`Delay` 未设置/过小。解决：设 `Delay` 为 300~500ms，给用户"确认按住了"的反应窗口
>
> 坑 3：**值连续变化却触发大量 UI 刷新** → 界面卡顿。原因：每次 Click 都改 TextBox.Text 并全量更新。解决：值变化走绑定属性（`INotifyPropertyChanged`），批量变化时用 `Dispatcher` 合并或仅刷新显示控件
>
> 坑 4：**用普通 Button 模拟连发** → 定时器逻辑又乱又难停。原因：没用 RepeatButton。解决：直接用 RepeatButton，连发时序交给框架

> [!best] 最佳实践
> - 数值步进默认 `Delay=300`、`Interval=80~100`，兼顾防误触与连续调整速度
> - 连续变化的值放进 ViewModel 属性统一管理，避免在多个事件里各自维护状态
> - 步进到边界（如温度 ≤0 或 ≥上限）时在逻辑层钳制，不要让界面出现越界值
> - 需要"长按时加速"时，在 Click 里记录次数调整步长（如每 20 次步长翻倍），而不是依赖 Interval 变化
> - 面板里多个 RepeatButton 共用同一处理方法时用 `Tag` 或 `CommandParameter` 区分加减方向

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，把 `Delay` 改为 1000、`Interval` 改为 200，感受连发节奏变化
> **Lv.2 小试牛刀**：给温度加上下限：0℃ 和 100℃ 处钳制，超出后按钮内容置灰不再增减
> **Lv.3 融会贯通**：做一个"长按加速"微调：按住超过 1 秒后步长从 0.5 变 2.0，松开恢复
> **Lv.4 挑战**：自定义一个 `NumericUpDown` 控件：TextBox + 两个 RepeatButton 组合，暴露 `Value`/`Minimum`/`Maximum` 依赖属性并支持绑定，供全项目复用

> [!related] 相关知识链接
> - ← 前置知识：「button-按钮」掌握 ButtonBase 与 Click；Content 模型见「contentcontrol-内容控件」
> - → 后续必学：「scrollbar-滚动条」「slider-滑块」内部复用 RepeatButton，理解连发时序后更易定制
> - ⇄ 关联概念：「textbox-文本框」常与 RepeatButton 组合成数值输入组件
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.primitives.repeatbutton
