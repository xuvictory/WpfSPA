---
title: 创建 Hello World 项目
---

# 创建 Hello World 项目

> [!plain] 白话理解
> 这就好比第一次打开一个新买的工具箱（VS 2022），我们要用它做一个最简单的东西来确认工具能正常工作。对 WPF 开发来说，"Hello World" 就是一个窗口，上面显示一句"Hello World!"——麻雀虽小，五脏俱全，你能看到 XAML 怎么定义界面，C# 怎么响应操作。

> [!def] 官方定义
> WPF Hello World 项目是通过 Visual Studio 2022 创建的最小可运行 WPF 应用程序，包含一个 MainWindow 窗口和必要的项目文件。它是验证开发环境正确配置、理解 WPF 项目结构的第一步。

> [!origin] 由来背景
> "Hello World" 是编程界的传统，始于 1972 年 Brian Kernighan 的《C 程序设计语言》一书。它的意义在于：用最小的复杂度验证整个工具链是否工作正常。对于上位机开发，如果你能跑通 Hello World，说明 VS 安装正确、.NET SDK 版本正确、项目模板可用。

> [!essentials] 核心要点
> - 创建方式：VS 2022 → 新建项目 → 搜索"WPF" → 选择"WPF 应用程序"
> - 框架选择：推荐 .NET 8.0 或 .NET 9.0
> - 生成的文件：App.xaml、App.xaml.cs、MainWindow.xaml、MainWindow.xaml.cs
> - 运行：按 F5 或点击绿色 ▶ 按钮
> - 项目名称中不要用中文，用英文（如 `HelloWpf`）

> [!example] 完整示例
> ```xml
> <!-- MainWindow.xaml -->
> <Window x:Class="HelloWpf.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Hello WPF" Height="300" Width="400">
>     <Grid>
>         <StackPanel VerticalAlignment="Center" 
>                     HorizontalAlignment="Center">
>             <TextBlock x:Name="txtMessage" 
>                        Text="Hello World!"
>                        FontSize="36"
>                        FontWeight="Bold"
>                        Foreground="#FF6B35"
>                        TextAlignment="Center"/>
>             <Button x:Name="btnGreet"
>                     Content="打招呼"
>                     Width="120" Height="36"
>                     Margin="0,20,0,0"
>                     Click="btnGreet_Click"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> 对应的 C# 后台代码：
>
> ```csharp
> // MainWindow.xaml.cs
> using System.Windows;
> 
> namespace HelloWpf;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>     }
>     
>     private void btnGreet_Click(object sender, RoutedEventArgs e)
>     {
>         txtMessage.Text = "你好，上位机世界！";
>         MessageBox.Show("你的第一个 WPF 程序运行成功！");
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 每次新建项目后的环境验证
> ✅ 学习新框架/新技术的第一个试验品
> ✅ 快速原型验证某个想法是否可行
> ❌ 正式项目——这只是学习的起点，正式项目需要合理的架构

> [!pitfall] 常见踩坑
> 坑 1：**创建项目时找不到 WPF 模板** → VS 安装时没勾选".NET 桌面开发"工作负载，需重新运行 VS Installer 勾选
> 
> 坑 2：**运行时报错"项目文件不完整"** → 可能缺少 .NET SDK，在终端运行 `dotnet --version` 检查
> 
> 坑 3：**F5 运行时窗口一闪而过** → 这不是 Bug，程序执行完就退出了——检查 App.xaml 中 StartupUri 是否正确指向 MainWindow.xaml

> [!best] 最佳实践
> - 创建项目时选择 `.NET 8.0` 或 `.NET 9.0`（长期支持版本），不要选 .NET Framework 4.x（除非公司要求）
> - 项目命名用英文 PascalCase（如 `HmiDemo`），别用中文
> - 养成好习惯：每修改一次代码就跑一遍（F5），别攒到最后一起运行

> [!practice] 上手练习
> **Lv.1 照猫画虎**：按示例创建 Hello World 项目，确保能运行出窗口
> **Lv.2 小试牛刀**：把 TextBlock 改成红色，按钮改成蓝色，观察运行效果
> **Lv.3 融会贯通**：再加一个"退出"按钮，点击后关闭程序（提示：`Application.Current.Shutdown()`）

> [!related] 相关知识链接
> - ← 前置知识：Visual Studio 2022 安装与配置
> - ← 前置知识：WPF 是什么？
> - → 后续必学：通过 XAML 添加控件（更丰富的界面元素）
> - → 后续必学：App.xaml 与应用程序生命周期
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/get-started/create-app-visual-studio
