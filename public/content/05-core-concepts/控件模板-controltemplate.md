---
title: 控件模板 ControlTemplate
section: 05-core-concepts
parent: 5.8 模板
---

# 控件模板 ControlTemplate

> [!plain] 白话理解
> Style 只能改控件的"表面属性"——颜色、字体、大小。但如果你想彻底改变控件长什么样，比如把 Button 从矩形改成圆形、把 CheckBox 从方框改成滑动开关、把 ProgressBar 做成圆形仪表盘——这就需要 **ControlTemplate（控件模板）**。ControlTemplate 是控件的"骨架图纸"——里面用 Border、Grid、Ellipse、ContentPresenter 等基础构件重新拼装控件的视觉结构。按钮还是那个按钮（Click 事件、Command 绑定都正常），但看起来可以是任何样子。这就是 WPF 的"无外观控件"（Lookless Control）哲学。

> [!def] 官方定义
> `ControlTemplate` 定义了控件（Control 子类）的可视化结构（Visual Tree）和行为触发器。它通过 `Control.Template` 属性附加到控件上。模板内可以使用 `TemplateBinding` 将控件的依赖属性值传递到模板内部元素。`ContentPresenter` 是模板中必不可少的部分——它负责"展示"控件的内容（Content）。`ControlTemplate.Triggers` 可以在控件状态变化时（如 IsMouseOver、IsPressed、IsChecked）修改模板内元素的属性。每个 WPF 控件都有默认的 ControlTemplate。

> [!origin] 由来背景
> 在 WinForms 中，控件的外观是硬编码在控件的 `OnPaint` 方法中的。想自定义只能创建子类重写 `OnPaint`，费时费力还不可视化。WPF 把"控件逻辑"和"控件外观"彻底分离——Button 的 Click 逻辑和按钮长什么样子完全解耦。这意味着同样的 Button 类可以呈现出几百种不同的视觉形态，而且不需要写一行继承代码。这种设计让主题定制（如 Expression Dark/Office Blue）变得极其简单：只需要换一套 ControlTemplate 就换了一套 UI 皮肤。

> [!essentials] 核心要点
> - **TargetType**：指定模板适用于哪种控件（如 `Button`、`ProgressBar`）
> - **TemplateBinding**：把控件的外部属性（如 Background、BorderBrush）"传入"模板内部
> - **ContentPresenter**：模板中展示控件 Content 的占位元素，必不可少
> - **Triggers**：模板独有的触发器（`<ControlTemplate.Triggers>`），响应控件状态变化
> - **VisualStateManager**：WPF 4.0+ 推荐用 VisualState 替代 Trigger 管理控件状态
> - **无外观原则**：控件的逻辑（Click、Text、Value）不变，只是"皮囊"可以任意换

