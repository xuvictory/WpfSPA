---
title: RadioButton 单选按钮
section: 04-controls
parent: 4.2 按钮类控件
---

# RadioButton 单选按钮

> [!plain] 白话理解
> 通信方式只能选一种：Modbus RTU 还是 Modbus TCP 还是 OPC UA？这类"多选一"的交互，用下拉框太重、用复选框太宽松。最直观的是几个圆点按钮排成一排，点哪个亮哪个，且永远只有一个是亮的。
> RadioButton 就是"圆点单选"控件：同一组内（`GroupName` 相同）多个 RadioButton 自动互斥——选 A 时 B 自动熄灭。WPF 还做了个小聪明：同一个逻辑父容器内的 RadioButton 默认自动成组，`GroupName` 可以跨容器强制分组。

> [!def] 官方定义
> RadioButton 是"组内互斥单选"的选项控件，位于 `System.Windows.Controls` 命名空间，继承自 `ToggleButton`（`System.Windows.Controls.Primitives`）。同一 `GroupName` 下的 RadioButton 组成互斥组，同一时刻最多一个 `IsChecked=true`；未显式设置 `GroupName` 时，WPF 以父级逻辑容器（如 StackPanel/Grid）为默认分组边界。它的 `IsChecked` 同样为 `bool?`，且支持双向绑定与命令绑定。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/radiobutton

> [!origin] 由来背景
> "多选一"是表单与工业配置界面里的基本需求（协议选择、工作模式、通道类型）。早期 WinForms 的 RadioButton 依靠父容器（`GroupBox`）自动分组，跨容器分组必须嵌套容器，结构被迫扭曲。WPF 引入显式的 `GroupName` 字符串分组机制：同一字符串即可跨任意容器组成互斥组，界面结构不再被逻辑分组绑架。同时 RadioButton 继承 ToggleButton，获得统一的三态模型与绑定能力，让"当前选中项"可以声明式地绑定到 ViewModel 属性。

> [!essentials] 核心要点
> - **互斥机制**：`GroupName` 相同即自动互斥，同组内同一时刻只亮一个
> - **默认分组边界**：不写 GroupName 时，同一逻辑父容器内的 RadioButton 自动成组
> - **读取选中项**：遍历同组控件判断 `IsChecked==true`，或用绑定直接获取选中值
> - **IsChecked 为 bool?**：与 ToggleButton 一致，注意 null 中间态的处理
> - **与枚举/配置绑定**：常与枚举值转换器配合，把"选中状态"映射为业务配置值

> [!example] 完整示例
> **通信协议选择演示：同一 GroupName 内互斥单选，代码读取选中项：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="通信方式 - RadioButton" Height="380" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel x:Name="ProtocolPanel" Margin="15">
>         <TextBlock Text="选择通信协议" FontWeight="Bold" Foreground="White" Margin="0,0,0,8"/>
>         <!-- 相同 GroupName 的 RadioButton 只能选中一个 -->
>         <RadioButton GroupName="Protocol" Content="Modbus RTU（串口）" IsChecked="True"
>                      Margin="5" Foreground="White"/>
>         <RadioButton GroupName="Protocol" Content="Modbus TCP（以太网）"
>                      Margin="5" Foreground="White"/>
>         <RadioButton GroupName="Protocol" Content="OPC UA" Margin="5" Foreground="White"/>
>         <Button Content="连接" Click="OnConnect" Margin="5,15,5,5" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="ResultText" Foreground="#8B949E" Margin="5"/>
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
>         private void OnConnect(object sender, RoutedEventArgs e)
>         {
>             // 遍历同组 RadioButton，找到被选中的那一个
>             string selected = "未选择";
>             foreach (object child in ProtocolPanel.Children)
>             {
>                 if (child is RadioButton rb && rb.IsChecked == true)
>                 {
>                     selected = rb.Content.ToString();
>                     break;
>                 }
>             }
>             ResultText.Text = $"已选择协议：{selected}，正在连接…";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 通信方式/协议选择：Modbus RTU、Modbus TCP、OPC UA 三选一
> ✅ 运行模式选择：手动/自动/单步调试、班次选择、采样周期档位
> ✅ 配置向导：参数类型、单位制式、备份策略等"必选其一"的配置项
> ✅ 设置面板：语言、主题、串口号等少量离散选项
> ❌ 选项多到需要收起展开（改用「combobox-下拉选择框」）
> ❌ 可多选、可全不选的场景（用「checkbox-复选框」）

> [!pitfall] 常见踩坑
> 坑 1：**界面散在不同容器却忘了 GroupName** → 多个选项同时点亮。原因：默认按父容器分组，跨容器不互斥。解决：跨容器单选务必显式设置相同 `GroupName`
>
> 坑 2：**把 RadioButton 放进 ListBox 等 ItemsControl** → 选项不互斥。原因：容器生成器让它们分属不同逻辑父级。解决：显式 `GroupName`，或用 `ListBox` 的选中项机制代替
>
> 坑 3：**后台代码逐项判断 IsChecked** → 代码啰嗦且易漏项。原因：未用绑定。解决：把选项集合绑定到 ViewModel，用选中项属性或 `ListBox` 替代手工遍历
>
> 坑 4：**点击 RadioButton 的事件里读旧 IsChecked** → 判断滞后。原因：事件触发时机在状态更新前后不一致。解决：用 `Checked` 事件或依赖属性回调，避免在 Click 里读状态

> [!best] 最佳实践
> - 业务上"必选其一"的字段用一组 RadioButton 呈现，别用 CheckBox 组合
> - 跨容器分组统一写 `GroupName`，命名如 `Protocol`/`WorkMode`，保证逻辑分组明确
> - 选项与值一一对应时用绑定 + 转换器（如选中"Modbus TCP"映射为枚举值），不要手工 if-else
> - 选项超过 5 个考虑「combobox-下拉选择框」，节省面板空间
> - 默认选中项在 XAML 里用 `IsChecked="True"` 声明，避免代码里二次赋值造成闪烁

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，分别选择三种协议后点击"连接"，观察 ResultText 输出选中项
> **Lv.2 小试牛刀**：把三个 RadioButton 拆到两个不同的容器中，用相同 `GroupName` 维持互斥，验证跨容器分组
> **Lv.3 融会贯通**：给协议选择加绑定：选中项绑定到 ViewModel 的 `SelectedProtocol` 属性（字符串），按钮连接时直接读该属性
> **Lv.4 挑战**：用枚举 + 转换器实现"选项集合自动渲染"：`ItemsControl` 遍历 `ProtocolType` 枚举生成一组互斥 RadioButton，选中项自动回写枚举值

> [!related] 相关知识链接
> - ← 前置知识：「togglebutton-切换按钮」理解 IsChecked 三态与状态事件；第 5 章「什么是数据绑定」
> - → 后续必学：「checkbox-复选框」是"可多选"的兄弟控件；「combobox-下拉选择框」是选项较多时的替代
> - ⇄ 关联概念：「groupbox-分组框」常用来承载一组 RadioButton 并附带标题
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/radiobutton
