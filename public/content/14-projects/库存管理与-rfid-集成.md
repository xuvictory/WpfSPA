---
title: 库存管理与 RFID 集成
section: 14-projects
parent: 14.4 项目四：智能仓储管理系统 WMS（中高级）
---

# 库存管理与 RFID 集成

> [!plain] 白话理解
> "库存管理与 RFID 集成"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"库存管理与 RFID 集成"是一个重要的知识点。把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 库存管理与 RFID 集成是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 库存管理与 RFID 集成的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"库存管理与 RFID 集成"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **库存管理与 RFID 集成演示：模拟 RFID 读卡器扫码货品标签，输入数量后执行入库 / 出库，库存台账实时刷新；库存不足时出库会被拦截并提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="库存管理与 RFID 集成" Height="460" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="RFID 扫码出入库" Foreground="#58A6FF" FontSize="14"
>                    FontWeight="Bold" Margin="0,0,0,10"/>
>         <Border Grid.Row="1" Background="#161B22" CornerRadius="6" Padding="10">
>             <StackPanel>
>                 <TextBlock Text="RFID 扫码结果" Foreground="#8B949E"/>
>                 <TextBlock x:Name="RfidText" Text="请扫描货品 RFID…" Foreground="#58A6FF"
>                            FontFamily="Consolas" Margin="0,4,0,0"/>
>                 <StackPanel Orientation="Horizontal" Margin="0,10,0,0">
>                     <TextBox x:Name="CodeBox" Text="TAG-6204" Width="120" Background="#21262D"
>                              Foreground="#58A6FF" Padding="4"/>
>                     <TextBox x:Name="QtyBox" Text="10" Width="60" Background="#21262D"
>                              Foreground="#58A6FF" Padding="4" Margin="8,0,0,0"/>
>                     <Button Content="入库" Click="OnIn" Margin="8,0,0,0" Padding="10"
>                             Background="#238636" Foreground="White"/>
>                     <Button Content="出库" Click="OnOut" Margin="8,0,0,0" Padding="10"
>                             Background="#DA3633" Foreground="White"/>
>                 </StackPanel>
>             </StackPanel>
>         </Border>
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="10" Margin="0,10">
>             <StackPanel>
>                 <TextBlock Text="库存台账" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,6"/>
>                 <ListBox x:Name="StockList" Background="#21262D" Foreground="#8B949E"
>                          BorderThickness="0" FontFamily="Consolas" Height="180"/>
>             </StackPanel>
>         </Border>
>         <TextBlock Grid.Row="3" x:Name="StatusText" Text="就绪" Foreground="#8B949E" Margin="0,6,0,0"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 库存字典：标签 → (货品名, 数量)。真实项目存储于数据库
>         private readonly Dictionary<string, (string Name, int Qty)> _stock =
>             new Dictionary<string, (string, int)>
>             {
>                 { "TAG-6204", ("轴承 6204", 120) },
>                 { "TAG-750W", ("电机 750W", 30) },
>                 { "TAG-M8",   ("螺栓 M8", 1000) }
>             };
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             RefreshStock();
>         }
>
>         // 模拟 RFID 扫码：实际为读卡器触发读码事件后查表
>         private void SimulateScan(string tag)
>         {
>             RfidText.Text = $"标签 {tag}  →  货品：{_stock[tag].Name}";
>         }
>
>         private void OnIn(object sender, RoutedEventArgs e)
>         {
>             if (!TryResolve(out string tag, out int qty)) return;
>             var item = _stock[tag];
>             _stock[tag] = (item.Name, item.Qty + qty);
>             StatusText.Text = $"入库成功：{item.Name} +{qty}";
>             StatusText.Foreground = Brushes.LimeGreen;
>             RefreshStock();
>         }
>
>         private void OnOut(object sender, RoutedEventArgs e)
>         {
>             if (!TryResolve(out string tag, out int qty)) return;
>             var item = _stock[tag];
>             if (item.Qty < qty) // 库存不足拦截出库
>             {
>                 StatusText.Text = $"出库失败：{item.Name} 库存不足（当前 {item.Qty}）";
>                 StatusText.Foreground = Brushes.OrangeRed;
>                 return;
>             }
>             _stock[tag] = (item.Name, item.Qty - qty);
>             StatusText.Text = $"出库成功：{item.Name} -{qty}";
>             StatusText.Foreground = Brushes.Orange;
>             RefreshStock();
>         }
>
>         // 统一校验：标签是否存在 + 数量是否合法
>         private bool TryResolve(out string tag, out int qty)
>         {
>             tag = CodeBox.Text.Trim();
>             qty = 0;
>             if (!_stock.ContainsKey(tag))
>             {
>                 StatusText.Text = "未识别的 RFID 标签！";
>                 StatusText.Foreground = Brushes.OrangeRed;
>                 return false;
>             }
>             if (!int.TryParse(QtyBox.Text, out qty) || qty <= 0)
>             {
>                 StatusText.Text = "数量不合法！";
>                 StatusText.Foreground = Brushes.OrangeRed;
>                 return false;
>             }
>             SimulateScan(tag);
>             return true;
>         }
>
>         private void RefreshStock()
>         {
>             StockList.Items.Clear();
>             foreach (var kv in _stock)
>                 StockList.Items.Add($"{kv.Key,-10} {kv.Value.Name,-8} 库存 {kv.Value.Qty}");
>         }
>     }
> }
> ```
> 
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"库存管理与 RFID 集成"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"库存管理与 RFID 集成"
> - → 后续必学：掌握"库存管理与 RFID 集成"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
