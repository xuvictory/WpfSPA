---
title: Rectangle 矩形
section: 06-graphics
parent: 6.2 Shape 基本图形
---

# Rectangle 矩形

> [!plain] 白话理解
> Rectangle 就是"会描边、能填色、可加圆角"的方块，是上位机界面里出场率最高的图形：工位状态块、设备机柜、按钮底色、进度条外壳、报警区域框，几乎全是它的身影。它不只是"显示用"，还经常作为可点击的图元（配合命中测试）承担交互职责。
>
> 类比：乐高里的基础砖块——单块不起眼，但成百上千块就能拼出整条产线的可视化布局。

> [!def] 官方定义
> `System.Windows.Shapes.Rectangle` 是 Shape 派生控件，用 `Width`/`Height` 定义尺寸，`RadiusX`/`RadiusY` 定义圆角半径（为 0 时是直角矩形），`Fill` 定义内部填充、`Stroke` 定义边框、`StrokeThickness` 定义边框宽度。与 Border 不同，Rectangle 是纯绘图元素，不参与布局承载子元素。
>
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.rectangle

> [!origin] 由来背景
> 矩形是图形学中最基础的图元，WPF 的 Shape 家族把它和 Line、Ellipse 等一起纳入统一模型，全部继承 `Shape` 抽象类，共享 `Fill`/`Stroke`/`Stretch` 等属性体系。WPF 的圆角能力（`RadiusX`/`RadiusY`）让矩形可以直接充当圆角卡片，省去 WinForms 时代用自绘或图片模拟圆角的繁琐；而保留模式让"改 Fill 即变绿、变红"成为一句代码的事——这正是工位状态灯、设备启停块的基本交互模式。

> [!essentials] 核心要点
> - **Fill 与 Stroke 分离**：Fill 是内部填充、Stroke 是边框，可分别控制颜色与粗细
> - **RadiusX/RadiusY 圆角**：两值相等时是标准圆角，可实现胶囊形/椭圆角卡片
> - **尺寸行为**：在 Canvas 中按 Width/Height 绘制；在 Grid/StackPanel 中会被拉伸适配可用空间
> - **StrokeThickness 居中描边**：线条一半在内一半在外，会影响视觉尺寸
> - **作为状态块**：配合 `x:Name` 后台改 Fill，是工位/设备状态可视化的核心手法

> [!example] 完整示例
> **设备状态栅格演示：用 Rectangle 绘制工位状态块，Width/Height 定义尺寸、RadiusX/RadiusY 圆角，点击按钮切换工作状态：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="工位状态 - Rectangle" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="3 号产线工位状态" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 3x3 工位状态栅格，每个工位用矩形 + 圆角表示 -->
>         <UniformGrid x:Name="GridArea" Grid.Row="1" Columns="3" Margin="0,10,0,0">
>             <Rectangle x:Name="Cell00" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell01" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell02" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell10" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell11" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell12" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell20" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell21" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>             <Rectangle x:Name="Cell22" Width="110" Height="80" Margin="8" RadiusX="8" RadiusY="8"
>                        Fill="#21262D" Stroke="#8B949E" StrokeThickness="2"/>
>         </UniformGrid>
>         <StackPanel Grid.Row="2" Orientation="Horizontal" Margin="0,12,0,0">
>             <Button Content="模拟运行" Click="OnRun" Padding="8" Background="#238636"
>                     Foreground="White" Margin="0,0,10,0"/>
>             <Button Content="全部停止" Click="OnStop" Padding="8" Background="#DA3633"
>                     Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
> using System.Windows.Shapes;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly Rectangle[] _cells;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _cells = new[] { Cell00, Cell01, Cell02, Cell10, Cell11, Cell12, Cell20, Cell21, Cell22 };
>         }
>
>         // 模拟运行：逐块点亮工位（绿色 = 运行中）
>         private void OnRun(object sender, RoutedEventArgs e)
>         {
>             for (int i = 0; i < _cells.Length; i++)
>             {
>                 _cells[i].Fill = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>                 _cells[i].Stroke = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>             }
>         }
>
>         // 全部停止：恢复灰色待机状态
>         private void OnStop(object sender, RoutedEventArgs e)
>         {
>             for (int i = 0; i < _cells.Length; i++)
>             {
>                 _cells[i].Fill = new SolidColorBrush(Color.FromRgb(0x21, 0x26, 0x2D));
>                 _cells[i].Stroke = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 工位/设备状态块：一个 Rectangle 一个工位，改 Fill 表示运行/停止/待机
> ✅ 进度条/液位条外壳：Rect 做底 + 内嵌矩形按百分比缩放
> ✅ 卡片与面板：RadiusX/RadiusY 圆角矩形当按钮、标签、分组框的视觉容器
> ✅ 告警区域框：红色描边矩形圈出报警设备，配合动画闪烁
> ❌ 需要承载子内容的容器：请用 Border（可放内容且支持圆角、阴影）
> ❌ 简单的分隔线：用 line-直线 更轻量

> [!pitfall] 常见踩坑
> 坑 1：**在 Grid/StackPanel 里 Rectangle 被拉伸变形** → 现象：明明设了 Width/Height，显示却铺满格子 → 原因：Shape 默认 `Stretch="Fill"`，布局容器会把可用空间塞给它 → 解决：显式设 `Stretch="None"`（或 `Uniform`），或在 Canvas 中使用
> 
> 坑 2：**圆角不生效** → 现象：RadiusX/RadiusY 设了但看起来还是直角 → 原因：只设了其中一个值，或宽高远小于半径导致看起来接近直角 → 解决：两个值都要设，并让矩形尺寸明显大于半径
>
> 坑 3：**StrokeThickness 导致尺寸溢出** → 现象：100px 宽的矩形加 10px 描边后实际占地更大 → 原因：WPF 描边默认居中，内外各占一半 → 解决：留出描边余量，或在 Grid 里用 Margin 补偿

> [!best] 最佳实践
> - 批量工位块用代码循环生成并统一 `x:Name` 前缀，避免手写几十个相似 Rectangle
> - 状态色用固定色值表管理（绿/黄/红/灰），集中定义，防止界面颜色漂移
> - 需要"圆角 + 内容"时直接用 Border 而非 Rectangle 叠 TextBlock
> - 给状态块加 `MouseDown` 事件时注意 Canvas 中命中测试，确认点击落在矩形内
> - 用 `RenderTransform` 缩放做状态块"心跳"动画时，把 `RenderTransformOrigin` 设在中心

> [!practice] 上手练习
> **Lv.1 运行体验**：运行工位栅格示例，点击"模拟运行"/"全部停止"，观察 9 个方块变绿/变灰
> **Lv.2 动手改造**：把某个工位的 RadiusX 改成 40，观察胶囊形效果，再试试只设 RadiusX 的直角效果
> **Lv.3 综合实战**：给栅格加第三个状态"检修中"（黄色 #E3B341），新增"模拟检修"按钮切换部分工位为黄色
> **Lv.4 挑战进阶**：用代码循环生成 6x6=36 个工位块（不用 XAML 手写），并为每个块绑定 `Tag` 存储工位号，点击时弹出该工位信息

> [!related] 相关知识链接
> - ← 前置知识：wpf-图形渲染概述；第 3 章「布局」的 Canvas/UniformGrid 定位
> - → 后续必学：所有-shape-共享属性；solidcolorbrush-纯色画刷 控制状态颜色
> - ⇄ 关联概念：line-直线（分隔线）、ellipse-椭圆（指示灯圆点）；第 7 章「什么是数据绑定」用数据驱动工位状态
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.shapes.rectangle
