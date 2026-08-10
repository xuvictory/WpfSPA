---
title: StreamReader 与 StreamWriter
section: 00-prelude
parent: 文件与 IO 操作
---

# StreamReader 与 StreamWriter

> [!plain] 白话理解
> `FileStream` 读写的是字节（`byte[]`），`StreamReader`/`StreamWriter` 读写的是文本（`string`）。它们是 FileStream 的"翻译官"——把字节流翻译成字符流。你一句 `reader.ReadLine()` 就读一行文字，不用自己处理换行符和编码。上位机中解析文本格式的协议日志、配置文件最常用。

> [!def] 官方定义
> - `StreamReader`：以特定编码从字节流中读取字符。核心方法：`ReadLine()`、`ReadToEnd()`、`Read()`。
> - `StreamWriter`：以特定编码向字节流写入字符。核心方法：`Write()`、`WriteLine()`、`Flush()`。

> [!example] 完整示例
> ```csharp
> // ====== StreamWriter 写入 ======
> using var writer = new StreamWriter("log.txt", append: true);
> writer.WriteLine($"[{DateTime.Now:HH:mm:ss}] 温度={85.5}℃");
> writer.WriteLine($"[{DateTime.Now:HH:mm:ss}] 压力={2.1}MPa");

> // ====== StreamReader 读取 ======
> using var reader = new StreamReader("log.txt");
> string? line;
> while ((line = await reader.ReadLineAsync()) != null)
> {
>     Console.WriteLine(line);
> }

> // ====== 上位机：解析 CSV 配置文件 ======
> using var csvReader = new StreamReader("devices.csv");
> csvReader.ReadLine(); // 跳过标题行
> while (!csvReader.EndOfStream)
> {
>     string[] parts = (csvReader.ReadLine() ?? "").Split(',');
>     Console.WriteLine($"设备: {parts[0]}, IP: {parts[1]}, 端口: {parts[2]}");
> }
> ```

> [!scene] 适用场景
> ✅ 文本文件逐行读写（日志、CSV、配置）

> [!best] 最佳实践
> - `using`+异步 `ReadLineAsync`
> - 指定编码：`new StreamWriter(path, false, Encoding.UTF8)`
> - 配置用 JSON 而非 CSV（更结构化）

> [!practice] 上手练习
> **Lv.1**：用 StreamWriter/Reader 读写文本
> **Lv.2**：解析设备配置文件

> [!related] 相关知识链接
> - ← FileStream
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.io.streamreader
