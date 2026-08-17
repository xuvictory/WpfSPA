---
title: SaveFileDialog 保存文件对话框
section: 04-controls
parent: 4.10 对话框与交互
---

# SaveFileDialog 保存文件对话框

> [!plain] 白话理解
> SaveFileDialog 就是系统标准的「另存为」窗口：点按钮弹出熟悉的保存对话框，用户选好位置、填好文件名，程序拿到路径后把数据写进去。上位机里「导出运行数据」「保存配置快照」「导出报表」都靠它。它和 OpenFileDialog 是「一进一出」的两兄弟，一个负责读文件，一个负责写文件。

> [!def] 官方定义
> `SaveFileDialog`（全限定名 `Microsoft.Win32.SaveFileDialog`，WPF 版本）是一个标准文件保存对话框：设置 `Filter`、`FileName`（默认文件名）、`DefaultExt`（默认扩展名）、`AddExtension`（自动补扩展名）、`OverwritePrompt`（覆盖前询问）等属性后调用 `ShowDialog()`，返回 `bool?`，保存路径在 `FileName` 属性中。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.win32.savefiledialog

> [!origin] 由来背景
> 「另存为」对话框与「打开」对话框同源于 Win32 公共对话框机制，Windows 从 3.x 起就为所有应用提供统一实现。WPF 在 .NET Framework 3.0 中提供 `Microsoft.Win32.SaveFileDialog`，并针对保存场景加入了 `OverwritePrompt`（防误覆盖）、`AddExtension`（自动补扩展名）等贴心默认值。上位机的数据导出、配置备份、报告生成都依赖这套标准交互。

> [!essentials] 核心要点
> - `Filter`：导出格式过滤（如「CSV 文件 (*.csv)|*.csv」）
> - `FileName`：默认文件名，可带日期（如 `运行数据_20260818`）
> - `DefaultExt` + `AddExtension`：未写扩展名时自动补齐
> - `OverwritePrompt`：默认 `true`，覆盖已有文件前先询问
> - `ShowDialog()` 返回 `bool?`，确定后 `FileName` 为完整保存路径

> [!example] 完整示例
> **导出数据演示：SaveFileDialog 的 FileName 默认名、AddExtension 自动补扩展名、OverwritePrompt 覆盖提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="导出数据 - SaveFileDialog" Height="300" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Width="380">
>         <Button Content="导出运行数据到 CSV…" Click="OnExport" Padding="10"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="0,12,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.IO;
> using System.Text;
> using System.Windows;
> using Microsoft.Win32;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnExport(object sender, RoutedEventArgs e)
>         {
>             var dlg = new SaveFileDialog
>             {
>                 Filter = "CSV 文件 (*.csv)|*.csv|Excel 文件 (*.xlsx)|*.xlsx|所有文件 (*.*)|*.*",
>                 FileName = $"运行数据_{System.DateTime.Now:yyyyMMdd}",
>                 DefaultExt = ".csv",
>                 AddExtension = true,      // 未写扩展名时自动补齐
>                 OverwritePrompt = true    // 覆盖已有文件前先询问
>             };
>
>             if (dlg.ShowDialog() == true)
>             {
>                 // 模拟写入导出的数据
>                 var sb = new StringBuilder();
>                 sb.AppendLine("时间,温度,压力");
>                 sb.AppendLine("08:00,25.6,0.42");
>                 sb.AppendLine("08:05,25.8,0.45");
>                 File.WriteAllText(dlg.FileName, sb.ToString(), Encoding.UTF8);
>                 tipText.Text = $"导出成功：{dlg.FileName}";
>             }
>             else
>             {
>                 tipText.Text = "已取消导出";
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 导出运行数据、报警记录为 CSV / Excel / 文本
> ✅ 保存设备配置快照、配方文件
> ✅ 导出趋势图、报表为图片或 PDF
> ✅ 备份数据库 / 日志归档
> ❌ 自动保存、后台定时落盘的场景（直接用 `File.WriteAllText`，不要弹对话框打断运行）
> ❌ 只需要选择目录（不指定文件名）时（改用本章「[选择文件夹对话框](选择文件夹对话框)」）

> [!pitfall] 常见踩坑
> 坑 1：**导出的文件没有扩展名** → 现象：用户没写扩展名，保存后文件名没有后缀，双击打不开。原因：`AddExtension` 未设置或 `DefaultExt` 没配。解决：设 `DefaultExt=".csv"` + `AddExtension=true`，且 `Filter` 第一项与默认扩展名对应。
> 
> 坑 2：**覆盖已有文件没有提示，数据被覆盖** → 现象：保存到已有文件名，直接覆盖了旧数据。原因：`OverwritePrompt` 被设为 `false` 或错误配置。解决：保持默认 `true`，或保存前手动用 `File.Exists` 弹确认框。
>
> 坑 3：**写入大文件时界面卡死** → 现象：导出 10 万条记录时窗口无响应。原因：`File.WriteAllText` 在 UI 线程同步执行。解决：用 `Task.Run` 在后台写入，写完后 `Dispatcher.Invoke` 更新界面提示。

> [!best] 最佳实践
> - 默认文件名带时间戳（`运行数据_yyyyMMdd_HHmm`），避免同名覆盖，方便归档
> - 导出成功后提示完整路径与文件大小，便于用户找到文件
> - 大数据导出用后台线程 + 进度提示（参考「[progressbar-进度条](progressbar-进度条)」）
> - 写入失败（磁盘满、权限不足）用 try/catch 捕获并给出可操作提示
> - 导出格式与导入格式保持一致，保证「导出 → 再导入」能读回来

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，导出 CSV 后在文件管理器打开确认内容与编码（UTF-8）
> **Lv.2 小试牛刀**：给 `FileName` 加上时分（`运行数据_20260818_1430`）；在 `Filter` 中增加「Excel 文件 (*.xlsx)」并设 `DefaultExt=".xlsx"`
> **Lv.3 融会贯通**：把导出的数据改为真实集合（`List<(string, double, double)>`），用 `StringBuilder` 拼接后写入，并在导出前后校验行数一致
> **Lv.4 挑战进阶**：实现「后台导出 + 进度反馈」：1 万条记录用 `Task.Run` 在后台分批写入 CSV，界面用 `ProgressBar` 显示进度，完成后自动打开所在目录

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[openfiledialog-打开文件对话框](openfiledialog-打开文件对话框)」掌握对话框调用流程
> - → 后续必学：第 7 章「MVVM」中把导出逻辑封装为服务供命令调用
> - ⇄ 关联概念：选择目录见「[选择文件夹对话框](选择文件夹对话框)」，进度反馈见「[progressbar-进度条](progressbar-进度条)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.win32.savefiledialog
