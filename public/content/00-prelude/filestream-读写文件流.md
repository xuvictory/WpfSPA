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
