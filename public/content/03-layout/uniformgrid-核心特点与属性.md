---
title: UniformGrid 核心特点与属性
section: 03-layout
parent: 3.7 UniformGrid 均匀网格
---

# UniformGrid 核心特点与属性

> [!plain] 白话理解
> 你有一个数字键盘（0-9、小数点、确认），一共 12 个按钮，你想把它们排成 4 行 × 3 列，每个按钮一样大。用 Grid 需要写 4 个 RowDefinition、3 个 ColumnDefinition，还要给每个按钮指定 Grid.Row 和 Grid.Column。**UniformGrid 的思路是：既然是等大的网格，那就别让我一行一行声明了，直接告诉我有几行几列，把子元素按顺序放进去就行。** 它就像 Excel 里先框出一个区域（4 行 × 3 列），然后从左到右、从上到下挨个填入内容。

> [!def] 官方定义
> UniformGrid 是 WPF 中的一种布局面板，继承自 Panel，用于将子元素排列在一个所有单元格大小完全相等的网格中。它提供 `Rows` 和 `Columns` 两个属性来控制网格的行列数；提供 `FirstColumn` 属性来指定第一行第一个子元素的起始列偏移。如果只指定 Rows 或只指定 Columns，另一个维度会自动根据子元素总数计算。子元素按从左到右、从上到下的顺序依次填充，无需手动指定行列索引。

> [!origin] 由来背景
> UniformGrid 是 WPF 五种核心面板里**最简洁、功能最"窄"的一个**。它的 API 只有三个属性（Rows / Columns / FirstColumn），定位非常明确：就是为"等大网格"场景而生。在 WinForms 时代，实现等大按钮面板需要用到 `TableLayoutPanel` 并手动设置每一行、每一列的百分比——代码量也不少。UniformGrid 把这个需求压缩成了一句 `<UniformGrid Rows="4" Columns="3">...</UniformGrid>`，充分体现了 WPF"声明式 UI"的简洁性。

> [!essentials] 核心要点
> - **所有单元格等大**：不管是内容多少，单元格的宽高都一致——由面板的可用空间除以行列数决定
> - **自动填充顺序**：子元素按声明顺序填入（第1个→第1行第1列，第2个→第1行第2列...），无需也不支持 Grid.Row/Column 附加属性
> - **Rows / Columns**：两者都可以省略——省略 Rows 时，按子元素总数和 Columns 自动计算行数；省略 Columns 同理；两者都省略时只产生一行
> - **FirstColumn**：让第一行的第一个子元素从第 N 列开始放置，用于创建"错位"效果（如日历月视图首日）
> - **不设固定行列数时**：子元素动态增减，行列自动调整——如果 12 个元素放 3 列，永远是 4 行
> - **性能**：比 Grid 略轻量（没有复杂的行列定义和跨行跨列计算），适合大量等大元素的简单排列

