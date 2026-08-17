---
title: 语义版本号（SemVer）
section: 15-deployment
parent: 15.3 版本管理
---

# 语义版本号（SemVer）

> [!plain] 白话理解
> "语义版本号（SemVer）"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"语义版本号（SemVer）"是一个重要的知识点。写好的程序怎么给客户用？部署与发布是把你的心血交付到用户手中的最后一步。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 语义版本号（SemVer）是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 语义版本号（SemVer）的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：写好的程序怎么给客户用？部署与发布是把你的心血交付到用户手中的最后一步。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"语义版本号（SemVer）"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **语义版本号比较工具：解析 主.次.修订 格式并逐级比较，结合 SemVer 规则给出升级类型提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="语义版本号（SemVer）工具" Height="400" Width="500"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="语义版本号比较工具" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="版本 A（主.次.修订）" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBox x:Name="TxtVerA" Text="1.2.3" Margin="0,0,0,8" Padding="6"
>                          Background="#0D1117" Foreground="#58A6FF" BorderBrush="#21262D"/>
>                 <TextBlock Text="版本 B（主.次.修订）" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBox x:Name="TxtVerB" Text="1.3.0" Padding="6"
>                          Background="#0D1117" Foreground="#58A6FF" BorderBrush="#21262D"/>
>             </StackPanel>
>         </Border>
>         <Button Content="比较版本" Click="OnCompare" Padding="8" Margin="0,0,0,10"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="TxtResult" Foreground="#238636" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnCompare(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // 语义版本号格式：主版本.次版本.修订版本，缺失段按 0 处理
>                 Version a = ParseVersion(TxtVerA.Text);
>                 Version b = ParseVersion(TxtVerB.Text);
>                 int cmp = a.CompareTo(b);   // 内置比较：主版本优先，其次次版本，最后修订
>                 string relation = cmp < 0 ? "<" : (cmp > 0 ? ">" : "=");
>                 TxtResult.Text = "比较结果：" + a + " " + relation + " " + b;
>                 // 按 SemVer 规则提示升级类型
>                 if (a.Major != b.Major)
>                     TxtResult.Text += "\n提示：主版本号不同，属于不兼容的重大变更";
>                 else if (a.Minor != b.Minor)
>                     TxtResult.Text += "\n提示：次版本号不同，属于向后兼容的新功能更新";
>                 else if (a.Build != b.Build)
>                     TxtResult.Text += "\n提示：修订号不同，属于向后兼容的 bug 修复";
>                 else
>                     TxtResult.Text += "\n提示：两个版本完全一致";
>             }
>             catch (Exception ex)
>             {
>                 // 输入非法时给出友好提示，程序不崩溃
>                 TxtResult.Text = "版本号格式错误：" + ex.Message +
>                     "\n请按 主.次.修订 格式输入，如 2.1.0";
>             }
>         }
>
>         // 解析 主.次.修订；1 段 -> 主.0.0，2 段 -> 主.次.0
>         private static Version ParseVersion(string text)
>         {
>             string[] parts = text.Trim().Split('.');
>             return parts.Length switch
>             {
>                 1 => new Version(int.Parse(parts[0]), 0, 0),
>                 2 => new Version(int.Parse(parts[0]), int.Parse(parts[1]), 0),
>                 _ => Version.Parse(text.Trim())
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机数据展示与交互界面开发
> ✅ 工业自动化设备状态监控系统
> ✅ 需要高效数据绑定的实时数据处理场景
> ✅ 多窗口、多页面复杂导航的企业级应用
> ❌ 简单的控制台工具程序（用控制台更省事）
> ❌ 对性能要求极端苛刻的底层驱动开发（用 C++ 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**概念理解不清就上手** → 建议先把本章节的前置知识点学完，理解基础原理后再动手写代码
> 
> 坑 2：**忽略了官方文档** → Microsoft Docs 上有最权威的说明和最完整的示例代码，遇到问题先查文档
>
> 坑 3：**代码写的太"一次性"** → 养成写可复用代码的习惯，以后项目中会反复用到这些知识

> [!best] 最佳实践
> - 编写代码时保持一致的命名规范（PascalCase 用于公共成员，_camelCase 用于私有字段）
> - 善用 Visual Studio 的智能提示和代码片段，提高开发效率
> - 每个关键代码块加上注释，解释"为什么这样写"而不仅仅是"写的是什么"
> - 遵循 SOLID 原则，尤其是单一职责原则：一个类只做一件事
> - 经常重构：写完功能后回头看看有没有更简洁的写法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：阅读并运行本节示例代码，确保程序可以正常运行，修改一些参数观察效果变化
> **Lv.2 小试牛刀**：在示例代码的基础上，添加一个小功能或修改一项设置，观察程序的响应
> **Lv.3 融会贯通**：结合前面学过的知识，用"语义版本号（SemVer）"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"语义版本号（SemVer）"
> - → 后续必学：掌握"语义版本号（SemVer）"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
