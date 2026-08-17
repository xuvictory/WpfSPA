---
title: TextBlock 轻量文本
section: 04-controls
parent: 4.3 文本类控件
---

# TextBlock 轻量文本

> [!plain] 白话理解
> 上位机界面上 70% 的元素都是"一段文字"：状态指示、设备名称、报警摘要、单位说明。这些文字大多只需"显示"，不需要用户编辑。为每段文字都建一个重量级控件是浪费——WPF 为此提供了最轻量的文本元素 `TextBlock`。
> 它不仅能显示字符串（`Text` 属性），还能用 `Inlines` 把普通文字、加粗、斜体、彩色片段混排在同一个段落里（`Run`/`Bold`/`Italic`），并支持 `TextTrimming` 超长省略号、`TextWrapping` 自动换行。数据绑定下配合 `Run` 还能做出"设备号加粗、时间变色"的实时状态行。

> [!def] 官方定义
> TextBlock 是 WPF 中用于"只读文本呈现"的轻量元素，位于 `System.Windows.Controls` 命名空间，直接继承自 `FrameworkElement`（非 `Control`，因此没有 ControlTemplate/背景等重负担）。它提供 `Text`（字符串）与 `Inlines`（`InlineCollection`，支持 `Run`/`Bold`/`Italic`/`Hyperlink` 等富文本片段）两种内容模式，以及 `TextWrapping`、`TextTrimming`、`TextAlignment`、`LineHeight` 等排版属性，支持 `Text="{Binding}"` 数据绑定。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.textblock

> [!origin] 由来背景
> WPF 诞生前，WinForms 的 `Label` 与 `TextBox` 在"只读文本"与"可编辑文本"之间边界模糊，显示富文本往往要引入第三方控件。WPF 把文本呈现拆成两个层次：轻量的 `TextBlock`（只读、非 Control、开销小、适合高频刷新的状态文本）与重量级的 `TextBox`/`RichTextBox`（可编辑）。同时用 `Run`/`Bold` 等内联元素取代 HTML 式的字符串拼接，让"一段文字里混排不同样式"成为声明式能力。上位机需要实时刷新温度、压力、报警行，TextBlock 正是为这类高频小段文本定制的方案。

> [!essentials] 核心要点
> - **非 Control 轻量级**：无 ControlTemplate，适合大量只读文本与高频刷新
> - **Text 与 Inlines 双模式**：简单文本用 `Text`；混排加粗/变色用 `Inlines`（`Run`/`Bold`/`Italic`）
> - **排版三件套**：`TextWrapping`（换行）、`TextTrimming`（超长省略）、`TextAlignment`（对齐）
> - **Inlines 可代码追加**：`textBlock.Inlines.Add(new Run(...))` 适合动态拼日志/报警行
> - **数据绑定**：`Text="{Binding 状态}"` 让文本随数据自动更新

