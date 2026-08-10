---
title: 属性触发器 Trigger
section: 05-core-concepts
parent: 5.9 触发器
---

# 属性触发器 Trigger

> [!plain] 白话理解
> 触发器（Trigger）就是给 UI 加的"条件判断"。你用 `Trigger` 来定义"当某个属性等于某个值时，就做某件事"。最经典的需求：鼠标悬停按钮时变亮、按钮按下时变暗、CheckBox 选中时变绿。不需要写一行 C# 代码——在 Style 或 ControlTemplate 里声明一个 Trigger，它自动帮你管好"什么时候变"和"怎么变回来"。Trigger 监控的是控件的**依赖属性**值（如 IsMouseOver、IsPressed、IsChecked），值匹配 → 设置覆盖属性值，值不匹配 → 自动恢复原值。

> [!def] 官方定义
> `Trigger` 是 WPF 中最基础的触发器类型，继承自 `TriggerBase`。它包含三个关键部分：① `Property`：被监控的依赖属性；② `Value`：触发条件（属性等于此值时触发）；③ `Setters`：触发后要设置的一组属性值。Trigger 放置在 `Style.Triggers`、`ControlTemplate.Triggers`、`DataTemplate.Triggers` 等集合中。当 `Property` 的值与 `Value` 匹配时，Setter 属性被临时应用；不匹配时自动还原。Trigger 不保留"触发后"的状态——它是无状态的纯条件判断。

> [!origin] 由来背景
> 在 WinForms 中，实现"鼠标悬停时按钮背景变亮"需要写 MouseEnter 和 MouseLeave 两个事件处理器，还要手动保存旧颜色以便还原。这种代码又散又重复。WPF 的 Trigger 机制把"条件→动作"的交互逻辑从代码中抽离到了 XAML 声明式中，不仅代码量大大减少，还让 UI 设计师可以不依赖程序员独立完成交互效果的设计。底层实现利用了依赖属性的"值优先级"系统——Trigger 的 Setter 在激活时写入一个高于 Style 优先级的值，取消时清除该优先级的值。

> [!essentials] 核心要点
> - **三个要素**：Property（监控什么）→ Value（触发条件）→ Setters（触发后做什么）
> - **自动还原**：条件不满足时，Trigger 设置的属性值自动清除，回到原有值
> - **只能监控依赖属性**：Property 必须是一个 DependencyProperty
> - **多个 Trigger 可以共存**：同一控件的不同 Trigger 监控不同属性
> - **优先级**：Trigger 的优先级低于本地属性值，但高于 Style 中的 Setter
> - **EnterActions / ExitActions**：还可以在触发时播放 Storyboard 动画