> [!example] 完整示例
>
> 用 ControlTemplate 自定义上位机专用的圆形按钮和仪表盘式进度条。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ControlTemplate 演示" Height="500" Width="700"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== 模板1：圆形启动/停止按钮 ===== -->
>         <Style x:Key="CircularButtonStyle" TargetType="Button">
>             <Setter Property="Width" Value="80"/>
>             <Setter Property="Height" Value="80"/>
>             <Setter Property="Foreground" Value="White"/>
>             <Setter Property="FontSize" Value="13"/>
>             <Setter Property="FontWeight" Value="Bold"/>
>             <Setter Property="Cursor" Value="Hand"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="Button">
>                         <Grid>
>                             <!-- 外圈光环 -->
>                             <Ellipse x:Name="OuterRing"
>                                      Stroke="#3FB950" StrokeThickness="2"
>                                      Fill="#1a3320"/>
>                             <!-- 内圆 -->
>                             <Ellipse x:Name="InnerCircle"
>                                      Fill="#3FB950" Margin="8"/>
>                             <!-- 内容文字 -->
>                             <ContentPresenter HorizontalAlignment="Center"
>                                               VerticalAlignment="Center"/>
>                         </Grid>
>                         <ControlTemplate.Triggers>
>                             <!-- 鼠标悬停：变亮 -->
>                             <Trigger Property="IsMouseOver" Value="True">
>                                 <Setter TargetName="OuterRing"
>                                         Property="Stroke" Value="#5FD868"/>
>                                 <Setter TargetName="InnerCircle"
>                                         Property="Fill" Value="#5FD868"/>
>                             </Trigger>
>                             <!-- 按下：缩小 -->
>                             <Trigger Property="IsPressed" Value="True">
>                                 <Setter TargetName="InnerCircle"
>                                         Property="Margin" Value="12"/>
>                                 <Setter TargetName="OuterRing"
>                                         Property="Stroke" Value="#2D8A35"/>
>                             </Trigger>
>                         </ControlTemplate.Triggers>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>         </Style>
>         
>         <!-- ===== 模板2：设备状态开关（ToggleButton） ===== -->
>         <Style x:Key="DeviceToggleStyle" TargetType="ToggleButton">
>             <Setter Property="Width" Value="70"/>
>             <Setter Property="Height" Value="34"/>
>             <Setter Property="Cursor" Value="Hand"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="ToggleButton">
>                         <Border x:Name="SwitchBorder"
>                                 CornerRadius="17"
>                                 Background="#333"
>                                 BorderBrush="#555"
>                                 BorderThickness="1">
>                             <Grid>
>                                 <!-- 滑块 -->
>                                 <Ellipse x:Name="Thumb" Width="24"
>                                          Height="24" Fill="White"
>                                          HorizontalAlignment="Left"
>                                          Margin="4,0,0,0"/>
>                                 <!-- 状态文字 -->
>                                 <TextBlock x:Name="StateText"
>                                            Text="OFF"
>                                            Foreground="#999"
>                                            FontSize="11"
>                                            HorizontalAlignment="Right"
>                                            VerticalAlignment="Center"
>                                            Margin="0,0,12,0"/>
>                             </Grid>
>                         </Border>
>                         <ControlTemplate.Triggers>
>                             <!-- 选中（ON）状态 -->
>                             <Trigger Property="IsChecked" Value="True">
>                                 <Setter TargetName="SwitchBorder"
>                                         Property="Background" Value="#3FB950"/>
>                                 <Setter TargetName="SwitchBorder"
>                                         Property="BorderBrush" Value="#3FB950"/>
>                                 <Setter TargetName="Thumb"
>                                         Property="HorizontalAlignment"
>                                         Value="Right"/>
>                                 <Setter TargetName="Thumb"
>                                         Property="Margin" Value="0,0,4,0"/>
>                                 <Setter TargetName="StateText"
>                                         Property="Text" Value="ON"/>
>                                 <Setter TargetName="StateText"
>                                         Property="Foreground" Value="White"/>
>                                 <Setter TargetName="StateText"
>                                         Property="HorizontalAlignment"
>                                         Value="Left"/>
>                                 <Setter TargetName="StateText"
>                                         Property="Margin" Value="10,0,0,0"/>
>                             </Trigger>
>                         </ControlTemplate.Triggers>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>         </Style>
>         
>         <!-- ===== 模板3：自定义 ProgressBar ===== -->
>         <Style x:Key="GaugeProgressStyle" TargetType="ProgressBar">
>             <Setter Property="Height" Value="20"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="ProgressBar">
>                         <Border Background="#1C2333"
>                                 CornerRadius="4"
>                                 BorderBrush="#444"
>                                 BorderThickness="1">
>                             <!-- 进度填充 -->
>                             <Border x:Name="PART_Track"
>                                     CornerRadius="3"
>                                     HorizontalAlignment="Left"
>                                     Margin="2">
>                                 <Border.Background>
>                                     <SolidColorBrush Color="#3FB950"/>
>                                 </Border.Background>
>                             </Border>
>                             <!-- 百分比文字 -->
>                             <TextBlock x:Name="PercentText"
>                                        Foreground="White"
>                                        FontSize="10"
>                                        HorizontalAlignment="Center"
>                                        VerticalAlignment="Center"/>
>                         </Border>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>         </Style>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <TextBlock Text="🎛️ ControlTemplate 自定义控件演示"
>                        Foreground="#FF6B35" FontSize="16"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <StackPanel Grid.Row="1" Margin="20">
>             <!-- 圆形按钮组 -->
>             <TextBlock Text="设备控制" Foreground="White"
>                        FontWeight="Bold" FontSize="14"
>                        Margin="0,0,0,10"/>
>             <StackPanel Orientation="Horizontal">
>                 <StackPanel Margin="10">
>                     <Button Content="启动"
>                             Style="{StaticResource CircularButtonStyle}"/>
>                     <TextBlock Text="电机 M-101"
>                                Foreground="#999" FontSize="11"
>                                HorizontalAlignment="Center"
>                                Margin="0,6,0,0"/>
>                 </StackPanel>
>                 <StackPanel Margin="10">
>                     <Button x:Name="StopBtn" Content="停止"
>                             Style="{StaticResource CircularButtonStyle}">
>                         <!-- 覆盖模板颜色 -->
>                         <Button.Template>
>                             <ControlTemplate TargetType="Button">
>                                 <Grid>
>                                     <Ellipse x:Name="OuterRing"
>                                              Stroke="#CC2222"
>                                              StrokeThickness="2"
>                                              Fill="#2a1515"/>
>                                     <Ellipse x:Name="InnerCircle"
>                                              Fill="#CC2222" Margin="8"/>
>                                     <ContentPresenter
>                                         HorizontalAlignment="Center"
>                                         VerticalAlignment="Center"/>
>                                 </Grid>
>                             </ControlTemplate>
>                         </Button.Template>
>                     </Button>
>                     <TextBlock Text="变频器 VFD-01"
>                                Foreground="#999" FontSize="11"
>                                HorizontalAlignment="Center"
>                                Margin="0,6,0,0"/>
>                 </StackPanel>
>             </StackPanel>
>             
>             <!-- 滑动开关 -->
>             <TextBlock Text="设备启用/禁用" Foreground="White"
>                        FontWeight="Bold" FontSize="14"
>                        Margin="0,20,0,0"/>
>             <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>                 <TextBlock Text="水泵 P-203" Foreground="#999"
>                            VerticalAlignment="Center" Width="100"/>
>                 <ToggleButton Style="{StaticResource DeviceToggleStyle}"
>                               IsChecked="True"/>
>                 <TextBlock Text="已启用" Foreground="#3FB950"
>                            VerticalAlignment="Center" Margin="10,0,0,0"
>                            FontSize="11"/>
>             </StackPanel>
>             
>             <!-- 自定义进度条 -->
>             <TextBlock Text="生产线进度" Foreground="White"
>                        FontWeight="Bold" FontSize="14"
>                        Margin="0,20,0,0"/>
>             <ProgressBar Style="{StaticResource GaugeProgressStyle}"
>                          Value="75" Maximum="100" Width="400"
>                          HorizontalAlignment="Left"
>                          Margin="0,8,0,0"/>
>         </StackPanel>
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
> 三个自定义模板：
> 1. **圆形按钮**：把 Button 的矩形模板替换为两个嵌套 Ellipse，带悬停/按下动画
> 2. **滑动开关（ToggleButton）**：滑块 + 文字，选中时滑块右移、背景变绿
> 3. **进度条**：自定义圆角进度条 + 居中文案

