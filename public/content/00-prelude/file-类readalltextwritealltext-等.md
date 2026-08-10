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