> [!example] 完整示例
>
> 下面是一个上位机中常见的**数字键盘面板**，用于在触摸屏上输入设备参数。
>
> **MainWindow.xaml** — UniformGrid 数字键盘
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备参数输入" Height="500" Width="380"
>         WindowStartupLocation="CenterScreen"
>         WindowStyle="ToolWindow">
>     
>     <Grid Background="#0D1117" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         
>         <!-- 1. 标题 -->
>         <TextBlock Grid.Row="0" Text="设置温度阈值"
>                    Foreground="#FF6B35" FontWeight="Bold"
>                    FontSize="18" Margin="0,0,0,15"/>
>         
>         <!-- 2. 数值显示区 -->
>         <Border Grid.Row="1" Background="#161B22"
>                 BorderBrush="#FF6B35" BorderThickness="1"
>                 CornerRadius="4" Padding="10" Margin="0,0,0,15">
>             <StackPanel>
>                 <TextBlock Text="当前值: 25.6 °C"
>                            Foreground="#3FB950" FontSize="13"
>                            Margin="0,0,0,5"/>
>                 <TextBlock x:Name="txtInputValue"
>                            Text="0"
>                            Foreground="White" FontSize="32"
>                            FontWeight="Bold"
>                            HorizontalAlignment="Right"/>
>                 <TextBlock x:Name="txtUnit"
>                            Text="°C"
>                            Foreground="#999" FontSize="14"
>                            HorizontalAlignment="Right"/>
>             </StackPanel>
>         </Border>
>         
>         <!-- 3. 数字键盘：4行×3列 UniformGrid -->
>         <UniformGrid Grid.Row="2" Rows="5" Columns="3">
>             
>             <!-- 第一行 -->
>             <Button Content="1" Click="DigitButton_Click" Tag="1"/>
>             <Button Content="2" Click="DigitButton_Click" Tag="2"/>
>             <Button Content="3" Click="DigitButton_Click" Tag="3"/>
>             
>             <!-- 第二行 -->
>             <Button Content="4" Click="DigitButton_Click" Tag="4"/>
>             <Button Content="5" Click="DigitButton_Click" Tag="5"/>
>             <Button Content="6" Click="DigitButton_Click" Tag="6"/>
>             
>             <!-- 第三行 -->
>             <Button Content="7" Click="DigitButton_Click" Tag="7"/>
>             <Button Content="8" Click="DigitButton_Click" Tag="8"/>
>             <Button Content="9" Click="DigitButton_Click" Tag="9"/>
>             
>             <!-- 第四行 -->
>             <Button Content="." Click="DigitButton_Click" Tag="."/>
>             <Button Content="0" Click="DigitButton_Click" Tag="0"/>
>             <Button Content="⌫" Click="BackspaceButton_Click"
>                     Background="#CC2222" Foreground="White"
>                     FontSize="18"/>
>             
>             <!-- 第五行：确认/取消按钮（跨整行，需要在 UniformGrid 外单独处理） -->
>             <Button Content="确认" Click="ConfirmButton_Click"
>                     Background="#3FB950" Foreground="White"/>
>             <Button Content="清除" Click="ClearButton_Click"
>                     Background="#555" Foreground="White"/>
>             <Button Content="取消" Click="CancelButton_Click"
>                     Background="#CC2222" Foreground="White"/>
>         </UniformGrid>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs** — 键盘输入逻辑
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
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
>     /// <summary>
>     /// 数字键/小数点：追加到输入值
>     /// </summary>
>     private void DigitButton_Click(object sender, RoutedEventArgs e)
>     {
>         if (sender is Button btn && btn.Tag is string digit)
>         {
>             // "0" 被覆盖，避免前导零
>             if (txtInputValue.Text == "0" && digit != ".")
>                 txtInputValue.Text = digit;
>             else
>                 txtInputValue.Text += digit;
>         }
>     }
> 
>     /// <summary>
>     /// 退格键：删除最后一个字符
>     /// </summary>
>     private void BackspaceButton_Click(object sender, RoutedEventArgs e)
>     {
>         if (txtInputValue.Text.Length > 1)
>             txtInputValue.Text = txtInputValue.Text[..^1]; // C# 8 范围语法
>         else
>             txtInputValue.Text = "0";
>     }
> 
>     /// <summary>
>     /// 确认键
>     /// </summary>
>     private void ConfirmButton_Click(object sender, RoutedEventArgs e)
>     {
>         if (double.TryParse(txtInputValue.Text, out double value))
>             MessageBox.Show($"温度阈值已设置为 {value} °C",
>                 "设置成功", MessageBoxButton.OK, MessageBoxImage.Information);
>         else
>             MessageBox.Show("请输入有效的数值", "输入错误",
>                 MessageBoxButton.OK, MessageBoxImage.Warning);
>     }
> 
>     /// <summary>
>     /// 清除键
>     /// </summary>
>     private void ClearButton_Click(object sender, RoutedEventArgs e)
>     {
>         txtInputValue.Text = "0";
>     }
> 
>     /// <summary>
>     /// 取消键
>     /// </summary>
>     private void CancelButton_Click(object sender, RoutedEventArgs e)
>     {
>         this.Close();
>     }
> }
> ```
>
> **App.xaml** — 键盘按钮统一样式
> ```xml
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <!-- 键盘按钮默认样式 -->
>         <Style TargetType="Button">
>             <Setter Property="Height" Value="50"/>
>             <Setter Property="Margin" Value="3"/>
>             <Setter Property="Background" Value="#1A3A5C"/>
>             <Setter Property="Foreground" Value="White"/>
>             <Setter Property="FontSize" Value="18"/>
>             <Setter Property="FontWeight" Value="Bold"/>
>             <Setter Property="BorderThickness" Value="1"/>
>             <Setter Property="BorderBrush" Value="#2A4A6C"/>
>             <Setter Property="Cursor" Value="Hand"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="Button">
>                         <Border Background="{TemplateBinding Background}"
>                                 BorderBrush="{TemplateBinding BorderBrush}"
>                                 BorderThickness="{TemplateBinding BorderThickness}"
>                                 CornerRadius="4">
>                             <ContentPresenter
>                                 HorizontalAlignment="Center"
>                                 VerticalAlignment="Center"/>
>                         </Border>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>         </Style>
>     </Application.Resources>
> </Application>
> ```
>
> 这个示例完整展示了 UniformGrid 的最佳使用场景：排列一组尺寸完全相同的交互元素（数字键盘按钮），无需为每个按钮指定行列号。
>
> [!scene] 适用场景
> - ✅ 数字键盘、计算器面板、触摸屏虚拟键盘
> - ✅ 月份日历（7 列，用 FirstColumn 偏移首日）
> - ✅ 仪表盘上的等大指示灯阵列（如 8×8 设备状态灯）
> - ✅ 颜色选择器（调色板网格）
> - ✅ 游戏棋盘（五子棋 15×15、数独 9×9、RGB 灯效矩阵）
> - ❌ 行列不等宽的表格——用 Grid
> - ❌ 需要跨行/跨列的场景——UniformGrid 不支持 RowSpan/ColumnSpan
> - ❌ 行列数不固定的动态内容（除非你能接受自动计算的行列数）

> [!pitfall] 常见踩坑
> - **坑1：Rows 和 Columns 同时设为 0 或省略**。此时 UniformGrid 不知道该用几行几列，会退化为"把所有子元素塞进一行"（Columns=子元素数，Rows=1）。解决方案：至少要指定 Rows 或 Columns 中的一个。
> - **坑2：子元素数量超出 Rows×Columns**。多出来的子元素会被截断不显示。解决方案：要么增大行列数，要么动态计算 `Rows = (int)Math.Ceiling(childrenCount / (double)Columns)`。
> - **坑3：以为 FirstColumn 对后续行也生效**。FirstColumn 只影响第一行的起始位置，第二行及之后仍然从第 0 列开始。如果需要每行都偏移，需使用其他布局方案（如嵌套 Grid）。

> [!best] 最佳实践
> - UniformGrid 最适合的场景是"先确定行列、再填入子元素"，不确定行列数时优先用 WrapPanel
> - Rows 和 Columns 只设其一，让另一个自动计算——这样增减子元素时布局自动调整
> - 子元素的样式用 `Style` 集中管理（如上面的 Button 样式），避免在每个元素上重复写 Height/Margin/Background
> - UniformGrid 默认没有单元格间距——用子元素的 `Margin` 来模拟间隔效果
> - 如果 UniformGrid 放在一个固定大小的区域内，子元素大小由区域大小 ÷ 行列数决定，确保外层容器有明确的尺寸

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：把上面的 5×3 键盘改成 4×4 十六进制输入键盘（0-9、A-F），Rows=4、Columns=4
> - **Lv.2 小试牛刀**：做一个简易的计算器界面——上半部分是显示屏（TextBox），下半部分是 UniformGrid 按键面板（4×4：7-9÷、4-6×、1-3-、C0=+），实现加减乘除四则运算
> - **Lv.3 融会贯通**：实现一个月历控件——用 UniformGrid Columns=7，用 FirstColumn 偏移当月首日是星期几，每个单元格内显示日期数字，周末标红

> [!related] 相关知识链接
> - ← 前置：Canvas 用法示例与注意事项
> - → 后续：Border 边框容器
> - ⇄ 关联：Grid — 需要跨行/跨列或不等等宽时替代 UniformGrid
> - ⇄ 关联：WrapPanel — 子元素大小可变时替代 UniformGrid
> - 📖 官方文档：[UniformGrid Class (Microsoft Docs)](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.primitives.uniformgrid)