> [!scene] 适用场景
> - ✅ 自定义形状的按钮——圆形、六边形、带图标的复杂按钮
> - ✅ 滑动开关（Toggle Switch）——用 ToggleButton + ControlTemplate 实现
> - ✅ 自定义进度指示器——环形进度条、仪表盘、动态波纹
> - ✅ 卡片式控件——自定义外观的 ListBoxItem、ComboBoxItem
> - ✅ 主题系统——一套 ControlTemplate = 一套 UI 皮肤
> - ❌ 简单的颜色/字体修改——用 Style 就够，别动 ControlTemplate

> [!pitfall] 常见踩坑
> - **坑1：忘了放 ContentPresenter**。自定义 Button 模板中没放 ContentPresenter，结果按钮上不显示文字。解决方案：每个 ContentControl 子类的模板都必须有 ContentPresenter；ItemsControl 子类要用 ItemsPresenter。
> - **坑2：TemplateBinding 单向，无法回传**。TemplateBinding 是从控件属性到模板元素属性的单向传递，模板元素属性变了不会更新控件属性。解决方案：需要双向绑定时用 `<Binding Path="Property" RelativeSource="{RelativeSource TemplatedParent}" Mode="TwoWay"/>`。
> - **坑3：用 Name 代替 x:Name 命名模板内元素**。在 ControlTemplate 内，命名元素必须用 `x:Name`（不是 `Name`），否则 Trigger 中的 `TargetName` 找不到目标。解决方案：模板内一律用 `x:Name`。

> [!best] 最佳实践
> - 先用 Style 改外观，确需改变结构时才上 ControlTemplate——"外观微调用 Style，结构重塑用 Template"
> - 模板内用 `<ContentPresenter>` 而非硬编码 `<TextBlock Text="{TemplateBinding Content}"/>`——前者更灵活
> - 把 ControlTemplate 定义在独立的 `Generic.xaml`（Themes 文件夹）或资源字典中，而不是内嵌在 Style 的 `<Setter.Value>`
> - 上位机中为自定义控件（如 `HmiButton`、`AlarmIndicator`）创建专属 ControlTemplate

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：把普通的 CheckBox 模板改成"带确认动画的圆形复选框"——选中时内圆从小到大弹出（用 ControlTemplate.Triggers 模拟）
> - **Lv.2 小试牛刀**：做一个"设备运行指示灯"控件——基于 ToggleButton + ControlTemplate，OFF 时显示灰色圆 + "停止"，ON 时显示绿色圆 + "运行中"并带呼吸灯动画
> - **Lv.3 融会贯通**：为上位机设计一套"自定义控件库"——包括圆形仪表盘、报警指示灯、设备开关、条状进度指示器，每个控件都有独立可切换的 ControlTemplate

> [!related] 相关知识链接
> - ← 前置：上位机中样式使用技巧 — Style 不够时就来学 ControlTemplate
> - → 后续：数据模板 DataTemplate — ControlTemplate 管控件外观，DataTemplate 管数据外观
> - ⇄ 关联：模板绑定语法 — TemplateBinding 详解
> - ⇄ 关联：触发器 — ControlTemplate.Triggers 实现状态切换
> - 📖 官方文档：[ControlTemplate Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.controltemplate)
