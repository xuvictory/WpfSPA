---
title: InkCanvas 手写画布
section: 04-controls
parent: 4.9 装饰与辅助控件
---

# InkCanvas 手写画布

> [!plain] 白话理解
> 巡检单要签字确认、设备图纸上要手写批注、屏幕前用手指圈出故障区域——这些"用手写画"的需求，用一堆 Button 拼不出来，得有一块"画布"。`InkCanvas` 就是 WPF 原生提供的涂鸦画布：按住鼠标（或触控笔）就能画出笔迹。
> 核心是 `EditingMode` 与 `DefaultDrawingAttributes`：前者切换"画笔/橡皮擦/选择"模式，后者控制笔迹颜色、粗细、平滑度。笔迹存在 `Strokes` 集合里，可以 `Clear()` 清空、遍历统计、甚至序列化保存。工业场景的"电子签名、图纸批注、手势标记"它都能胜任。

> [!def] 官方定义
> InkCanvas 是 WPF 中用于"手写笔迹输入与编辑"的画布控件，位于 `System.Windows.Controls` 命名空间。核心属性：`Strokes`（`StrokeCollection`，所有笔迹）、`EditingMode`（`InkCanvasEditingMode`：`Ink` 绘制 / `EraseByPoint`/`EraseByStroke` 擦除 / `Select` 选择 / `None`）、`DefaultDrawingAttributes`（`DrawingAttributes`：`Color`/`Width`/`Height`/`FitToCurve` 等）。它同时继承 `Canvas` 的布局能力，可承载子元素。笔迹支持保存为 ISF 格式（`StrokeCollection.Save`）。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.inkcanvas

> [!origin] 由来背景
> 手写输入（Ink）是微软 Tablet PC 计划的产物：早在 WPF 之前，Windows XP Tablet PC Edition 就定义了"笔迹（Stroke）"这一概念——一段手绘轨迹不是像素，而是可编辑、可识别、可序列化的对象集合。WPF 将其升级为 InkCanvas 控件：手写不再是"画布上画线"的简单模拟，而是 `StrokeCollection` 对象体系——每一笔都可以擦除（按点/按笔）、选择、移动、识别（`InkAnalyzer`）。对工业上位机，"电子签名替代纸质签字"让巡检/检验流程真正无纸化，InkCanvas 是这一场景的 WPF 原生答案。

> [!essentials] 核心要点
> - **EditingMode 模式切换**：`Ink` 画、`EraseByStroke`/`EraseByPoint` 擦、`Select` 选、`None` 只读
> - **DefaultDrawingAttributes 笔迹**：`Color`/`Width`/`Height` 控制笔触，`FitToCurve` 平滑
> - **Strokes 集合**：所有笔迹对象，`Clear()` 清空、`Count` 统计
> - **可序列化**：`StrokeCollection.Save(Stream)` 保存笔迹为 ISF 格式，重启可恢复
> - **触碰支持**：触控屏/触控笔直接可画，无需额外封装
> - **继承 Canvas**：可叠放子元素（如签名下方放提示文字/底图）

