---
title: StaticResource vs DynamicResource
section: 05-core-concepts
parent: 5.5 标记扩展
---

# StaticResource vs DynamicResource

> [!plain] 白话理解
> WPF 里有两种引用资源的方式：**StaticResource（静态资源）** 和 **DynamicResource（动态资源）**。它们的区别用一句话说：**StaticResource 是"抄作业"——引用时把资源的值复制过来，然后就不再管原稿怎么改了；DynamicResource 是"盯直播"——每次用到的时候都去资源字典里重新查一遍，原稿变了它也变。** 翻译成代码：StaticResource 在 XAML 加载时调用 `FindResource()` 一次；DynamicResource 在每次需要渲染时调用 `FindResource()`。所以：不在乎性能选 DynamicResource，不在乎动态选 StaticResource。

> [!def] 官方定义
> `StaticResource` 和 `DynamicResource` 都是 WPF 的资源引用标记扩展。StaticResource 在 XAML 加载阶段（Load 时）通过 `FindResource()` 查找并捕获资源的值，之后不再更新。DynamicResource 创建一个表达式（Expression），在每次属性求值时重新查找资源，因此能响应 `ResourceDictionary` 中资源的运行时替换。两者都遵循 WPF 的资源层级查找规则（控件→父容器→Window→Application→System）。

> [!origin] 由来背景
> WPF 的资源系统支持"层级查找"和"运行时替换"。这就引出一个问题：资源被替换了，使用者要不要自动更新？微软给出了两个选择：StaticResource（性能优先，一次读取）和 DynamicResource（灵活性优先，实时跟踪）。这种设计在工业上位机中很实用——大部分主题色只需要 StaticResource（启动后不变），但允许用户"换肤"的场合就需要 DynamicResource。两者的共存体现了 WPF 设计哲学：**不做一刀切，让开发者按场景选择**。

> [!essentials] 核心要点
> - **查找时机不同**：StaticResource → Load 时查找一次；DynamicResource → 每次属性求值时重新查找
> - **性能差异**：StaticResource 更快（直接引用），DynamicResource 稍慢（多一层表达式包装）
> - **动态性**：StaticResource 不响应资源变更；DynamicResource 自动响应资源字典的动态添加/移除/替换
> - **引用限制**：StaticResource 必须引用"在 XAML 顺序中已出现"的资源（前向引用会异常）；DynamicResource 无此限制
> - **使用场景**：主题色、字体、画笔等"固定资源"用 StaticResource；需要换肤/切换的资源用 DynamicResource
> - **编译行为**：DynamicResource 不参与编译时 BAML 优化，体积略大

