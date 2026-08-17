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

> [!origin] 由来背景
> 早期写路径全凭字符串拼接：`folder + "\\" + name`，Windows 用 `\`、Linux 用 `/`，目录结尾有没有分隔符、路径里有没有非法字符，全靠程序员自觉，坑不胜坑。`Path` 类把所有路径处理的脏活揽了下来：自动补分隔符、跨平台兼容、提取扩展名、判断绝对路径。`Directory` 类则把"文件夹"这个抽象补全。两者配合，上位机的"日志按日期建目录、定期清理旧日志"才能写得干净利落。

> [!essentials] 核心要点
> - `Path.Combine(a, b, ...)`：安全拼接，自动处理分隔符（替代 `+ "\\"`）
> - `Path.GetExtension` / `GetFileNameWithoutExtension` / `GetDirectoryName`：路径三段拆分
> - `Path.ChangeExtension`：换扩展名；`Path.GetTempPath`：系统临时目录
> - `Directory.Exists` / `CreateDirectory`：判断存在、创建目录（多级目录自动递归创建）
> - `Directory.GetFiles(dir, pattern)`：按通配符列举文件；`GetDirectories` 列举子目录
> - `Directory.Delete(dir, recursive: true)`：递归删除整棵目录树

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
> ✅ 日志目录按日期规划、旧日志自动清理
> ❌ 大批量文件递归处理 → 用 `Directory.EnumerateFiles` 惰性遍历，别一次 `GetFiles` 全载入内存

> [!pitfall] 常见踩坑
> 坑 1：**路径拼接用 `+`** → 漏一个 `\` 就路径失效。一律 `Path.Combine`。
> 坑 2：**`GetFiles` 全量载入大目录** → 上万文件吃光内存。用 `Directory.EnumerateFiles` 惰性遍历。
> 坑 3：**`Directory.Delete` 删非空目录报错** → 需要 `recursive: true` 参数。
> 坑 4：**相对路径依赖当前工作目录** → 以服务方式启动时工作目录会变，找不到文件。用 `AppContext.BaseDirectory` 定位程序所在目录。

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
