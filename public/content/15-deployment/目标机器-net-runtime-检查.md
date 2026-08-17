---
title: 目标机器 .NET Runtime 检查
section: 15-deployment
parent: 15.2 部署注意事项
---

# 目标机器 .NET Runtime 检查

> [!plain] 白话理解
> "目标机器 .NET Runtime 检查"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"目标机器 .NET Runtime 检查"是一个重要的知识点。写好的程序怎么给客户用？部署与发布是把你的心血交付到用户手中的最后一步。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 目标机器 .NET Runtime 检查是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 目标机器 .NET Runtime 检查的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：写好的程序怎么给客户用？部署与发布是把你的心血交付到用户手中的最后一步。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"目标机器 .NET Runtime 检查"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **运行环境体检：RuntimeInformation 读取框架/架构/系统信息、注册表查询 .NET Framework 版本、给出部署要求判定：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="目标机器 .NET Runtime 检查" Height="440" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="运行环境体检" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock x:Name="TxtFramework" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtVersion" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtArch" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtOs" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtCheck" Foreground="#8B949E" Margin="0,2" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>         <Button Content="重新体检" Click="OnCheckClick" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="TxtRequire" Foreground="#58A6FF" TextWrapping="Wrap" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Windows;
> using Microsoft.Win32;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnCheckClick(null, null);
>         }
>
>         private void OnCheckClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // RuntimeInformation：获取当前进程运行时的框架描述、进程架构与系统架构
>                 TxtFramework.Text = "框架：" + RuntimeInformation.FrameworkDescription;
>                 TxtVersion.Text = "CLR 版本：" + Environment.Version;
>                 TxtArch.Text = "进程架构：" + RuntimeInformation.ProcessArchitecture +
>                     "　系统架构：" + RuntimeInformation.OSArchitecture;
>                 TxtOs.Text = "操作系统：" + RuntimeInformation.OSDescription;
>
>                 // 注册表查询 .NET Framework 4.x 版本（仅作展示；框架依赖发布可据此判断目标机是否达标）
>                 string installed = "未安装/未记录";
>                 using (RegistryKey ndp = Registry.LocalMachine.OpenSubKey(
>                     @"SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full"))
>                 {
>                     if (ndp?.GetValue("Version") is string v)
>                         installed = v;
>                 }
>                 TxtCheck.Text = "注册表检测 .NET Framework 4.x：" + installed;
>                 TxtRequire.Text = "部署要求：框架依赖发布需目标机安装 .NET 6.0+ Runtime；独立发布无需安装运行时。";
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("体检失败：" + ex.Message, "环境检查");
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"目标机器 .NET Runtime 检查"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"目标机器 .NET Runtime 检查"
> - → 后续必学：掌握"目标机器 .NET Runtime 检查"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
