---
title: FileStream 文件流
section: 00-prelude
parent: 文件与 IO 操作
---

# FileStream 文件流

> [!plain] 白话理解
> 如果说 `File.ReadAllText` 是一口气喝完一杯水，那 `FileStream` 就是用吸管慢慢吸——你可以控制每次读多少、从哪里开始读、读到哪停下。处理几百 MB 的传感器日志文件时，`ReadAllText` 可能把内存撑爆，而 `FileStream` 每次只读一小块，像水龙头一样流式处理。

> [!def] 官方定义
> `System.IO.FileStream` 提供对文件的**流式**访问，支持同步和异步操作。可以精确控制读写位置（`Seek`）、缓冲区大小、文件打开方式（`FileMode`）、访问方式（`FileAccess`）和共享方式（`FileShare`）。

> [!origin] 由来背景
> 早年内存还很金贵，几百 MB 的日志文件用 `File.ReadAllBytes` 一次读进内存会直接吃光可用内存。`FileStream` 是 .NET 从 Windows API 继承下来的"流式"访问模型：底层每次只向操作系统要一小块缓冲，随读随丢，无论文件多大，内存占用都恒定。上位机里传感器日志一天能攒出上百 MB，用 `FileStream` 边写边落盘、按时间戳随机回读某一段，正是它存在的意义。

> [!essentials] 核心要点
> - `FileMode`：`Create`（新建/覆盖）、`Open`（必须存在）、`Append`（追加）、`CreateNew`（存在即报错）
> - `FileAccess`：`Read` / `Write` / `ReadWrite`
> - `FileShare`：`None`（独占）、`Read`（别人可读）、`ReadWrite`（别人可读写）
> - `Seek(offset, SeekOrigin)` 与 `Position` 属性控制随机访问位置
> - 读取必须用循环：`Read` 返回实际读取字节数，可能小于 buffer 长度
> - 大文件与 UI 场景用 `ReadAsync`/`WriteAsync` + `FileOptions.Asynchronous`

> [!example] 完整示例
> ```csharp
> // ====== 写入二进制数据 ======
> using var fs = new FileStream("data.bin", FileMode.Create);
> byte[] header = { 0xAA, 0xBB, 0x01, 0x03 };
> fs.Write(header, 0, header.Length);
> Console.WriteLine($"写入 {header.Length} 字节，位置={fs.Position}");

> // ====== 读取二进制数据 ======
> using var readFs = new FileStream("data.bin", FileMode.Open);
> byte[] buffer = new byte[4];
> int bytesRead = readFs.Read(buffer, 0, buffer.Length);
> Console.WriteLine($"读取: [{string.Join(" ", buffer.Select(b => $"{b:X2}"))}]");

> // ====== 上位机：写入传感器数据日志 ======
> using var logFs = new FileStream("sensor.dat", FileMode.Append);
> var timestamp = BitConverter.GetBytes(DateTime.Now.Ticks);
> var value = BitConverter.GetBytes(85.5);
> logFs.Write(timestamp);
> logFs.Write(value);

> // ====== 异步 FileStream ======
> using var asyncFs = new FileStream("large.bin", FileMode.Open, FileAccess.Read,
>     FileShare.Read, 4096, FileOptions.Asynchronous);
> byte[] asyncBuffer = new byte[4096];
> int read = await asyncFs.ReadAsync(asyncBuffer, 0, asyncBuffer.Length);
> Console.WriteLine($"异步读取 {read} 字节");
> ```

> [!scene] 适用场景
> ✅ 大文件处理、二进制数据、协议日志
> ✅ 需要随机访问

> [!pitfall] 常见踩坑
> 坑 1：**一次 `Read` 就当读全** → `Read` 返回的实际字节数可能小于 buffer 长度，直接把 buffer 当完整数据用会丢数据。循环读直到返回 0。
> 坑 2：**忘 Dispose 导致文件被锁** → 句柄不释放，别的进程删不掉、改不了。用 `using` 或 try-finally 保证释放。
> 坑 3：**`FileMode.Create` 误用覆盖数据** → 已有日志/结果被清空且不可恢复。追加用 `Append`，程序数据用 `Open` 先确认存在。
> 坑 4：**UI 线程同步读大文件** → 界面卡死数秒。用 `ReadAsync`/`WriteAsync`。

> [!best] 最佳实践
> - `using` 确保释放
> - 大文件用异步版 `ReadAsync`/`WriteAsync`
> - 用 `FileOptions.Asynchronous` 提升异步 IO 性能

> [!practice] 上手练习
> **Lv.1**：用 FileStream 读写二进制文件
> **Lv.2**：实现传感器数据二进制日志记录器

> [!related] 相关知识链接
> - ← File 类
> - → StreamReader/Writer
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.io.filestream
