---
title: Label 标签
section: 04-controls
parent: 4.3 文本类控件
---

# Label 标签

> [!plain] 白话理解
> 参数录入表单里，每个输入框旁边都得配一句说明："温度设定：""采样周期："。给这段说明文字配助记符（按 Alt+T 直接跳到温度输入框），是让操作员全程不碰鼠标的关键。
> `Label` 就是干这个的：它继承 `ContentControl`，除了显示文字，还自带 `Target` 属性——把 `Target` 绑定到某个输入控件后，`Label` 里的助记符（`_温度设定`）按下时会自动把焦点交给那个输入框。这比"普通 TextBlock + 手写焦点逻辑"省事得多。

> [!def] 官方定义
> Label 是 WPF 中用于"标识其他控件"的文本型控件，位于 `System.Windows.Controls` 命名空间，继承自 `ContentControl`。核心特性是 `Target` 属性（`UIElement`）：当 Label 的文字包含助记符（`_` 前缀）时，按下 `Alt+助记键` 会把键盘焦点转移到 `Target` 指定的控件。它同时继承 ContentControl 的内容模型，`Content` 可以是字符串、`AccessText` 或任意元素。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.label

> [!origin] 由来背景
> 在 WinForms 时代，`Label` 是纯粹的静态文本控件，与输入框的"Alt+字母 聚焦"关联需要开发者手写逻辑：要么把标签放进 Panel 保证 Tab 顺序相邻，要么监听按键事件手动 Focus。WPF 的 Label 在设计上直接内置了 `Target` 属性：把"文字助记符 → 目标控件"的关联做成声明式配置，只要 `Target="{Binding ElementName=txtTemp}"` 就完成了聚焦关联。这契合上位机"参数多、键盘录入多"的实际：一排参数表可以全部用带 Target 的 Label 组织，操作员从第一个输入框按 Alt+字母 就能在任意参数间跳转。

> [!essentials] 核心要点
> - **Target 聚焦**：`Target` 绑定输入控件，`Alt+助记键` 自动聚焦过去
> - **助记符语法**：`Content` 中 `_` 前缀的字母即助记键（`_温度设定` → Alt+T）
> - **内容模型**：继承 ContentControl，可放字符串、`AccessText`、任意元素
> - **与 TextBlock 差异**：Label 可关联输入控件且有焦点联动；TextBlock 只是纯文本
> - **表单标配**：参数录入界面建议每行用 Label + 输入框，形成"助记符矩阵"

> [!example] 完整示例
> **参数录入表单演示：Label 的 Target 属性把下划线助记符（Alt+字母）关联到输入框：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="参数录入 - Label" Height="300" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="*"/>
>         </Grid.ColumnDefinitions>
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>
>         <!-- Target 绑定到输入框：按 Alt+T 会聚焦到 txtTemp -->
>         <Label Content="_温度设定：" Target="{Binding ElementName=txtTemp}"
>                Foreground="White" VerticalAlignment="Center"
>                Grid.Row="0" Grid.Column="0"/>
>         <TextBox x:Name="txtTemp" Grid.Row="0" Grid.Column="1"
>                  Text="25.0" Margin="5" Padding="4"/>
>
>         <Label Content="_采样周期（ms）：" Target="{Binding ElementName=txtPeriod}"
>                Foreground="White" VerticalAlignment="Center"
>                Grid.Row="1" Grid.Column="0"/>
>         <TextBox x:Name="txtPeriod" Grid.Row="1" Grid.Column="1"
>                  Text="1000" Margin="5" Padding="4"/>
>
>         <Button Content="应用参数" Click="OnApply" Grid.Row="2" Grid.Column="1"
>                 Padding="8" Margin="5,10,5,0" HorizontalAlignment="Left"
>                 Background="#238636" Foreground="White"/>
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
>         public MainWindow() => InitializeComponent();
>
>         private void OnApply(object sender, RoutedEventArgs e)
>         {
>             MessageBox.Show($"温度 {txtTemp.Text} ℃，采样周期 {txtPeriod.Text} ms 已下发",
>                             "参数应用");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 参数表单：每行"标签文字 + 输入框"，Label 负责说明与助记符聚焦
> ✅ 带助记符的配置界面：Alt+字母 跳到对应输入控件，键盘高效录入
> ✅ 需要点击选中文本的表单说明（TextBlock 不支持选中复制）
> ✅ 动态提示文字：`Content` 绑定属性，随状态切换提示内容
> ❌ 纯静态展示文本、无输入框可关联（用「textblock-轻量文本」更轻）
> ❌ 需要富文本混排、超链接的段落（用 `TextBlock.Inlines`）

> [!pitfall] 常见踩坑
> 坑 1：**给 Label 配了助记符却没设 Target** → Alt+字母 无反应。原因：助记符需要 Target 才能聚焦。解决：`Target="{Binding ElementName=目标控件}"`
>
> 坑 2：**用 TextBlock 代替 Label 后"选中复制"失效** → 状态文字无法复制。原因：TextBlock 默认不可选中。解决：需要可选中文本用 Label（默认可选中），或给 TextBlock 加 `IsTextSelectionEnabled="True"`（.NET 4.0+ 需自定义）
>
> 坑 3：**Label 绑定的动态文本太长撑破布局** → 表单错位。原因：Label 按内容自适应宽度。解决：设置 `Width`/`MaxWidth` + `TextTrimming`，或改用固定列宽 Grid
>
> 坑 4：**把 Label 当纯展示且高频刷新** → 性能浪费。原因：Label 是 Control（带模板），比 TextBlock 重。解决：纯展示高频文本用 TextBlock

> [!best] 最佳实践
> - 表单场景优先 Label + `Target`，让"标签→输入框"的关联与助记符一次配齐
> - 纯展示文本一律用 TextBlock，只有"需要关联输入/可选中"才用 Label
> - 助记符字母在整窗唯一，文字后用括号标注（`_温度设定（T）`）
> - 动态提示文字用 `Content` 绑定 + `INotifyPropertyChanged`，不手写更新
> - 表单布局统一用 Grid 两列（Label 右对齐 + 输入框），观感专业且对齐稳定

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"温度设定"标签文字，观察焦点是否跳到温度输入框
> **Lv.2 小试牛刀**：给"采样周期"的 Label 加 `_` 助记符并绑定 `Target`，按 Alt+P 聚焦对应 ComboBox
> **Lv.3 融会贯通**：把示例表单扩成 5 个字段的 Grid 布局，全部用"Label+Target"组织，规划助记键
> **Lv.4 挑战**：实现"Label 文本自动省略号"：自定义 Label 样式（`TextTrimming` + 固定宽度），超长时显示"…"且 Tooltip 显示全文

> [!related] 相关知识链接
> - ← 前置知识：「contentcontrol-内容控件」是 Label 的父类；「accesstext-助记符文本」是助记符实现细节
> - → 后续必学：「textblock-轻量文本」区分两者使用边界；「textbox-文本框」是 Target 常关联的输入控件
> - ⇄ 关联概念：「combobox-下拉选择框」「checkbox-复选框」都可作为 Label.Target 的聚焦目标
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.label
