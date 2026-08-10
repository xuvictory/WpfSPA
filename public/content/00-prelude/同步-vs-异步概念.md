---
title: 同步 vs 异步 概念辨析
section: 00-prelude
parent: 异步编程
---

# 同步 vs 异步 概念辨析

> [!plain] 白话理解
> **同步**是你打电话——拨号、等待、通话、挂断，整个过程你被绑在电话旁什么都干不了。**异步**是你发微信——消息发出后你可以继续干别的事，对方回复了你会收到通知。上位机中，同步通信意味着发一条 Modbus 命令后**死等**回复（UI 卡死），异步意味着发完命令后**立刻返回**，回复到了再处理（UI 丝般顺滑）。

> [!def] 官方定义
> - **同步**（Synchronous）：调用方发起操作后阻塞等待操作完成，然后继续执行。
> - **异步**（Asynchronous）：调用方发起操作后立即返回，操作在后台完成，完成后通过回调/Task/事件通知调用方。

> [!origin] 由来背景
> 异步编程在 .NET 早期就有（`BeginInvoke`/`EndInvoke`/`IAsyncResult`），但写起来极其痛苦。C# 5.0（2012年）引入 `async`/`await`，把异步代码写得像同步一样流畅——这是 C# 历史上最受欢迎的特性，没有之一。上位机中，通信等待（TCP/串口）、UI 更新、文件读写——异步无处不在。

> [!essentials] 核心要点
> - 同步 = 阻塞当前线程，异步 = 不阻塞
> - `async`/`await` 是写异步代码的语法糖
> - 异步不创建新线程（被 await 的 Task 通常在 IO 完成端口等待）
> - UI 线程绝不能阻塞（会卡界面）

> [!example] 完整示例
> ```csharp
> // 同步写法：卡住当前线程
> byte[] SyncSendCommand(string ip, byte[] cmd)
> {
>     using var client = new TcpClient();
>     client.Connect(ip, 502);             // 阻塞！等连接成功
>     var stream = client.GetStream();
>     stream.Write(cmd, 0, cmd.Length);
>     var buffer = new byte[256];
>     int read = stream.Read(buffer, 0, 256); // 阻塞！等数据回来
>     return buffer[..read];
> }

> // 异步写法：不卡线程
> async Task<byte[]> AsyncSendCommand(string ip, byte[] cmd)
> {
>     using var client = new TcpClient();
>     await client.ConnectAsync(ip, 502);  // 不阻塞，后台等
>     var stream = client.GetStream();
>     await stream.WriteAsync(cmd);
>     var buffer = new byte[256];
>     int read = await stream.ReadAsync(buffer);
>     return buffer[..read];
> }
> ```

> [!scene] 适用场景
> ✅ IO 密集型操作（网络、文件、数据库）
> ✅ UI 应用中的所有耗时操作
> ❌ CPU 密集型计算 → `Task.Run` 放后台线程

> [!pitfall] 常见踩坑
> 坑 1：**`async void`** → 只在事件处理器用，别的地方永远 `async Task`。
> 坑 2：**死锁** → 在 UI 线程 `.Result`/`.Wait()` 会导致死锁

> [!best] 最佳实践
> - `async Task` 贯穿调用链
> - UI 线程不用 `.Result`/`.Wait()`
> - 上位机所有通信都用 `Async` 后缀方法

> [!practice] 上手练习
> **Lv.1**：对比同步和异步 Thread.Sleep vs Task.Delay
> **Lv.2**：异步版串口通信模拟
> **Lv.3**：上位机异步轮询框架

> [!related] 相关知识链接
> - → Task、async/await
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/asynchronous-programming/
