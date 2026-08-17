---
title: 本地文件存储（JSON、XML、CSV、二进制）
section: 10-data-collection
parent: 10.3 数据存储
---

# 本地文件存储（JSON、XML、CSV、二进制）

> [!plain] 白话理解
> "本地文件存储（JSON、XML、CSV、二进制）"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"本地文件存储（JSON、XML、CSV、二进制）"是一个重要的知识点。数据是工业的灵魂。采集、处理、存储、展示——这个完整的链路就是上位机的核心价值。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 本地文件存储（JSON、XML、CSV、二进制）是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 本地文件存储（JSON、XML、CSV、二进制）的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：数据是工业的灵魂。采集、处理、存储、展示——这个完整的链路就是上位机的核心价值。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"本地文件存储（JSON、XML、CSV、二进制）"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **本地文件存储演示：设备记录分别以 JSON / XML / CSV / 二进制四种格式落盘并回读：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="本地文件存储" Height="440" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="5">
>             <Button x:Name="SaveJsonBtn" Content="保存 JSON" Click="OnSaveJson" Padding="10,6"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="SaveXmlBtn" Content="保存 XML" Click="OnSaveXml" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="6,0,0,0"/>
>             <Button x:Name="SaveCsvBtn" Content="保存 CSV" Click="OnSaveCsv" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="6,0,0,0"/>
>             <Button x:Name="SaveBinBtn" Content="保存二进制" Click="OnSaveBin" Padding="10,6"
>                     Background="#21262D" Foreground="White" Margin="6,0,0,0"/>
>         </StackPanel>
>
>         <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="5">
>             <Button x:Name="LoadBtn" Content="加载全部文件" Click="OnLoadClick" Padding="10,6"
>                     Background="#238636" Foreground="White"/>
>             <TextBlock x:Name="PathText" VerticalAlignment="Center" Margin="10,0,0,0"
>                        Foreground="#8B949E" Text="保存目录：程序运行目录"/>
>         </StackPanel>
>
>         <ListBox x:Name="FileList" Grid.Row="2" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>
>         <TextBlock x:Name="StatText" Grid.Row="3" Margin="5" Foreground="#8B949E"
>                    Text="尚未保存任何数据"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.IO;
> using System.Linq;
> using System.Text.Json;
> using System.Windows;
> using System.Xml.Linq;
>
> namespace HmiDemo
> {
>     // 演示用设备记录模型
>     public class DeviceRecord
>     {
>         public string Name { get; set; }
>         public double Temp { get; set; }
>         public bool Running { get; set; }
>     }
>
>     public partial class MainWindow : Window
>     {
>         private readonly List<DeviceRecord> _records = new List<DeviceRecord>
>         {
>             new DeviceRecord { Name = "水泵1", Temp = 45.6, Running = true },
>             new DeviceRecord { Name = "电机2", Temp = 62.1, Running = false },
>             new DeviceRecord { Name = "加热器3", Temp = 88.4, Running = true }
>         };
>
>         public MainWindow() => InitializeComponent();
>
>         // JSON：结构化、跨平台，适合配置与数据交换
>         private void OnSaveJson(object sender, RoutedEventArgs e)
>         {
>             File.WriteAllText("records.json",
>                 JsonSerializer.Serialize(_records, new JsonSerializerOptions { WriteIndented = true }));
>             FileList.Items.Insert(0, "已保存 records.json：");
>             FileList.Items.Add(File.ReadAllText("records.json"));
>         }
>
>         // XML：带层级结构，老系统与配置文件兼容性好
>         private void OnSaveXml(object sender, RoutedEventArgs e)
>         {
>             XDocument doc = new XDocument(new XElement("Records",
>                 _records.Select(r => new XElement("Device",
>                     new XAttribute("Name", r.Name),
>                     new XAttribute("Temp", r.Temp),
>                     new XAttribute("Running", r.Running)))));
>             doc.Save("records.xml");
>             FileList.Items.Insert(0, "已保存 records.xml：");
>             FileList.Items.Add(doc.ToString());
>         }
>
>         // CSV：表格型数据，可直接用 Excel 打开查看
>         private void OnSaveCsv(object sender, RoutedEventArgs e)
>         {
>             var lines = new List<string> { "Name,Temp,Running" };
>             lines.AddRange(_records.Select(r => $"{r.Name},{r.Temp},{r.Running}"));
>             File.WriteAllLines("records.csv", lines);
>             FileList.Items.Insert(0, "已保存 records.csv：");
>             FileList.Items.Add(string.Join(Environment.NewLine, lines));
>         }
>
>         // 二进制：体积小、读写快，适合高频采集数据的落盘
>         private void OnSaveBin(object sender, RoutedEventArgs e)
>         {
>             using (var fs = new FileStream("records.bin", FileMode.Create))
>             using (var bw = new BinaryWriter(fs))
>             {
>                 bw.Write(_records.Count);
>                 foreach (var r in _records)
>                 {
>                     bw.Write(r.Name);
>                     bw.Write(r.Temp);
>                     bw.Write(r.Running);
>                 }
>             }
>             FileList.Items.Insert(0, "已保存 records.bin（二进制，不可直接查看，读取速度快）");
>         }
>
>         // 加载：从二进制文件回读，验证数据完整性
>         private void OnLoadClick(object sender, RoutedEventArgs e)
>         {
>             if (!File.Exists("records.bin"))
>             {
>                 FileList.Items.Insert(0, "请先点击保存按钮再加载");
>                 return;
>             }
>             using (var fs = new FileStream("records.bin", FileMode.Open))
>             using (var br = new BinaryReader(fs))
>             {
>                 int count = br.ReadInt32();
>                 for (int i = 0; i < count; i++)
>                     FileList.Items.Insert(0,
>                         $"回读[{i}] {br.ReadString()} 温度={br.ReadDouble():F1} 运行={br.ReadBoolean()}");
>             }
>             StatText.Text = "已从二进制文件回读数据成功";
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"本地文件存储（JSON、XML、CSV、二进制）"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"本地文件存储（JSON、XML、CSV、二进制）"
> - → 后续必学：掌握"本地文件存储（JSON、XML、CSV、二进制）"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
