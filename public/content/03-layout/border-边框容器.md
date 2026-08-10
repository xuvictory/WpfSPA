---
title: Border 边框容器
section: 03-layout
parent: 3.8 辅助容器
---

# Border 边框容器

> [!plain] 白话理解
> Border 就像给控件**套了一个"相框"**——不仅能给内容加上边框线，还能加背景色、圆角、内边距。它是 WPF 里最轻量级、最常用的**装饰性容器**。如果你想让一个 TextBlock 显示在带圆角的深色卡片上，或者给一组设备参数加上统一的橙色边框，Border 就是那个"一包装就变好看"的东西。Border 只能包含一个子元素（和 ScrollViewer、Viewbox 一样），如果需要包多个，就在里面套一个 Panel（通常是 StackPanel 或 Grid）。

> [!def] 官方定义
> Border 是 WPF 中的一个装饰器控件（Decorator），继承自 Decorator 类，用于给单个子元素绘制边框、背景和圆角。它提供了 `BorderBrush`（边框画刷）、`BorderThickness`（边框厚度）、`Background`（背景画刷）、`CornerRadius`（圆角半径）、`Padding`（内边距）五个核心属性。Border 支持每个角独立设置圆角半径，以及每条边独立设置边框厚度。

> [!origin] 由来背景
> 在 WinForms 时代，要给控件加边框或圆角非常麻烦——要么用 `Paint` 事件手绘，要么用第三方库。WPF 将边框/圆角做成了独立于任何控件的内置功能——`Border` 元素。这意味着任何内容都可以被"包一层 Border"来获得边框和圆角效果，不必修改原控件的代码。这种"装饰器模式"（Decorator Pattern）在 WPF 布局中非常普遍。

> [!essentials] 核心要点
> - **只能包含一个子元素**：如果需要多个子元素，在 Border 内部放一个 Panel（如 StackPanel）
> - **五个核心属性**：`BorderBrush`（边框颜色）、`BorderThickness`（粗细）、`Background`（内部填充色）、`CornerRadius`（圆角）、`Padding`（内边距）
> - **圆角支持异形**：`CornerRadius="8,0,8,0"` 可以分别设置左上、右上、右下、左下四个角的半径，实现"半边圆角"效果
> - **边框支持异形**：`BorderThickness="2,0,2,0"` 可以分别设置左、上、右、下边的粗细
> - **Background 和 BorderBrush 都支持渐变**：可以用 `LinearGradientBrush`、`RadialGradientBrush` 等画刷
> - **不是 Panel**：Border 继承自 `Decorator`，不是 `Panel`，因此不能直接放多个子元素

> [!example] 完整示例
>
> 下面是一个上位机中典型的**设备信息卡片**：用 Border 实现卡片背景、圆角、边框效果。
>
> **MainWindow.xaml** — Border 卡片布局
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备监控主页" Height="450" Width="750"
>         WindowStartupLocation="CenterScreen">
>     
>     <Grid Background="#0D1117">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         
>         <!-- 标题栏 -->
>         <Border Grid.Row="0" Background="#161B22" Padding="15,10"
>                 BorderBrush="#2A4A6C" BorderThickness="0,0,0,1">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="📊 设备监控主页"
>                            Foreground="#FF6B35" FontSize="16"
>                            FontWeight="Bold" VerticalAlignment="Center"/>
>                 <TextBlock Text=" | 系统运行正常"
>                            Foreground="#3FB950" FontSize="12"
>                            VerticalAlignment="Center" Margin="12,0,0,0"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- 卡片区域：用 WrapPanel 排列 -->
>         <WrapPanel Grid.Row="1" Margin="15" ItemWidth="220"
>                    ItemHeight="140">
>             
>             <!-- 卡片1：正常设备 -->
>             <Border Width="210" Height="130" Margin="5"
>                     Background="#161B22" CornerRadius="8"
>                     BorderBrush="#3FB950" BorderThickness="1"
>                     Padding="12">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#3FB950"
>                                  VerticalAlignment="Center"/>
>                         <TextBlock Text=" 电机 M-101"
>                                    Foreground="White" FontSize="14"
>                                    FontWeight="Bold"
>                                    VerticalAlignment="Center"
>                                    Margin="5,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Text="状态: 运行中"
>                                Foreground="#3FB950" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="转速: 1480 rpm"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                     <TextBlock Text="温度: 42°C"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 卡片2：报警设备 -->
>             <Border Width="210" Height="130" Margin="5"
>                     Background="#161B22" CornerRadius="8"
>                     BorderBrush="#CC2222" BorderThickness="2"
>                     Padding="12">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#CC2222"
>                                  VerticalAlignment="Center"/>
>                         <TextBlock Text=" 变频器 VFD-01"
>                                    Foreground="White" FontSize="14"
>                                    FontWeight="Bold"
>                                    VerticalAlignment="Center"
>                                    Margin="5,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Text="状态: 过载报警"
>                                Foreground="#CC2222" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="电流: 48.5 A"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                     <TextBlock Text="频率: 50 Hz"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 卡片3：待机设备 -->
>             <Border Width="210" Height="130" Margin="5"
>                     Background="#161B22" CornerRadius="8"
>                     BorderBrush="#555" BorderThickness="1"
>                     Padding="12">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#999"
>                                  VerticalAlignment="Center"/>
>                         <TextBlock Text=" PLC-CPU1"
>                                    Foreground="White" FontSize="14"
>                                    FontWeight="Bold"
>                                    VerticalAlignment="Center"
>                                    Margin="5,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Text="状态: 待机"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="CPU 使用率: 12%"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                     <TextBlock Text="内存: 256 MB"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 卡片4：不同圆角渐变边框 -->
>             <Border Width="210" Height="130" Margin="5"
>                     Background="#161B22" CornerRadius="16,4,16,4"
>                     Padding="12">
>                 <Border.BorderBrush>
>                     <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
>                         <GradientStop Color="#FF6B35" Offset="0"/>
>                         <GradientStop Color="#3FB950" Offset="1"/>
>                     </LinearGradientBrush>
>                 </Border.BorderBrush>
>                 <Border.BorderThickness>1.5</Border.BorderThickness>
>                 <StackPanel>
>                     <TextBlock Text="传感器阵列"
>                                Foreground="White" FontSize="14"
>                                FontWeight="Bold"/>
>                     <TextBlock Text="温度: 23.5°C"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="湿度: 65%"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                     <TextBlock Text="气压: 1013 hPa"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>         </WrapPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs**
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
> 这个示例展示了 Border 在卡片式 UI 中的四个典型用法：
> 1. **底部边框**：标题栏用 `BorderThickness="0,0,0,1"` 画一条分隔线
> 2. **状态颜色边框**：绿色（正常）、红色（报警）、灰色（待机）
> 3. **圆角卡片**：`CornerRadius="8"` 四个角统一圆角
> 4. **渐变边框 + 异形圆角**：`CornerRadius="16,4,16,4"` 实现左上/右下大圆角
>
> [!scene] 适用场景
> - ✅ 卡片式 UI（设备信息卡、报警通知卡、参数配置卡）
> - ✅ 给控件分组加框（用 Border 包住一组控件，加背景和边框）
> - ✅ 底部/顶部/侧边分隔线（`BorderThickness="0,0,0,1"` 画一条细线）
> - ✅ 圆角容器（Button、TextBox 等控件本身支持圆角，但 Border 更通用）
> - ✅ 状态指示（绿色边框=正常、红色边框=报警、黄色边框=警告）
> - ❌ 需要滚动的内容区——用 ScrollViewer 包在最外层
> - ❌ 需要缩放的内容——用 Viewbox

