---
title: Canvas 核心特点与属性
section: 03-layout
parent: 3.6 Canvas 画布布局
---

# Canvas 核心特点与属性

> [!plain] 白话理解
> 其他布局面板（Grid、StackPanel、DockPanel）都有一套"自动帮子元素找位置"的规则，你只要告诉面板"谁在里面"，面板就自己去安排。**Canvas 完全不一样——你必须亲手指定每个子元素的 X、Y 坐标**，就像在画布上贴便利贴，你指哪儿它就贴在哪儿。这种方式的好处是精确控制，坏处是窗口一缩，东西就挤在一起。所以 Canvas 在工业上位机里最适合做那种"固定尺寸"区域：比如工艺流程图上的设备图标、手动画线标注、简易示意图等。

> [!def] 官方定义
> Canvas 是一个使用绝对坐标定位子元素的布局面板。它定义了四个附加属性：`Canvas.Left`、`Canvas.Top`、`Canvas.Right`、`Canvas.Bottom`，分别控制子元素左边缘到 Canvas 左边缘的距离和上边缘到 Canvas 上边缘的距离。Canvas 不参与子元素的测量过程——它给予子元素无穷大的可用空间，子元素的大小完全由自身决定。子元素的 Z 顺序由 `Panel.ZIndex` 附加属性控制。

> [!origin] 由来背景
> Canvas 是 WPF 五种核心面板中**设计理念最"传统"的一个**。在 WinForms 时代，所有控件都是通过 `Location = new Point(x, y)` 来绝对定位的，这种方式直观但适应性差。微软在 WPF 中保留了 Canvas 作为对"精确位置控制"需求的回应，但同时引入了流式布局（Grid、StackPanel 等）作为主流方案。可以把 Canvas 理解为"给旧习惯留的后路 + 给特殊需求（绘图、CAD）留的利器"。在多数 WPF 最佳实践中，Canvas 的使用频率远低于 Grid。

> [!essentials] 核心要点
> - **四个附加属性**：`Canvas.Left` / `Top` 让子元素相对于 Canvas 左上角偏移；`Canvas.Right` / `Bottom` 让子元素相对于 Canvas 右下角偏移——四种组合可实现"靠边贴"效果
> - **零参与测量**：Canvas 给每个子元素传递 `double.PositiveInfinity` 作为可用尺寸，子元素自己决定要多大，Canvas 完全不干预
> - **ZIndex 层叠**：默认所有子元素 ZIndex = 0，后声明的在上层；使用 `Panel.ZIndex="1"` 可以手动控制层叠顺序
> - **ClipToBounds**：默认 `false`，子元素超出 Canvas 边界时仍然可见；设为 `true` 则裁切超出的部分
> - **不使用 Right/Bottom 时**：子元素位置和"右下"无关，窗口缩放时子元素位置不变、尺寸不变，完全不会自适应
> - **Left、Top 默认值**：如果没有显式设置，默认值为 `double.NaN`（而不是 0），元素由自身的 HorizontalAlignment/VerticalAlignment 决定位置

