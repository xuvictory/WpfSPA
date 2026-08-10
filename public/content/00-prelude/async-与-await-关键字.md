---
title: async/await 完整用法
section: 00-prelude
parent: 异步编程
---

# async/await 完整用法

> [!plain] 白话理解
> `async` 和 `await` 是 C# 的"黑魔法"——它们让你用写同步代码的方式写异步代码。`async` 声明方法"我里面有 await"；`await` 说"我等这个 Task 弄完，但我不卡线程"。关键是：在 `await` 等待的时候，当前线程会回到调用方继续干活（比如 WPF 的 UI 线程继续响应用户点击），等 Task 完成了再从断点处往下执行。上位机中 UI 线程永不卡顿的秘密就在这两个关键字。

> [!def] 官方定义
> - `async` 修饰符标记方法为异步方法（方法内可使用 `await`）
> - `await` 异步等待一个 `Task` 或 `Task<T>` 完成，不阻塞线程
> - 编译器将 `async` 方法转换为状态机
> - `async void` 仅用于事件处理器，其他一律 `async Task`/`async Task<T>`

> [!example] 完整示例
> ```csharp
> // ====== async/await 基本模式 ======
> async Task<string> FetchDeviceDataAsync(string deviceId)
> {
>     Console.WriteLine($"[{deviceId}] 开始连接...");
>     await Task.Delay(1000);  // 模拟异步操作
>     Console.WriteLine($"[{deviceId}] 连接成功");
    
>     // 嵌套 await
>     double temp = await ReadTemperatureAsync(deviceId);
>     return $"{deviceId}: {temp:F1}℃";
> }

> async Task<double> ReadTemperatureAsync(string id)
> {
>     await Task.Delay(500);
>     return 85.5;
> }

> // ====== WPF 事件处理器（唯一允许 async void 的地方）========
> // private async void Button_Click(object sender, RoutedEventArgs e)
> // {
> //     StatusText.Text = "连接中...";
> //     var data = await FetchDeviceDataAsync("PLC-001");
> //     StatusText.Text = data;  // UI 线程安全更新
> // }

> // ====== 上位机实战：带超时的异步通信 ======
> async Task<byte[]> SendWithTimeout(string ip, byte[] cmd, int timeoutMs)
> {
>     using var cts = new CancellationTokenSource(timeoutMs);
>     try
>     {
>         var sendTask = SendCommandAsync(ip, cmd, cts.Token);
>         return await sendTask;  // 超时自动取消
>     }
>     catch (OperationCanceledException)
>     {
>         Console.WriteLine($"通信超时 ({timeoutMs}ms)");
>         return Array.Empty<byte>();
>     }
> }

> async Task<byte[]> SendCommandAsync(string ip, byte[] cmd, CancellationToken ct)
> {
>     await Task.Delay(800, ct);  // 模拟通信，支持取消
>     return new byte[] { 0x01, 0x03, 0x08, 0xFF };
> }

> var response = await SendWithTimeout("192.168.1.100", new byte[] { 0x01, 0x03 }, 500);
> Console.WriteLine($"收到 {response.Length} 字节");
> ```

> [!scene] 适用场景
> ✅ WPF 所有按钮点击/定时器
> ✅ 串口/TCP 通信
> ✅ 文件读写

> [!pitfall] 常见踩坑
> 坑 1：**`async void`** — 无法 await、异常无法捕获，仅用于事件处理器
> 坑 2：**`.Result`/`.Wait()` 在 UI 线程** — 死锁！
> 坑 3：**不等待就 Dispose** — task 还在跑但资源被释放

> [!best] 最佳实践
> - `async Task` 贯穿调用链（从底层到 UI 事件处理器）
> - 用 `ConfigureAwait(false)` 在库代码中
> - 超时操作用 CancellationToken + `WithCancellation`

> [!practice] 上手练习
> **Lv.1**：创建 async 方法并 await
> **Lv.2**：async/await 实现上位机异步通信
> **Lv.3**：带超时、取消、重试的完整异步通信框架

> [!related] 相关知识链接
> - ← Task、同步vs异步
> - → ConfigureAwait、CancellationToken
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/asynchronous-programming/
