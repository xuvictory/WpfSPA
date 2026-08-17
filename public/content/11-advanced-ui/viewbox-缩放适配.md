---
title: Viewbox 缩放适配
section: 11-advanced-ui
parent: 11.8 响应式布局与自适应
---

# Viewbox 缩放适配

> [!plain] 白话理解
> 百分比布局适合"结构型"界面，但碰上**工艺流程示意图、管道布局图**这类用固定坐标画的内容就无能为力——总不能给每条线都配百分比。`Viewbox` 就是为这个而生：你把图按"设计坐标"（比如 800×400）正常画好，外面套一个 `Viewbox`，它自动把整张图**等比放大缩小**去填满可用空间。示例里 Canvas 里的坐标写死（原料仓在 x=30、管道从 210 连到 310），窗口怎么拉，整张图都严丝合缝跟着缩放，像看一张"可伸缩的工程图纸"。

> [!def] 官方定义
> `Viewbox` 是 `System.Windows.Controls.Viewbox` 内容装饰器（`Decorator`），对其单个子元素进行缩放以适配自身可用空间，核心属性 `Stretch`（`Uniform` 等比完整显示/`UniformToFill` 等比填满裁边/`Fill` 拉伸变形/`None` 不缩放）与 `StretchDirection`（`UpOnly`/`DownOnly`/`Both` 控制缩放方向）。内部内容按其自然尺寸（如 `Canvas.Width/Height`）布局，`Viewbox` 在 `Arrange` 阶段计算缩放矩阵应用到 `RenderTransform`，因此**内容坐标始终按设计尺寸编写**。详见官方文档：[Viewbox 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.viewbox)、[Stretch 枚举](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.stretch)。

> [!origin] 由来背景
> WPF 是矢量渲染框架（2006 年随 .NET Framework 3.0 发布），天然支持图形缩放——同一张图在任意 DPI/分辨率下都清晰。但"布局尺寸"与"缩放"是两回事：Canvas 固定坐标的图放进不同大小的窗口会溢出或被裁切。WPF 团队因此内置了 `Viewbox`：一个简单的"放大镜"容器，把子元素的渲染结果按比例变换到可用空间。它继承了 1990 年代 Windows GDI 时代"控件缩放"的实用主义思路，却用矢量变换做得更干净。上位机里的工艺流程图、管网拓扑图、产线示意动画，常靠 `Viewbox` 实现"一版坐标、全屏自适应"。

> [!essentials] 核心要点
> - **用法**：`<Viewbox Stretch="Uniform"><Canvas Width="800" Height="400">...</Canvas></Viewbox>`，子元素按设计坐标画
> - **`Stretch` 四种模式**：`Uniform`（等比，留边）、`UniformToFill`（等比，填满裁边）、`Fill`（拉伸变形）、`None`（原尺寸）
> - **`StretchDirection`**：`Both`（双向）、`UpOnly`（只放大不缩小）、`DownOnly`（只缩小不放大），防止小屏内容被放大失真
> - **`Viewbox` 是 `Decorator`**：只能有一个子元素（多内容先包一层 `Grid`/`Canvas`）
> - **坐标不感知缩放**：内容里的 `FontSize`/`StrokeThickness` 会随整体缩放（字和图一起变大变小），适合"整图"场景
> - **与布局配合**：`Viewbox` 自身是普通容器，可放 `Grid` 格子里占 `*` 行/列，缩放范围跟随可用空间