> [!example] 完整示例
>
> 下面是一个上位机场景的工艺流程图标签：用 Canvas 放置一组设备图标（矩形+文字），作为流程监控的静态背景。
>
> **MainWindow.xaml** — Canvas 核心用法
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="工艺流程监控" Height="400" Width="700"
>         WindowStartupLocation="CenterScreen">
>     
>     <!-- 整体使用 DockPanel 布局，Canvas 只负责中间的流程图画布 -->
>     <DockPanel>
>         <!-- 顶部工具栏 -->
>         <Border DockPanel.Dock="Top" Height="40" Background="#161B22"
>                 Padding="10,5">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="工艺流程监控 v1.0"
>                            Foreground="#FF6B35" FontWeight="Bold"
>                            VerticalAlignment="Center" FontSize="14"/>
>                 <TextBlock Text=" | 运行中" Foreground="#3FB950"
>                            VerticalAlignment="Center" Margin="10,0,0,0"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- Canvas 画布：放置设备图标 -->
>         <Canvas Background="#0D1117" ClipToBounds="True">
>             
>             <!-- 设备1：原料罐 (位置: 50, 60) -->
>             <Border Canvas.Left="50" Canvas.Top="60"
>                     Width="100" Height="80" Background="#1A3A5C"
>                     BorderBrush="#FF6B35" BorderThickness="2"
>                     CornerRadius="4">
>                 <StackPanel VerticalAlignment="Center"
>                             HorizontalAlignment="Center">
>                     <TextBlock Text="🛢" FontSize="24"
>                                HorizontalAlignment="Center"/>
>                     <TextBlock Text="原料罐 A1"
>                                Foreground="#E0E0E0"
>                                HorizontalAlignment="Center"
>                                Margin="0,5,0,0" FontSize="11"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 设备2：反应釜 (位置: 210, 60) -->
>             <Border Canvas.Left="210" Canvas.Top="60"
>                     Width="100" Height="80" Background="#1A3A5C"
>                     BorderBrush="#3FB950" BorderThickness="2"
>                     CornerRadius="4">
>                 <StackPanel VerticalAlignment="Center"
>                             HorizontalAlignment="Center">
>                     <TextBlock Text="⚗" FontSize="24"
>                                HorizontalAlignment="Center"/>
>                     <TextBlock Text="反应釜 R1"
>                                Foreground="#E0E0E0"
>                                HorizontalAlignment="Center"
>                                Margin="0,5,0,0" FontSize="11"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 设备3：成品罐 (位置: 370, 60) -->
>             <Border Canvas.Left="370" Canvas.Top="60"
>                     Width="100" Height="80" Background="#1A3A5C"
>                     BorderBrush="#FF6B35" BorderThickness="2"
>                     CornerRadius="4" Panel.ZIndex="1">
>                 <StackPanel VerticalAlignment="Center"
>                             HorizontalAlignment="Center">
>                     <TextBlock Text="📦" FontSize="24"
>                                HorizontalAlignment="Center"/>
>                     <TextBlock Text="成品罐 P1"
>                                Foreground="#E0E0E0"
>                                HorizontalAlignment="Center"
>                                Margin="0,5,0,0" FontSize="11"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 连接线 (用 Line 画管道) -->
>             <Line Canvas.Left="150" Canvas.Top="100"
>                   X1="0" Y1="0" X2="60" Y2="0"
>                   Stroke="#FF6B35" StrokeThickness="3"/>
>             <Line Canvas.Left="310" Canvas.Top="100"
>                   X1="0" Y1="0" X2="60" Y2="0"
>                   Stroke="#FF6B35" StrokeThickness="3"/>
>                   
>             <!-- 报警标记 (ZIndex=2，盖在最上面) -->
>             <Border Canvas.Left="380" Canvas.Top="48"
>                     Width="16" Height="16" CornerRadius="8"
>                     Background="#CC2222" Panel.ZIndex="2">
>                 <TextBlock Text="!" Foreground="White"
>                            HorizontalAlignment="Center"
>                            VerticalAlignment="Center"
>                            FontWeight="Bold" FontSize="10"/>
>             </Border>
>         </Canvas>
>         
>         <!-- 底部状态栏 -->
>         <Border DockPanel.Dock="Bottom" Height="30" Background="#161B22"
>                 Padding="10,0">
>             <StackPanel Orientation="Horizontal">
>                 <Ellipse Width="8" Height="8" Fill="#3FB950"
>                          VerticalAlignment="Center"/>
>                 <TextBlock Text=" 系统正常 | 3 台设备在线"
>                            Foreground="#999" VerticalAlignment="Center"
>                            Margin="5,0,0,0" FontSize="11"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- 右侧设备列表 (用 StackPanel) -->
>         <Border DockPanel.Dock="Right" Width="180" Background="#161B22"
>                 Padding="10">
>             <StackPanel>
>                 <TextBlock Text="设备列表" Foreground="#FF6B35"
>                            FontWeight="Bold" FontSize="13" Margin="0,0,0,10"/>
>                 <Border Background="#0D1117" Padding="6" Margin="0,2"
>                         CornerRadius="2">
>                     <TextBlock Text="原料罐 A1 — 在线" Foreground="#3FB950"
>                                FontSize="11"/>
>                 </Border>
>                 <Border Background="#0D1117" Padding="6" Margin="0,2"
>                         CornerRadius="2">
>                     <TextBlock Text="反应釜 R1 — 在线" Foreground="#3FB950"
>                                FontSize="11"/>
>                 </Border>
>                 <Border Background="#0D1117" Padding="6" Margin="0,2"
>                         CornerRadius="2">
>                     <TextBlock Text="成品罐 P1 — 报警" Foreground="#CC2222"
>                                FontSize="11"/>
>                 </Border>
>             </StackPanel>
>         </Border>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs** — 零代码即可运行的纯 XAML 示例
> ```csharp
> using System.Windows;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>     }
> }
> ```
>
> 上面的代码演示了四个关键用法：
> 1. **Canvas 绝对定位**：`Canvas.Left="50" Canvas.Top="60"` 精确定位设备图标
> 2. **Line 画连接线**：`Line` 本身宽度为 0，`X1/X2/Y1/Y2` 在其内部相对绘制
> 3. **ZIndex 层叠**：报警红点 `Panel.ZIndex="2"` 确保盖在成品罐上方
> 4. **组合布局**：外层 `DockPanel` 管理整体结构，`Canvas` 只负责中间的流程图画布

