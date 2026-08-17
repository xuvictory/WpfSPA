---
title: File 类（文件读写）
section: 00-prelude
parent: 文件与 IO 操作
---

# File 类（文件读写）

> [!plain] 白话理解
> `File` 类是 C# 里最简单直接的文件操作工具——一行代码读全部内容、一行代码全写进去。就像用 Ctrl+C/Ctrl+V 操作文件。适合处理小型配置文件、日志摘要、JSON 配置文件。上位机中，`File.ReadAllText("config.json")` 读取设备参数配置、`File.WriteAllLines("log.csv", lines)` 导出数据报表。

> [!def] 官方定义
> `System.IO.File` 提供静态方法用于创建、复制、删除、移动和读写文件。常用方法：
> - `ReadAllText`/`WriteAllText`：全文本读写
> - `ReadAllLines`/`WriteAllLines`：行数组读写
> - `ReadAllBytes`/`WriteAllBytes`：字节读写（二进制文件）
> - `AppendAllText`/`AppendAllLines`：追加
> - `Exists`/`Delete`/`Copy`/`Move`

> [!origin] 由来背景
> 早期 .NET 1.x 读写文件只有 `FileStream` 配 `StreamReader`/`StreamWriter`，读一个文件要 new 三个对象、写两三行样板代码，做个"读配置、写日志"都要小心翼翼。微软后来为最常见的场景提供 `File` 这个静态门面：一个方法完成打开、读取、关闭全流程，`ReadAllText`/`WriteAllLines` 等一行 API 应运而生。上位机里的配置加载、CSV 导出、运行日志追加，绝大多数都是"整读整写"，用 `File` 类最省事；确实需要流式处理大文件时才下沉到 `FileStream`。

> [!essentials] 核心要点
> - 文本整体读写：`ReadAllText` / `WriteAllText`（默认 UTF-8）
> - 行数组：`ReadAllLines` / `WriteAllLines`（自动处理换行符）
> - 二进制：`ReadAllBytes` / `WriteAllBytes`（图片、加密数据、协议帧）
> - 追加：`AppendAllText` / `AppendAllLines`（日志首选，不覆盖原内容）
> - 检查与删除：`Exists`、`Delete`（删除前必须判断存在，否则抛 `FileNotFoundException`）
> - 所有方法都有 Async 版本，UI 线程优先 `ReadAllTextAsync`

> [!example] 完整示例
> ```csharp
> // ====== 文本读写 ======
> string config = "{\"ip\":\"192.168.1.100\",\"port\":502}";
> File.WriteAllText("config.json", config);
> string readBack = File.ReadAllText("config.json");
> Console.WriteLine($"配置: {readBack}");

> // ====== CSV 导出 ======
> var lines = new List<string> { "时间,设备,温度", "14:00,PLC-001,85.5", "14:01,PLC-001,84.2" };
> File.WriteAllLines("export.csv", lines);

> // ====== 追加日志 ======
> File.AppendAllText("runtime.log", $"[{DateTime.Now:HH:mm:ss}] 系统启动\n");

> // ====== 文件检查 ======
> if (File.Exists("config.json"))
>     Console.WriteLine($"文件大小: {new FileInfo("config.json").Length} 字节");
> ```

> [!scene] 适用场景
> ✅ 配置文件、日志、数据导出
> ✅ 小文件（<10MB）一次性读写
> ❌ 大文件 → FileStream 流式处理

> [!pitfall] 常见踩坑
> 坑 1：**读写时文件被占用** → 报 `IOException: 文件正由另一进程使用`。多进程写同一文件时用 `FileShare.ReadWrite`，或让单一进程负责写文件。
> 坑 2：**删除不存在的文件** → `File.Delete` 找不到文件直接抛 `FileNotFoundException`。先 `if (File.Exists(path))` 再删。
> 坑 3：**路径硬编码 `\`** → 换台机器或换系统就失效。用 `Path.Combine` 拼接路径。
> 坑 4：**默认编码乱码** → `WriteAllText` 默认 UTF-8 无 BOM，老设备或 GB2312 环境可能乱码。按需指定 `Encoding.GetEncoding("GB2312")` 或带 BOM 的 UTF-8。

> [!best] 最佳实践
> - 异步版本优先：`ReadAllTextAsync`/`WriteAllTextAsync`
> - 使用 `Path.Combine` 构造路径
> - 读写前检查 `File.Exists`

> [!practice] 上手练习
> **Lv.1**：用 File 读写配置、追加日志
> **Lv.2**：上位机数据导出为 CSV

> [!related] 相关知识链接
> - → FileStream
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.io.file
