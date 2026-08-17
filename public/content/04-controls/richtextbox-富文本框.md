---
title: RichTextBox 富文本框
section: 04-controls
parent: 4.3 文本类控件
---

# RichTextBox 富文本框

> [!plain] 白话理解
> 巡检报告、交接班日志、设备维护记录——这些内容讲究"排版"：标题加粗、关键项标红、段落分明，而不仅仅是纯文本。`TextBox` 只能给出一堆纯字符，`RichTextBox` 则能承载带格式的文档。
> 它的内容模型是 `FlowDocument`：里面可以按顺序放多个 `Paragraph`（段落），每段里再放 `Run`（文本片段）、`Bold`、`Italic` 等元素。要导出或统计时，用 `TextRange` 把整个文档的纯文本提取出来。简单说：TextBox 管"字符串"，RichTextBox 管"文档"。

> [!def] 官方定义
> RichTextBox 是 WPF 中用于"富文本编辑与呈现"的控件，位于 `System.Windows.Controls` 命名空间。核心是 `Document` 属性（`FlowDocument`）：由 `Blocks`（`Paragraph`、`Section` 等块级元素）与 `Inlines`（`Run`、`Bold`、`Italic`、`Hyperlink` 等行内元素）构成文档树。`TextRange`（`System.Windows.Documents`）可跨文档提取纯文本、执行查找替换。配套 `FontFamily`/`FontWeight`/`Foreground` 等 TextElement 格式化属性。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.richtextbox

> [!origin] 由来背景
> WinForms 的 RichTextBox 基于 RFT（Rich Text Format）字符串工作，格式信息与文本混在一起，编程时用 `SelectionFont`、`SelectionColor` 这类"选中即改"的中间态属性，难以精确控制一段文本的样式。WPF 引入全新的 `FlowDocument` 文档模型：把"段落""行内元素""格式化"提升为一等对象（`Paragraph`、`Run` 都是对象而非字符串标记），内容用对象树描述，可以程序化构建、模板化复用、甚至与数据绑定联动。对工业软件而言，自动生成的巡检报告（标题加粗、异常标红）用代码构建 FlowDocument 远比拼 RFT 字符串可靠。

> [!essentials] 核心要点
> - **Document 承载 FlowDocument**：富文本 = 文档对象树，不是字符串
> - **块级/行内结构**：外层 `Paragraph` 分段，内层 `Run`/`Bold`/`Italic` 管样式
> - **TextRange 提取**：`new TextRange(Document.ContentStart, ContentEnd).Text` 拿到纯文本
> - **程序化构建**：`doc.Blocks.Add(new Paragraph(new Run("...")))` 动态生成报告
> - **滚动与只读**：`VerticalScrollBarVisibility="Auto"` + `IsReadOnly` 常组合成"只读日志视图"

