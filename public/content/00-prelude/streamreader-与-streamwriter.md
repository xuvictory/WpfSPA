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

> [!origin] 由来背景
> `FileStream` 给的是字节，但配置文件、日志、协议文本都是字符——每次都要自己 `Encoding.UTF8.GetString(buffer)` 转码，换行符更是折磨。.NET 1.0 就提供了 `StreamReader`/`StreamWriter` 这对"字节 ↔ 字符"翻译官：指定一次编码，之后 `ReadLine()` 拿整行、`WriteLine()` 写整行，换行与编码全部自动处理。上位机解析 CSV 设备表、读取串口返回的 ASCII 文本、按行写运行日志，都是它们的看家本领。

> [!essentials] 核心要点
> - `StreamReader.ReadLine()`：读一行（不含换行符），文件尾返回 `null`
> - `ReadToEnd()`：一口气读全部（仅小文件适用）
> - `EndOfStream`：流是否已到末尾（配合 while 循环）
> - `StreamWriter.WriteLine()`：写一行并追加换行符；`Write()` 不换行
> - 必须指定编码：`new StreamReader(path, Encoding.UTF8)`，否则按 BOM 猜测可能乱码
> - `Flush()`/`Dispose()`：把缓冲区内容真正写进磁盘；`AutoFlush = true` 可即时落盘
> - 异步配套：`ReadLineAsync`/`WriteLineAsync`，UI 线程优先

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
> ✅ 大文本文件边读边处理（不必整体加载进内存）
> ❌ 结构化配置 → 用 JSON 序列化库，别手写解析
> ❌ 二进制协议数据 → 用 `BinaryReader`/`FileStream`

> [!pitfall] 常见踩坑
> 坑 1：**编码猜错导致乱码** → 无 BOM 的 GB2312 文本按默认 UTF-8 读会乱码。显式指定 `Encoding.GetEncoding("GB2312")`。
> 坑 2：**循环边界写错** → `ReadLine()` 在文件尾返回 `null`，`while ((line = reader.ReadLine()) != null)` 比 `while (!EndOfStream)` 更安全（避免最后一行处理异常）。
> 坑 3：**写完不 Flush/不 Dispose** → 数据还留在缓冲区没落盘，程序崩溃就丢日志。using 结束自动 Dispose+Flush。
> 坑 4：**`ReadToEnd` 读大文件** → 内存爆掉。逐行循环处理。

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