> [!example] 完整示例
>
> 下面通过一个上位机主题切换面板，直观展示两者的行为差异。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Static vs Dynamic — 主题切换演示" Height="500" Width="650"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <!-- 默认主题色：暗色工业风 -->
>         <SolidColorBrush x:Key="PrimaryColor" Color="#FF6B35"/>
>         <SolidColorBrush x:Key="SuccessColor" Color="#3FB950"/>
>         <SolidColorBrush x:Key="DangerColor" Color="#CC2222"/>
>         <SolidColorBrush x:Key="ContentBg" Color="#161B22"/>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="TextMuted" Color="#999999"/>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         
>         <!-- 标题 -->
>         <Border Grid.Row="0" Background="{StaticResource ContentBg}"
>                 Padding="15,10" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="🎨 主题切换演示" Foreground="#FF6B35"
>                            FontSize="16" FontWeight="Bold"/>
>                 <TextBlock Text=" | StaticResource vs DynamicResource"
>                            Foreground="#999" FontSize="12"
>                            VerticalAlignment="Center" Margin="10,0,0,0"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- 主题切换按钮 -->
>         <Border Grid.Row="1" Background="{StaticResource ContentBg}"
>                 Padding="12" Margin="0,1,0,0">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="切换主题：" Foreground="#999"
>                            VerticalAlignment="Center" Margin="0,0,10,0"/>
>                 <Button Content="🏭 工业橙（默认）" Width="130" Margin="3"
>                         Click="Theme_Industrial" Foreground="White"
>                         Background="#333" BorderBrush="#555"/>
>                 <Button Content="🟢 赛博绿" Width="110" Margin="3"
>                         Click="Theme_CyberGreen" Foreground="White"
>                         Background="#333" BorderBrush="#555"/>
>                 <Button Content="🔵 海洋蓝" Width="110" Margin="3"
>                         Click="Theme_OceanBlue" Foreground="White"
>                         Background="#333" BorderBrush="#555"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- ===== 对比展示区 ===== -->
>         <Grid Grid.Row="2" Margin="15">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             
>             <!-- 左侧：使用 StaticResource -->
>             <Border Grid.Column="0" CornerRadius="8" Padding="15"
>                     Margin="0,0,8,0">
>                 <Border.Background>
>                     <!-- StaticResource — 切换主题后不变 -->
>                     <SolidColorBrush Color="{Binding Source={x:Static SystemColors.ControlDarkColor}}"/>
>                 </Border.Background>
>                 <StackPanel>
>                     <TextBlock Text="StaticResource 组"
>                                FontWeight="Bold" FontSize="15"
>                                Foreground="White" Margin="0,0,0,10"/>
>                     
>                     <Border Background="{StaticResource ContentBg}"
>                             CornerRadius="6" Padding="12" Margin="0,4">
>                         <StackPanel>
>                             <TextBlock Text="设备卡片（Static）"
>                                        Foreground="{StaticResource PrimaryColor}"
>                                        FontWeight="Bold" FontSize="13"/>
>                             <TextBlock Text="状态指示器"
>                                        Foreground="{StaticResource SuccessColor}"
>                                        FontSize="12" Margin="0,4,0,0"/>
>                             <TextBlock Text="报警信息"
>                                        Foreground="{StaticResource DangerColor}"
>                                        FontSize="12" Margin="0,4,0,0"/>
>                             <TextBlock Text="辅助文字"
>                                        Foreground="{StaticResource TextMuted}"
>                                        FontSize="11" Margin="0,4,0,0"/>
>                         </StackPanel>
>                     </Border>
>                     
>                     <TextBlock Foreground="#999" FontSize="11"
>                                Margin="0,8,0,0"
>                                TextWrapping="Wrap"
>                                Text="⚠️ 注意：切换主题后，这一组的颜色不会变化"/>
>                 </StackPanel>
>             </Border>
>             
>             <!-- 右侧：使用 DynamicResource -->
>             <Border Grid.Column="1" CornerRadius="8" Padding="15"
>                     Margin="8,0,0,0"
>                     Background="{DynamicResource ContentBg}">
>                 <StackPanel>
>                     <TextBlock Text="DynamicResource 组"
>                                FontWeight="Bold" FontSize="15"
>                                Foreground="White" Margin="0,0,0,10"/>
>                     
>                     <Border CornerRadius="6" Padding="12" Margin="0,4"
>                             Background="{DynamicResource ContentBg}"
>                             BorderBrush="{DynamicResource PrimaryColor}"
>                             BorderThickness="1">
>                         <StackPanel>
>                             <TextBlock Text="设备卡片（Dynamic）"
>                                        Foreground="{DynamicResource PrimaryColor}"
>                                        FontWeight="Bold" FontSize="13"/>
>                             <TextBlock Text="状态指示器"
>                                        Foreground="{DynamicResource SuccessColor}"
>                                        FontSize="12" Margin="0,4,0,0"/>
>                             <TextBlock Text="报警信息"
>                                        Foreground="{DynamicResource DangerColor}"
>                                        FontSize="12" Margin="0,4,0,0"/>
>                             <TextBlock Text="辅助文字"
>                                        Foreground="{DynamicResource TextMuted}"
>                                        FontSize="11" Margin="0,4,0,0"/>
>                         </StackPanel>
>                     </Border>
>                     
>                     <TextBlock Foreground="#3FB950" FontSize="11"
>                                Margin="0,8,0,0"
>                                TextWrapping="Wrap"
>                                Text="✅ 切换主题后，这一组的颜色会实时变化"/>
>                 </StackPanel>
>             </Border>
>         </Grid>
>         
>         <!-- 说明文字 -->
>         <Border Grid.Row="3" Background="{StaticResource ContentBg}"
>                 Padding="12" Margin="0,1,0,0">
>             <TextBlock Foreground="{DynamicResource TextMuted}"
>                        FontSize="11" TextWrapping="Wrap">
>                 💡 提示：观察左右两侧颜色变化的区别
>             </TextBlock>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>     }
> 
>     private void Theme_Industrial(object sender, RoutedEventArgs e)
>     {
>         SetTheme("#FF6B35", "#3FB950", "#CC2222");
>     }
> 
>     private void Theme_CyberGreen(object sender, RoutedEventArgs e)
>     {
>         SetTheme("#00FF41", "#00FF41", "#FF0066");
>     }
> 
>     private void Theme_OceanBlue(object sender, RoutedEventArgs e)
>     {
>         SetTheme("#58A6FF", "#3FB950", "#F78166");
>     }
> 
>     private void SetTheme(string primary, string success, string danger)
>     {
>         var resources = this.Resources;
>         // 直接替换现有资源（不是重设整个字典）
>         resources["PrimaryColor"] = new SolidColorBrush(
>             (Color)ColorConverter.ConvertFromString(primary));
>         resources["SuccessColor"] = new SolidColorBrush(
>             (Color)ColorConverter.ConvertFromString(success));
>         resources["DangerColor"] = new SolidColorBrush(
>             (Color)ColorConverter.ConvertFromString(danger));
>     }
> }
> ```
>
> 运行这个程序，点击三个主题按钮：
> - **左侧 StaticResource 组**：颜色不变——因为 XAML 加载时就"抄"走了初始值
> - **右侧 DynamicResource 组**：颜色实时变化——因为每次渲染都重新"盯"资源字典

> [!scene] 适用场景
> - ✅ **StaticResource**：应用启动后不会变化的资源——主题色、字体族、默认画笔、图标路径
> - ✅ **StaticResource**：高性能场景——大量 UI 元素引用同一资源时（如 DataGrid 千行数据每行都引资源颜色）
> - ✅ **DynamicResource**：运行时换肤系统——用户可切换深色/浅色/自定义主题
> - ✅ **DynamicResource**：系统资源引用——`{DynamicResource {x:Static SystemColors.ControlBrushKey}}`，用户修改系统主题时自动适配
> - ✅ **DynamicResource**：资源加载顺序不确定时——资源在 XAML 文件靠后位置定义
> - ❌ 大量重复元素中用 DynamicResource——性能开销不可忽视
> - ❌ 数据值（非视觉资源）——不应该放进资源字典

> [!pitfall] 常见踩坑
> - **坑1：只替换资源值，DynamicResource 不更新**。必须替换整个资源对象（new 一个新的 `SolidColorBrush`），不能只修改对象属性（如 `brush.Color = newColor`）。因为 DynamicResource 跟踪的是"字典里这个 key 是否被替换为一个新对象"，而不是"这个对象内部的属性是否变化"。解决方案：`resources["key"] = new SolidColorBrush(newColor);` 而非 `((SolidColorBrush)resources["key"]).Color = newColor;`
> - **坑2：StaticResource 前向引用导致 XamlParseException**。`{StaticResource key}` 引用的资源必须在 XAML 中出现在引用点之前。解决方案：将 `<ResourceDictionary>` 放在使用它的元素之前，或改用 DynamicResource。
> - **坑3：DynamicResource 不支持某些属性**。DynamicResource 只能用于依赖属性（DependencyProperty），用于 CLR 属性静默无效。解决方案：确认目标属性是依赖属性，或改用其他机制。

> [!best] 最佳实践
> - 默认全部使用 StaticResource——它是 95% 场景下的正确选择，性能更好
> - 只有明确需要"运行时动态切换"的资源才用 DynamicResource——通常在换肤相关代码中发现时才改
> - 在 App.xaml 的 Application.Resources 中定义全局主题资源，Window 级别的 Resources 中定义窗口专属资源
> - 上位机中典型的 DynamicResource 场景：用户可切换的 DCS 配色方案（暖色/冷色）、报警级别颜色方案
> - 用 DynamicResource 引用系统主题色（如 `{DynamicResource {x:Static SystemColors.ControlBrushKey}}`），让应用跟随 Windows 辅助功能设置

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：在示例基础上，把"辅助文字"的 TextBlock 也改成 DynamicResource，切换主题时观察效果
> - **Lv.2 小试牛刀**：实现一个上位机"日间/夜间模式"切换——日间用亮色背景（#FAFBFC）+ 深色文字，夜间用暗色背景（#0D1117）+ 浅色文字，用 DynamicResource 全局切换
> - **Lv.3 融会贯通**：做一个"设备状态主题联动"——5个设备卡片的数据动态变化，当任一设备报警时，全局主题自动切换为"报警主题"（红色系），报警消除后恢复默认。报警状态用一个 `AlarmBrush` 的 DynamicResource 控制

> [!related] 相关知识链接
> - ← 前置：常用内置标记扩展 — Binding、StaticResource、DynamicResource 都属于内置扩展
> - → 后续：自定义标记扩展 — 除了内置的，你还可以写自己的标记扩展
> - ⇄ 关联：资源系统 — 被 StaticResource/DynamicResource 引用的资源从哪来、怎么管理
> - ⇄ 关联：资源层级与查找顺序 — 了解 DynamicResource 查找资源的完整路径
> - 📖 官方文档：[StaticResource Markup Extension](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/advanced/staticresource-markup-extension)