> [!example] 完整示例
> **状态指示与报警摘要演示：Text 属性、Inlines 混排（Run/Bold/Italic）、文本裁剪：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="状态指示 - TextBlock" Height="340" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <!-- Text 属性：简单直接 -->
>         <TextBlock Text="● 系统运行正常" Foreground="#3FB950"
>                    FontSize="16" FontWeight="Bold"/>
>
>         <!-- Inlines 混排：Run / Bold / Italic 组合 -->
>         <TextBlock TextWrapping="Wrap" Margin="0,12,0,0"
>                    Foreground="#C9D1D9" LineHeight="22">
>             <Run Text="设备 "/>
>             <Bold><Run Text="M-101"/></Bold>
>             <Run Text=" 于 "/>
>             <Run Text="08:32:15" Foreground="#FF6B35"/>
>             <Run Text=" 上报异常，建议立即检查 "/>
>             <Italic><Run Text="冷却系统"/></Italic>
>             <Run Text="。"/>
>         </TextBlock>
>
>         <!-- 超宽自动省略号：TextTrimming -->
>         <TextBlock Text="这是一段非常长的报警描述文本，超出设定宽度后会自动以省略号截断显示"
>                    TextTrimming="CharacterEllipsis" TextWrapping="NoWrap" Width="300"
>                    Margin="0,12,0,0" Foreground="#8B949E"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Documents;
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
>             // 代码中动态拼装 Inlines：适合实时拼接日志/报警文本
>             var log = new TextBlock { Margin = new Thickness(0, 12, 0, 0) };
>             log.Inlines.Add(new Run("当前压力："));
>             log.Inlines.Add(new Run("4.2 MPa")
>             {
>                 Foreground = Brushes.Orange,
>                 FontWeight = FontWeights.Bold
>             });
>             log.Inlines.Add(new Run("（正常范围 0 ~ 6 MPa）")
>             {
>                 Foreground = Brushes.Gray
>             });
>             ((StackPanel)Content).Children.Add(log);
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 状态指示行：设备运行/停止/报警等高频刷新的单行文本（重量级控件会卡顿）
> ✅ 标签文字：输入框旁的单位、名称等静态说明
> ✅ 混排富文本：`Run` 加粗设备号、`Italic` 提示、`Hyperlink` 链接的一段文字
> ✅ 日志/报警行的程序化拼接：`Inlines.Add(new Run(...))` 逐条追加
> ✅ 文本太长自动省略：`TextTrimming` 显示"…"配合 Tooltip 全文
> ❌ 需要用户编辑文本（用「textbox-文本框」）
> ❌ 需要选中复制长文本的详情展示（默认不可选中，用 `Label` 或自定义模板）

> [!pitfall] 常见踩坑
> 坑 1：**`Text` 与 `Inlines` 混用** → 后者覆盖前者，或编译警告。原因：两者是互斥的内容模式。解决：简单文本用 `Text`，复杂混排用 `Inlines`，不要同时用
>
> 坑 2：**多行文本不换行被截断** → 长文字溢出面板。原因：未设置 `TextWrapping`。解决：`TextWrapping="Wrap"`（配合 `MaxWidth`）
>
> 坑 3：**超长文本撑爆 Grid 行** → 布局错乱。原因：TextBlock 默认不裁剪。解决：`TextTrimming="CharacterEllipsis"` + 固定宽度 + `ToolTip` 提示全文
>
> 坑 4：**高频刷新时整个状态行闪烁** → 视觉抖动。原因：整段重建。解决：只更新绑定属性（`INotifyPropertyChanged`），或仅替换变化的 `Run`

> [!best] 最佳实践
> - 纯展示文本优先 TextBlock：轻量、快、好绑定，是上位机界面默认文本方案
> - 实时状态行用 `Text` + 绑定，让数据更新驱动文本变化，避免手写刷新
> - 混排样式用 `Inlines`（Run/Bold），比拼字符串后整体着色更精确
> - 固定宽度区域一律配 `TextTrimming`，防溢出并加 `ToolTip` 兜底
> - 大量同类文本（如状态列）定义共享 `Style`（字体、颜色、字号），保持视觉统一

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，把"温度状态"的 Text 改成绑定属性，程序里改值观察自动刷新
> **Lv.2 小试牛刀**：给设备状态行加 `Run` 混排：设备号加粗、状态"运行"绿色、"停止"红色
> **Lv.3 融会贯通**：用 `TextTrimming` + `ToolTip` 做一个固定宽度 200 的设备描述列，超长自动省略
> **Lv.4 挑战**：实现一个"实时日志行"：`DispatcherTimer` 每 200ms 向 TextBlock.Inlines 追加一条 Run（含时间戳），超 100 条自动移除最旧的

> [!related] 相关知识链接
> - ← 前置知识：`{Binding}` 文本绑定见第 5 章「什么是数据绑定」；「contentcontrol-内容控件」理解内容模型
> - → 后续必学：「label-标签」是需要"关联输入框/可选中"时的选择；「textbox-文本框」是可编辑文本
> - ⇄ 关联概念：「button-按钮」「tooltip-工具提示」内部都用 TextBlock 呈现文字
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.textblock