> [!example] 完整示例
> **Viewbox 整图缩放演示：把用固定坐标绘制的设备平面图放进 Viewbox，窗口缩放时整张图等比缩放，无需逐个坐标适配，适合上位机里的流程示意图、管道布局图：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Viewbox 缩放适配" Height="460" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="Viewbox 缩放适配（固定坐标系内容自动等比缩放）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold" TextWrapping="Wrap"/>
>         <!-- Viewbox 核心：子元素按自己的尺寸绘制，Viewbox 负责整体缩放 -->
>         <Viewbox Grid.Row="1" Margin="0,12,0,0" Stretch="Uniform">
>             <!-- 内部固定 800×400 的设计坐标，缩放时全部元素同比放大/缩小 -->
>             <Canvas Width="800" Height="400" Background="#161B22">
>                 <!-- 生产线上三台设备 -->
>                 <Border Canvas.Left="30" Canvas.Top="80" Width="180" Height="120"
>                         Background="#21262D" CornerRadius="8">
>                     <TextBlock Text="原料仓" Foreground="White" FontSize="22"
>                                HorizontalAlignment="Center" VerticalAlignment="Center"/>
>                 </Border>
>                 <Border Canvas.Left="310" Canvas.Top="80" Width="180" Height="120"
>                         Background="#1F3A5F" CornerRadius="8">
>                     <TextBlock Text="反应釜" Foreground="#58A6FF" FontSize="22"
>                                HorizontalAlignment="Center" VerticalAlignment="Center"/>
>                 </Border>
>                 <Border Canvas.Left="590" Canvas.Top="80" Width="180" Height="120"
>                         Background="#21262D" CornerRadius="8">
>                     <TextBlock Text="成品罐" Foreground="White" FontSize="22"
>                                HorizontalAlignment="Center" VerticalAlignment="Center"/>
>                 </Border>
>                 <!-- 连接管道 -->
>                 <Line X1="210" Y1="140" X2="310" Y2="140" Stroke="#58A6FF" StrokeThickness="6"/>
>                 <Line X1="490" Y1="140" X2="590" Y2="140" Stroke="#58A6FF" StrokeThickness="6"/>
>                 <Ellipse Canvas.Left="245" Canvas.Top="125" Width="30" Height="30"
>                          Fill="#238636"/>
>                 <Ellipse Canvas.Left="525" Canvas.Top="125" Width="30" Height="30"
>                          Fill="#238636"/>
>                 <TextBlock Canvas.Left="50" Canvas.Top="320" Text="工艺流程：原料 → 反应 → 成品"
>                            Foreground="#8B949E" FontSize="20"/>
>             </Canvas>
>         </Viewbox>
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
>         public MainWindow()
>         {
>             InitializeComponent();
>             // Viewbox 无需任何代码参与：布局引擎自动按可用空间计算缩放比例
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 工艺流程示意图、管道布局图、产线拓扑图（固定坐标整图缩放，示例场景）
> ✅ 需要"设计稿等比呈现"的看板大屏内容（一张图适配不同尺寸屏）
> ✅ 组态软件的编辑/预览视图（编辑用设计坐标，预览用 Viewbox）
> ✅ 图标、Logo、示意图等不希望拉伸变形的矢量内容
> ❌ 有输入框/按钮等需要精确点击与交互的界面（缩放后命中区域变化，操作感差）
> ❌ 文字内容多且需要可读性的界面（整体缩放会让文字过大/过小，应改用百分比布局）

> [!pitfall] 常见踩坑
> 坑 1：**`Stretch="Fill"` 导致图形变形** → 现象：圆变成椭圆、字体压扁 → 原因：`Fill` 强行拉伸填满，宽高比不保留 → 解决：要求不变形一律 `Stretch="Uniform"`；要铺满可接受裁边用 `UniformToFill`
> 
> 坑 2：**交互控件放进 Viewbox 后点击位置错乱** → 现象：按钮能看但点不中、点偏 → 原因：`Viewbox` 变换的是渲染，命中测试在变换后位置计算复杂，小比例下命中区域变化大 → 解决：交互内容放 `Viewbox` 外或改用百分比布局；纯展示图才放 `Viewbox` 内
>
> 坑 3：**字体/线宽一起缩放导致过细/过粗** → 现象：大窗口下 `StrokeThickness=6` 的管道线变成 20 像素 → 原因：`Viewbox` 连笔宽一起缩放（矢量整体变换） → 解决：线宽/字体若需恒定，用 `Path` 或代码按缩放比反向补偿（`Viewbox` 不适合这类"局部恒定"需求）

> [!best] 最佳实践
> - 纯展示型示意图/拓扑图用 `Viewbox` + `Uniform`，一版坐标全屏自适应
> - 交互控件与 `Viewbox` 隔离：可点击内容放外面，只有图形部分缩放
> - 设计坐标（Canvas 尺寸）固定后不要随意改，缩放效果以它为基准
> - 大屏展示用 `UniformToFill` 加 `Clip`，小屏用 `Uniform` 保证完整可见
> - 与百分比布局分工：结构用 `Grid` 星号，整图用 `Viewbox`，各管各的

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，拖动窗口观察工艺图整体等比缩放、不变形；把 `Stretch` 改为 `Fill` 对比变形效果
> **Lv.2 小试牛刀**：给 Canvas 再加一台"冷却塔"和两条管道（注意设计坐标内布局），验证新增元素同样随整体缩放
> **Lv.3 融会贯通**：给反应釜加一个实时温度 `TextBlock`（绑定 VM），并尝试把"点击设备弹出详情"做成 Viewbox 外层的透明覆盖层，体会展示与交互分离
> **Lv.4 拆层挑战**：用 `UniformToFill` + `Clip` 实现"大屏铺满"模式，再对比 `UpOnly`（只放大不缩小）在窄屏上的表现，总结四种 Stretch 的选型表

> [!related] 相关知识链接
> - ← 前置知识：「第 4 章·布局系统」「canvas-画布布局」相关文章（固定坐标布局基础）、`百分比布局策略`（另一种响应式思路）
> - → 后续必学：`多屏适配拼接屏场景`（多屏环境下整图缩放的应用）、`per-monitor-dpi-awareness`（缩放与 DPI 的关系）
> - ⇄ 关联概念：「第 4 章·布局控件」「grid-网格布局」（`Viewbox` 放 Grid 格子内）、`控件重绘（OnRender）`（矢量绘制与缩放）
> - 📖 官方文档：[Viewbox 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.viewbox)、[Stretch 枚举](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.media.stretch)、[布局系统概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/layout)