> [!example] 完整示例
> **电子签名与批注演示：InkCanvas 手写绘制、笔迹样式/颜色切换、保存与清空：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="电子签名 - InkCanvas" Height="480" Width="700"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="12">
>         <!-- 顶部工具栏 -->
>         <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Margin="0,0,0,8">
>             <Button Content="黑色" Click="OnBlack" Padding="10,4" Margin="0,0,6,0"/>
>             <Button Content="红色" Click="OnRed" Padding="10,4" Margin="0,0,6,0"/>
>             <Button Content="橡皮擦" Click="OnEraser" Padding="10,4" Margin="0,0,6,0"/>
>             <Button Content="清空" Click="OnClear" Padding="10,4" Margin="0,0,6,0"/>
>             <TextBlock x:Name="tipText" Foreground="#8B949E" VerticalAlignment="Center"
>                        Margin="10,0,0,0"/>
>         </StackPanel>
>
>         <!-- 手写画布：EditingMode 控制是画笔还是橡皮擦 -->
>         <InkCanvas x:Name="ink" Background="White" BorderBrush="#2A4A6C"
>                    BorderThickness="1">
>             <InkCanvas.DefaultDrawingAttributes>
>                 <DrawingAttributes Color="Black" Width="2" Height="2" FitToCurve="True"/>
>             </InkCanvas.DefaultDrawingAttributes>
>         </InkCanvas>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Ink;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnBlack(object sender, RoutedEventArgs e)
>         {
>             ink.EditingMode = InkCanvasEditingMode.Ink;
>             ink.DefaultDrawingAttributes.Color = Colors.Black;
>         }
>
>         private void OnRed(object sender, RoutedEventArgs e)
>         {
>             ink.EditingMode = InkCanvasEditingMode.Ink;
>             ink.DefaultDrawingAttributes.Color = Colors.Red;
>         }
>
>         private void OnEraser(object sender, RoutedEventArgs e)
>         {
>             ink.EditingMode = InkCanvasEditingMode.EraseByStroke;
>         }
>
>         private void OnClear(object sender, RoutedEventArgs e)
>         {
>             ink.Strokes.Clear();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 电子签名：巡检/检验单确认签字，替代纸质签名
> ✅ 图纸批注：设备图上圈画故障区域、加批注说明
> ✅ 手势/标记：触摸屏上手势圈选、高亮数据区域
> ✅ 简单涂鸦工具：培训示意图、备注草稿
> ❌ 复杂绘图/精确几何（用 WPF `DrawingVisual`/第三方图表库）
> ❌ 需要文字输入为主的场景（用「textbox-文本框」/「richtextbox-富文本框」）

> [!pitfall] 常见踩坑
> 坑 1：**橡皮擦擦不掉** → 点击擦除无反应。原因：`EditingMode` 仍为 `Ink`。解决：切到 `EraseByStroke`（按笔擦）或 `EraseByPoint`（点擦），用完切回 `Ink`
>
> 坑 2：**笔迹颜色不生效** → 画出来还是黑色。原因：改的是 `Stroke` 而非 `DefaultDrawingAttributes`。解决：绘制前统一改 `ink.DefaultDrawingAttributes.Color`（示例正确写法）
>
> 坑 3：**签名保存后丢失** → 重启界面笔迹没了。原因：未序列化。解决：`ink.Strokes.Save(stream)` 存 ISF，加载时 `ink.Strokes = new StrokeCollection(stream)`
>
> 坑 4：**笔迹粗糙有棱角** → 手写不流畅。原因：`FitToCurve=false`。解决：`FitToCurve="True"` 让笔画平滑化

> [!best] 最佳实践
> - 签名/批注等业务数据用 `StrokeCollection.Save` 序列化保存，配合「openfiledialog-打开文件对话框」存取文件
> - 模式切换用 `EditingMode`（Ink/EraseByStroke/None），UI 按钮与模式一一对应
> - 笔迹外观统一在 `DefaultDrawingAttributes` 设置（颜色/粗细/平滑），不要在每笔 Stroke 上改
> - 签名场景把画布包在「groupbox-分组框」里，并显示"签名区域"底纹
> - 触摸屏部署时测试"掌托误触"，必要时用 `EditingMode="None"` + 按钮锁定

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，切换黑/红画笔与橡皮擦，画一条签名
> **Lv.2 小试牛刀**：给"清空"按钮加确认（MessageBox），并新增"保存"按钮：`Strokes.Save` 到文件
> **Lv.3 融会贯通**：实现"签字确认流程"：巡检单 + InkCanvas 签名 + 保存签名笔迹 + 时间戳，完整无纸化流程
> **Lv.4 挑战**：实现"签名校验"：把签名 `Strokes.Save` 到字节数组，与预存签名做简单相似度对比（笔迹点数/坐标范围），输出是否匹配

> [!related] 相关知识链接
> - ← 前置知识：「button-按钮」工具栏按钮；「contentcontrol-内容控件」内容模型
> - → 后续必学：「image-图片显示」结合图纸底图做批注层
> - ⇄ 关联概念：「groupbox-分组框」承载签名区域；「openfiledialog-打开文件对话框」「savefiledialog-保存文件对话框」存取签名文件
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.inkcanvas