> [!scene] 适用场景
> - ✅ 工艺流程图、组态图上的固定尺寸设备图标
> - ✅ 简单绘图（线条、矩形、圆形等形状组合）
> - ✅ 自定义拖拽操作（在 `MouseMove` 中动态更新 `Canvas.Left/Top`）
> - ✅ 子元素数量和位置在编译时就确定的静态区域
> - ✅ 需要精确到像素的 UI 元素定位（如标尺、指示器）
> - ❌ 表单、列表等需要自适应窗口大小的内容区——应用 Grid
> - ❌ 动态增删子元素的场景——除非手动维护位置，否则很麻烦
> - ❌ 多分辨率适配的界面——Canvas 不会自动缩放

> [!pitfall] 常见踩坑
> - **坑1：Left/Top 的值是相对于 Canvas 的，不是相对于窗口的**。如果你把 Canvas 放在某个 Grid 单元格里，坐标起点是该单元格的左上角，不是窗口的(0,0)。解决方案：确保 Canvas 的父容器位置明确后再设计坐标。
> - **坑2：忘记 `ClipToBounds="True"`，子元素溢出时遮挡其他区域**。比如一个 Width=200 的 Border 放在 Canvas.Left=600 处（Canvas 宽度 700），右侧会冒出 100px。解决方案：给 Canvas 加 `ClipToBounds="True"`。
> - **坑3：Line 没有 Width/Height，只靠 X1/X2/Y1/Y2 画线**。新手容易给 Line 设置 `Width="100"` 或 `HorizontalAlignment="Stretch"`，这些对 Line 无效。Line 的尺寸由 `X2-X1` 和 `Y2-Y1` 决定，Canvas 位置由 `Canvas.Left/Top` 决定。

> [!best] 最佳实践
> - Canvas 内子元素优先使用 `Border + StackPanel` 组合（而非裸 `Button`），这样更灵活控制边距和圆角
> - `ClipToBounds="True"` 建议始终开启，除非你确实需要溢出效果（如拖拽到画布外）
> - 用 `Panel.ZIndex` 管理层叠顺序时，建议定义一个 `const` 常量类来管理层级值（如 `public static class ZLayers { public const int Alarm = 100; }`），避免硬编码数字散布各处
> - Canvas 不要作为窗口的唯一/最外层容器——外层永远用 Grid 或 DockPanel 管理整体结构
> - 绘图用 `Line`、`Rectangle`、`Ellipse` 等 Shape 子类，它们天然支持 Canvas 定位
> - 如果 Canvas 内容较多（>50 个子元素），考虑用 `ItemsControl` + `Canvas` 作为 `ItemsPanel` 来管理

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：仿照上面的示例，做一个含 5 个设备图标的简易流程图，用 Line 画 4 条连接线，设备间的水平间距 120px
> - **Lv.2 小试牛刀**：在 Canvas 上实现"点击添加设备图标"功能——在 `MouseLeftButtonDown` 事件中，获取鼠标位置 `e.GetPosition(canvas)`，动态创建 `Border` 并设置 `Canvas.SetLeft/SetTop`，添加到 `canvas.Children`
> - **Lv.3 融会贯通**：实现设备图标的拖拽移动——在 `MouseMove` 中更新 `Canvas.Left/Top`，并限制拖拽范围不超过 Canvas 边界（结合 `ClipToBounds` 和 `Canvas.ActualWidth/ActualHeight` 判断）

> [!related] 相关知识链接
> - ← 前置：DockPanel 停靠布局
> - → 后续：UniformGrid 均匀网格
> - ⇄ 关联：Canvas 和 InkCanvas — 后者专为手写/标注设计，自带笔迹收集功能，适合组态批注场景
> - 📖 官方文档：[Canvas Class (Microsoft Docs)](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.canvas)
