---
title: Task.Delay 与计时
section: 00-prelude
parent: 异步编程
---

# Task.Delay 与计时

> [!plain] 白话理解
> `Task.Delay` 是"异步版的睡觉"——`Thread.Sleep(1000)` 会把线程卡住 1 秒什么都干不了，而 `await Task.Delay(1000)` 是把当前线程释放出去干别的，1 秒后再从断点处继续。在上位机中，`Task.Delay` 是定时轮询的命脉：每隔 1 秒去读一次传感器——不卡 UI、不占线程池——优雅到极致。

> [!def] 官方定义
> `Task.Delay(int millisecondsDelay)` 创建一个在指定毫秒后完成的 `Task`。它不会阻塞调用线程，内部使用定时器（`System.Threading.Timer`）实现。重载支持 `CancellationToken`（可中途取消等待）和 `TimeSpan`。

> [!origin] 由来背景
> 早期 C# 程序想"等一会儿"只有两条路：`Thread.Sleep` 阻塞当前线程（WPF 里一睡 UI 就冻结），或 `System.Threading.Timer` 定时回调（却没法表达"等 N 毫秒后继续往下走"的线性流程）。.NET 4.5 随 async/await 带来的 `Task.Delay` 完美补位：内部用系统定时器实现，await 期间不占任何线程，让"异步流程中的等待"终于能写成一行。上位机里轮询、重试、超时三种最常见的时序需求，都建立在 `Task.Delay` 之上。

> [!essentials] 核心要点
> - `await Task.Delay(1000)`：异步等 1 秒
> - `Task.Delay(0)` ≈ `Task.CompletedTask`（不实际等待）
> - 支持 `CancellationToken`：`await Task.Delay(10000, cts.Token)` 可中途取消
> - `Task.Delay(-1)` 创建永不完成的 Task（无限等待）

> [!example] 完整示例
> ```csharp
> // ====== Task.Delay vs Thread.Sleep ======
> // ❌ Thread.Sleep 卡死线程，UI 冻结
> // Thread.Sleep(2000);

> // ✅ Task.Delay 让出线程，2秒后继续
> Console.WriteLine("开始等待...");
> await Task.Delay(2000);
> Console.WriteLine("2秒后继续，UI没卡！");

> // ====== 上位机实战：重试间隔（指数退避） ======
> for (int attempt = 1; attempt <= 3; attempt++)
> {
>     try
>     {
>         Console.WriteLine($"第{attempt}次尝试连接设备...");
>         // ... 通信代码
>         await Task.Delay(attempt * 1000); // 第1次等1秒，第2次等2秒...
>     }
>     catch (Exception ex)
>     {
>         Console.WriteLine($"失败: {ex.Message}");
>     }
> }

> // ====== 上位机实战：定时轮询 ======
> var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
> try
> {
>     while (!cts.Token.IsCancellationRequested)
>     {
>         double temp = ReadTemperature();
>         Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] 温度: {temp:F1}℃");
>         await Task.Delay(1000, cts.Token);  // 每秒采样，支持取消
>     }
> }
> catch (OperationCanceledException)
> {
>     Console.WriteLine("轮询已停止");
> }

> // ====== 超时实现 ======
> async Task<double> ReadWithTimeout(CancellationToken ct)
> {
>     await Task.Delay(5000, ct);  // 5秒超时
>     throw new TimeoutException("读取超时");
> }

> static double ReadTemperature() => 20 + Random.Shared.NextDouble() * 40;
> ```

> [!scene] 适用场景
> ✅ 轮询间隔（定时读取传感器、定时刷新状态）
> ✅ 重试等待（连接失败后的退避延迟）
> ✅ 超时控制（`Task.WhenAny` + `Task.Delay`）
> ✅ 定时器替代方案（简单场景不需要 `System.Timers.Timer`）
> ❌ 需要精确毫秒级精度 → 用 `Stopwatch` 而非 `Task.Delay`

> [!pitfall] 常见踩坑
> 坑 1：**`Task.Delay(0)`** → 不真的等，相当于 `Task.CompletedTask`
> 坑 2：**不 await 的 Task.Delay** → `Task.Delay(1000);`（少了 await）不会等！
> 坑 3：**在同步方法中 .Wait() Task.Delay** → 死等但没有实际延迟效果
> 坑 4：**忘了 CancellationToken** → 程序关闭时轮询循环停不下来

> [!best] 最佳实践
> - 重试等待用 `Task.Delay(attempt * 1000)` 做指数退避
> - 轮询循环中必须带 CancellationToken
> - 上位机定时轮询模板：`while (!cancelled) { DoPoll(); await Task.Delay(interval, ct); }`
> - 长时间等待 + 可取消场景务必传 CancellationToken

> [!practice] 上手练习
> **Lv.1**：对比 Thread.Sleep vs Task.Delay 的行为差异
> **Lv.2**：实现带 CancellationToken 的定时轮询循环
> **Lv.3**：实现带指数退避的设备自动重连循环

> [!related] 相关知识链接
> - ← Task 类、async/await、Task.Run
> - → CancellationToken、WhenAny（超时模式）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.delay
