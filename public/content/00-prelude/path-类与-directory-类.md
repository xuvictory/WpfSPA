---
title: Path 与 Directory
section: 00-prelude
parent: 文件与 IO 操作
---

# Path 与 Directory

> [!plain] 白话理解
> `Path` 是"路径拼图工具"——你给它文件夹名和文件名，它给你拼出正确的完整路径，自动处理 `\` 或 `/` 的问题。`Directory` 是"文件夹管家"——创建、删除、列举、判断是否存在。上位机中管理日志文件夹、配置文件目录、数据导出路径全靠它们。

> [!def] 官方定义
> - `System.IO.Path`：提供处理文件路径字符串的静态方法（跨平台路径分隔符兼容）
> - `System.IO.Directory`：提供操作目录的静态方法

> [!example] 完整示例
> ```csharp
> // ====== Path 工具 ======
> string folder = @"C:\App\Logs";
> string file = "runtime.log";
> string fullPath = Path.Combine(folder, file);
> Console.WriteLine($"完整路径: {fullPath}");  // C:\App\Logs\runtime.log

> Console.WriteLine($"扩展名: {Path.GetExtension(fullPath)}");     // .log
> Console.WriteLine($"文件名: {Path.GetFileNameWithoutExtension(fullPath)}"); // runtime
> Console.WriteLine($"文件夹: {Path.GetDirectoryName(fullPath)}"); // C:\App\Logs

> // ====== Directory 操作 ======
> string logDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Logs");
> if (!Directory.Exists(logDir))
>     Directory.CreateDirectory(logDir);

> // 按日期创建子目录——上位机日志组织
> string todayDir = Path.Combine(logDir, DateTime.Now.ToString("yyyy-MM-dd"));
> Directory.CreateDirectory(todayDir);

> // 列举文件
> string[] logFiles = Directory.GetFiles(logDir, "*.log");
> Console.WriteLine($"日志文件数: {logFiles.Length}");

> // 清理旧日志
> foreach (string dir in Directory.GetDirectories(logDir))
> {
>     var dirInfo = new DirectoryInfo(dir);
>     if ((DateTime.Now - dirInfo.CreationTime).TotalDays > 30)
>         Directory.Delete(dir, recursive: true);
> }
> ```

> [!scene] 适用场景
> ✅ 路径拼接、文件遍历、文件夹管理

> [!best] 最佳实践
> - 路径拼接用 `Path.Combine`（不用 `+ "\\" +`）
> - 用 `Path.GetTempPath()` 做临时文件
> - 日志按日期分文件夹

> [!practice] 上手练习
> **Lv.1**：Path 的各种方法练习
> **Lv.2**：实现上位机日志文件夹自动管理（按日分目录+自动清理）

> [!related] 相关知识链接
> - ← File 类、FileStream
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.io.path