> [!example] 完整示例
>
> 演示上位机中 Trigger 的主要用法——设备状态指示器、悬停效果、按下反馈。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Trigger 属性触发器演示" Height="500" Width="700"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== 样式1：设备操作按钮（多个 Trigger） ===== -->
>         <Style x:Key="DeviceActionButton" TargetType="Button">
>             <Setter Property="Background" Value="#333"/>
>             <Setter Property="Foreground" Value="White"/>
>             <Setter Property="BorderBrush" Value="#555"/>
>             <Setter Property="BorderThickness" Value="1"/>
>             <Setter Property="Padding" Value="14,8"/>
>             <Setter Property="FontSize" Value="13"/>
>             <Setter Property="FontWeight" Value="SemiBold"/>
>             <Setter Property="Cursor" Value="Hand"/>
>             <Setter Property="MinWidth" Value="110"/>
>             <Setter Property="Margin" Value="4"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="Button">
>                         <Border x:Name="border"
>                                 Background="{TemplateBinding Background}"
>                                 BorderBrush="{TemplateBinding BorderBrush}"
>                                 BorderThickness="{TemplateBinding BorderThickness}"
>                                 CornerRadius="6"
>                                 Padding="{TemplateBinding Padding}">
>                             <ContentPresenter HorizontalAlignment="Center"
>                                               VerticalAlignment="Center"/>
>                         </Border>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>             <Style.Triggers>
>                 <!-- 悬停：变亮 -->
>                 <Trigger Property="IsMouseOver" Value="True">
>                     <Setter Property="Background" Value="#FF6B35"/>
>                     <Setter Property="BorderBrush" Value="#FF6B35"/>
>                 </Trigger>
>                 <!-- 按下：变暗 + 缩小内边距 -->
>                 <Trigger Property="IsPressed" Value="True">
>                     <Setter Property="Background" Value="#994422"/>
>                     <Setter Property="Padding" Value="14,6,14,10"/>
>                 </Trigger>
>                 <!-- 不可用时：灰色 -->
>                 <Trigger Property="IsEnabled" Value="False">
>                     <Setter Property="Background" Value="#222"/>
>                     <Setter Property="Foreground" Value="#555"/>
>                     <Setter Property="BorderBrush" Value="#333"/>
>                 </Trigger>
>             </Style.Triggers>
>         </Style>
>         
>         <!-- ===== 样式2：设备状态卡片（Trigger 在 ControlTemplate 中） ===== -->
>         <Style x:Key="StatusCardStyle" TargetType="Border">
>             <Setter Property="Background" Value="{StaticResource CardBg}"/>
>             <Setter Property="CornerRadius" Value="8"/>
>             <Setter Property="Padding" Value="15"/>
>             <Setter Property="Margin" Value="5"/>
>             <Setter Property="Width" Value="200"/>
>             <Setter Property="Height" Value="120"/>
>             <Setter Property="BorderThickness" Value="2"/>
>             <Setter Property="BorderBrush" Value="#444"/>
>             <Style.Triggers>
>                 <!-- 悬停：整体放大 + 边框高亮 -->
>                 <Trigger Property="IsMouseOver" Value="True">
>                     <Setter Property="BorderBrush" Value="#FF6B35"/>
>                     <Setter Property="Background" Value="#1a2a3a"/>
>                 </Trigger>
>             </Style.Triggers>
>         </Style>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <TextBlock Text="🎯 Trigger 属性触发器演示"
>                        Foreground="#FF6B35" FontSize="16"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <!-- 设备卡片区 -->
>         <WrapPanel Grid.Row="1" Margin="15">
>             
>             <Border Style="{StaticResource StatusCardStyle}">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#3FB950"/>
>                         <TextBlock Text=" 电机 M-101"
>                                    Foreground="White"
>                                    FontWeight="Bold" FontSize="14"/>
>                     </StackPanel>
>                     <TextBlock Text="转速: 1480 rpm"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="温度: 42°C"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <Border Style="{StaticResource StatusCardStyle}">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#CC2222"/>
>                         <TextBlock Text=" 变频器 VFD-01"
>                                    Foreground="White"
>                                    FontWeight="Bold" FontSize="14"/>
>                     </StackPanel>
>                     <TextBlock Text="电流: 48.5 A"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="⚠ 过载报警"
>                                Foreground="#CC2222" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>             <Border Style="{StaticResource StatusCardStyle}">
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10" Fill="#999"/>
>                         <TextBlock Text=" PLC-CPU1"
>                                    Foreground="White"
>                                    FontWeight="Bold" FontSize="14"/>
>                     </StackPanel>
>                     <TextBlock Text="状态: 待机"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,8,0,0"/>
>                     <TextBlock Text="CPU: 12%"
>                                Foreground="#999" FontSize="12"
>                                Margin="0,4,0,0"/>
>                 </StackPanel>
>             </Border>
>             
>         </WrapPanel>
>         
>         <!-- 按钮区：演示三种 Trigger 状态 -->
>         <StackPanel Grid.Row="2" Margin="0,0,0,15">
>             <StackPanel Orientation="Horizontal"
>                         HorizontalAlignment="Center">
>                 <Button Content="🔄 刷新数据"
>                         Style="{StaticResource DeviceActionButton}"/>
>                 <Button Content="📊 导出报表"
>                         Style="{StaticResource DeviceActionButton}"/>
>                 <Button Content="⚠ 紧急停止"
>                         Style="{StaticResource DeviceActionButton}"/>
>                 <!-- 禁用的按钮：演示 IsEnabled Trigger -->
>                 <Button Content="🔒 无权限"
>                         Style="{StaticResource DeviceActionButton}"
>                         IsEnabled="False"/>
>             </StackPanel>
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
> 三个 Trigger 的作用：
> | Trigger | 条件 | 效果 |
> |---------|------|------|
> | IsMouseOver = True | 鼠标悬停 | 背景变橙色 |
> | IsPressed = True | 鼠标按下 | 背景变暗褐色 + 内边距调整 |
> | IsEnabled = False | 控件禁用 | 全部变灰色 |
> | （卡片）IsMouseOver | 鼠标悬停 | 边框变橙 + 背景稍亮 |