> [!example] 完整示例
> **巡检报告编辑器演示：用 FlowDocument 装载富文本内容，TextRange 读取/导出文本：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="巡检报告 - RichTextBox" Height="480" Width="640"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="10">
>         <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Margin="0,0,0,8">
>             <Button Content="载入报告" Click="OnLoad" Padding="8,4" Margin="0,0,8,0"/>
>             <Button Content="统计内容" Click="OnExport" Padding="8,4"/>
>         </StackPanel>
>         <RichTextBox x:Name="rtbReport" Background="#161B22" Foreground="White"
>                      BorderBrush="#2A4A6C" BorderThickness="1" Padding="10"
>                      VerticalScrollBarVisibility="Auto"/>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Documents;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnLoad(object sender, RoutedEventArgs e)
>         {
>             // 富文本由 FlowDocument 承载：段落、加粗、颜色随意组合
>             var doc = new FlowDocument();
>             doc.Blocks.Add(new Paragraph(new Run("2026-08-17 设备巡检报告"))
>             {
>                 FontWeight = FontWeights.Bold,
>                 FontSize = 18
>             });
>             doc.Blocks.Add(new Paragraph(new Run("温度：正常 25.6 ℃")));
>             doc.Blocks.Add(new Paragraph(new Run("振动：偏高，建议复测"))
>             {
>                 Foreground = Brushes.OrangeRed
>             });
>             rtbReport.Document = doc;
>         }
>
>         private void OnExport(object sender, RoutedEventArgs e)
>         {
>             // TextRange 可提取富文本内的纯文本，用于统计/保存
>             var range = new TextRange(rtbReport.Document.ContentStart,
>                                       rtbReport.Document.ContentEnd);
>             MessageBox.Show(range.Text.Length > 0
>                 ? $"报告内容共 {range.Text.Length} 个字符"
>                 : "报告为空，请先载入", "统计");
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 交接班/巡检报告：标题加粗、关键项标红、段落清晰的可编辑文档
> ✅ 只读日志/记录视图：`IsReadOnly` + 滚动条展示历史操作记录
> ✅ 动态生成报表：程序化构建 FlowDocument，导出前预览
> ✅ 富文本备注：需要字号/颜色/列表等格式的设备说明
> ❌ 纯文本输入/输出（用「textbox-文本框」开销更小）
> ❌ 只是显示一段只读文本（用「textblock-轻量文本」）

> [!pitfall] 常见踩坑
> 坑 1：**用 `TextBox` 的思维拿 `Text` 取内容** → 编译错误（无 Text 属性）。原因：内容在 `Document`（FlowDocument）里。解决：用 `new TextRange(Document.ContentStart, ContentEnd).Text` 提取纯文本
>
> 坑 2：**误以为 `Document.Blocks.Add` 就能直接加字符串** → 编译错误。原因：Blocks 接收块级元素（Paragraph/Section）。解决：先包 `new Paragraph(new Run("文本"))`
>
> 坑 3：**只读模式仍可编辑** → 用户还能改内容。原因：仅设 `IsReadOnly` 不够，光标仍可定位。解决：加 `Focusable="False"` 或 `IsReadOnlyCaretVisible="False"` 并失焦
>
> 坑 4：**大量文本时卡顿** → 每次追加全量重建。原因：反复 `Blocks.Add` 导致重排。解决：批量追加用 `TextRange.Load`/`FlowDocument` 构造，或 `Dispatcher` 分帧处理

> [!best] 最佳实践
> - 取文本一律走 `TextRange`，写入用 `Paragraph + Run`，形成固定读写套路
> - 只读视图配置 `IsReadOnly + IsReadOnlyCaretVisible="False" + VerticalScrollBarVisibility="Auto"`
> - 动态报告构建成"模板方法"：标题段（Bold）+ 正文段（Run），字段从数据绑定生成
> - 保存/导出用 `TextRange.Save(stream, DataFormats.Xaml)` 保留格式
> - 无需格式的展示坚决用 TextBox/TextBlock，别为格式付性能税

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"导出纯文本"观察 `TextRange` 提取结果与控制台输出
> **Lv.2 小试牛刀**：在报告里追加一个"异常设备"段落：设备名加粗、原因文字标红
> **Lv.3 融会贯通**：做一个"交接班日志"：左侧 RichTextBox 可编辑，右侧预览区用 `TextRange` 同步显示纯文本版
> **Lv.4 挑战**：实现"报告导出到文件"：动态生成含标题/表格/多段的 FlowDocument，用 `TextRange.Save` 导出为 .rtf 文件

> [!related] 相关知识链接
> - ← 前置知识：「textblock-轻量文本」理解 Inlines/Run 混排；「textbox-文本框」对照纯文本编辑
> - → 后续必学：「itemscontrol-条目控件」结合 RichTextBox 做"多条富文本记录"列表
> - ⇄ 关联概念：「scrollbar-滚动条」配置长文档滚动；「tooltip-工具提示」补充超长内容
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.richtextbox