> [!pitfall] 常见踩坑
> - **坑1：Border 内放多个子元素**。Border 的 Child 属性只能设一个，写多个子元素会报 XAML 解析错误。解决方案：在 Border 内套一个 Panel（`<StackPanel>`、`<Grid>`）。
> - **坑2：CornerRadius 溢出**。如果 `CornerRadius` 值太大（比如 50），而 Border 只有 30×30，圆角会相互重叠导致渲染异常。解决方案：确保 `CornerRadius ≤ Min(Width, Height) / 2`。
> - **坑3：Border 嵌套 Border 浪费层级**。新手容易写 `<Border><Border><TextBlock/></Border></Border>` 来分别设背景和边框。解决方案：一个 Border 就同时支持 `Background`、`BorderBrush`、`CornerRadius` 和 `Padding`，不需要嵌套。

> [!best] 最佳实践
> - 卡片式 UI 的边距统一用 `Padding` 而非子元素的 `Margin`——这样修改卡片内边距只需要改一个地方
> - 状态颜色（绿/红/黄）可以通过 Binding 动态控制——把 `BorderBrush` 绑定到 ViewModel 的 Status 属性，用 `IValueConverter`（或 DataTrigger）转换颜色
> - Border 作为装饰器，厚度建议 1-2px，不宜过粗（除非刻意强调）
> - 上位机中的"分区线"需求，优先用 `Border`（宽为 1px、背景色为分隔色）而非 `Rectangle`，因为 Border 更轻量且可以附带 Padding
> - 如果需要阴影效果，Border 本身不支持——可以查考 `DropShadowEffect`（BitmapEffect）或第三方控件库

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：修改上面的示例，新增一张"设备离线"卡片——灰色半透明背景、灰色虚线边框（用 `StrokeDashArray` 样式模拟，或直接用浅灰 BorderBrush）
> - **Lv.2 小试牛刀**：实现一个"参数配置面板"——用 Border 包装每一个参数行，背景交替（奇行深色、偶行浅色），参数名在左、参数值在右，用不同的 CornerRadius 区分第一行（顶部圆角）和最后一行（底部圆角）
> - **Lv.3 融会贯通**：做一个"报警优先级的渐变卡片"——根据报警等级（1-4），边框从红色→橙色→黄色→蓝色渐变，且内部背景也有相应的淡色渐变

> [!related] 相关知识链接
> - ← 前置：UniformGrid 均匀网格
> - → 后续：ScrollViewer 滚动容器
> - ⇄ 关联：Decorator 类 — Border、Viewbox、ScrollViewer 都继承自它
> - ⇄ 关联：Button.Template — 自定义按钮模板时大量使用 Border 作为视觉元素
> - 📖 官方文档：[Border Class (Microsoft Docs)](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.border)