> [!scene] 适用场景
> - ✅ 按钮交互效果——悬停/按下/禁用三种状态
> - ✅ 选中态效果——ListBoxItem 选中时背景高亮
> - ✅ 验证状态指示——TextBox 验证失败时边框变红
> - ✅ ToggleButton 的 ON/OFF 状态——IsChecked 控制
> - ✅ 展开/折叠提示——Expander 的 IsExpanded 触发箭头旋转
> - ❌ 需要判断数据值（非控件属性值）的场景——用 DataTrigger
> - ❌ 多条件同时满足才触发——用 MultiTrigger

> [!pitfall] 常见踩坑
> - **坑1：Trigger 在 Style.Triggers 和 ControlTemplate.Triggers 中的优先级不同**。ControlTemplate.Triggers 中的 Trigger 优先级高于 Style.Triggers 中的同名 Trigger。解决方案：把交互性强的 Trigger 放在 ControlTemplate 中，外观调整的 Trigger 放在 Style 中。
> - **坑2：Trigger 的 Setter 设了 Property 值，但"松开鼠标"后不恢复**。这通常是因为另一个更高优先级的 Setter 冲突了（比如代码中手动设了属性的本地值）。解决方案：检查是否有 `button.Background = xxx` 的代码；Trigger 恢复机制只在没有本地值覆盖的情况下生效。
> - **坑3：同一个 Style 中多个 Trigger 设同一个 Property**。如 IsMouseOver 和 IsPressed 都设 Background，IsPressed 时两个条件都满足，可能冲突。解决方案：利用优先级——后定义的 Trigger 生效；或改用 VisualStateManager 替代复杂多态交互。

> [!best] 最佳实践
> - 按钮的交互效果（悬停/按下/禁用）用 Trigger 声明——不用事件代码，保持完全 XAML 化
> - 在样式设计阶段，确保每个交互状态都至少有视觉反馈——这是好的 UX 基础
> - Trigger 的 Value 使用枚举值时，XAML 中要写完整的枚举值名（如 `Value="True"` 不是 `Value="true"`）
> - 上位机的操作按钮要有明显的状态区分——悬停=亮色、按下=深色、禁用=灰色半透明

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：为 CheckBox 创建自定义 Trigger 样式——未选中=灰色方块、选中=绿色方块带勾、悬停=带边框
> - **Lv.2 小试牛刀**：做一个"设备运行状态切换按钮"（基于 ToggleButton）——OFF=灰色圆+文字"已停止"、ON=绿色圆+文字"运行中"，用 IsChecked Trigger 自动切换全部外观
> - **Lv.3 融会贯通**：创建一个"上位机设备报警指示器"——基于 Ellipse+Trigger 实现 4 级状态（正常=绿色、注意=黄色闪烁、报警=红色、离线=灰色），闪烁效果用 EnterActions/ExitActions + Storyboard 实现

> [!related] 相关知识链接
> - ← 前置：Style 核心属性 — Trigger 是 Style 的四个核心属性之一
> - → 后续：多条件触发器 MultiTrigger — 需要多个条件同时满足时
> - ⇄ 关联：DataTrigger — 根据数据值触发
> - ⇄ 关联：控件模板 — ControlTemplate.Triggers 中使用 Trigger
> - 📖 官方文档：[Trigger Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.trigger)
