---
title: 框架依赖 vs 独立部署比较
section: 15-deployment
parent: 15.1 发布方式
---

# 框架依赖 vs 独立部署比较

> [!plain] 白话理解
> "框架依赖 vs 独立部署比较"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"框架依赖 vs 独立部署比较"是一个重要的知识点。写好的程序怎么给客户用？部署与发布是把你的心血交付到用户手中的最后一步。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 框架依赖 vs 独立部署比较是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 框架依赖 vs 独立部署比较的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：写好的程序怎么给客户用？部署与发布是把你的心血交付到用户手中的最后一步。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"框架依赖 vs 独立部署比较"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **部署方式对比看板：FrameworkDescription 区分框架依赖/独立发布、发布目录文件数与体积扫描、部署形态判定：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="部署方式对比 - 框架依赖 vs 独立部署" Height="440" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="部署方式对比看板" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock x:Name="TxtFramework" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtRuntimeVersion" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtDepsCount" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtDepsSize" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtVerdict" Foreground="#238636" Margin="0,2" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>         <Button Content="重新扫描发布目录" Click="OnScanClick" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.IO;
> using System.Runtime.InteropServices;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnScanClick(null, null);
>         }
>
>         private void OnScanClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // FrameworkDescription：框架依赖发布显示目标机已安装的 .NET 版本；独立发布显示随包携带的运行时
>                 TxtFramework.Text = "当前框架：" + RuntimeInformation.FrameworkDescription;
>                 TxtRuntimeVersion.Text = "运行时版本：" + Environment.Version;
>
>                 // 独立发布会把整个运行时带入发布目录，文件数与总大小明显更大
>                 string dir = AppContext.BaseDirectory;
>                 string[] files = Directory.GetFiles(dir);
>                 long totalSize = 0;
>                 foreach (string file in files)
>                     totalSize += new FileInfo(file).Length;
>
>                 TxtDepsCount.Text = "发布目录文件数：" + files.Length + " 个";
>                 TxtDepsSize.Text = "发布目录总大小：" + (totalSize / 1024.0 / 1024.0).ToString("F1") + " MB";
>                 // 经验判断：文件数很多（>50）多为独立发布；很少则多为框架依赖
>                 TxtVerdict.Text = "判断结论：" + (files.Length > 50
>                     ? "发布目录包含大量运行时文件，疑似独立发布（目标机无需安装 .NET）"
>                     : "发布目录文件较少，疑似框架依赖（目标机需安装对应 .NET Runtime）");
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("扫描失败：" + ex.Message, "部署对比");
>             }
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"框架依赖 vs 独立部署比较"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"框架依赖 vs 独立部署比较"
> - → 后续必学：掌握"框架依赖 vs 独立部署比较"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
