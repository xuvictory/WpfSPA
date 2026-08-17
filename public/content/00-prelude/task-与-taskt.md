---
title: Task 类
section: 00-prelude
parent: 异步编程
---

# Task 类

> [!plain] 白话理解
> `Task` 是一个"事务单"——你交给系统一个任务（"去连这个设备"），拿到一张 Task 单据。你可以选择等（`await`）、可以同时做别的、可以查状态（`IsCompleted`）、可以取结果（`await task`）。上位机中最常见的 Task 模式：同时轮询 3 台 PLC——3 个 Task 并肩跑，`await Task.WhenAll` 等它们全部答复。

> [!def] 官方定义
> `System.Threading.Tasks.Task` 和 `Task<T>` 是 .NET 任务并行库（TPL）的核心类，表示一个异步操作。Task 代表无返回值的操作，`Task<T>` 代表返回 `T` 的操作。状态：`Running`/`Completed`/`Faulted`/`Canceled`。

> [!origin] 由来背景
> 在 .NET 4.0 之前，.NET 的多线程编程以 `Thread` 和 `ThreadPool.QueueUserWorkItem` 为主：手工 `new Thread` 创建开销大、数量不可控、生命周期难管理；`ThreadPool` 虽复用线程，却又拿不到结果、异常也无处安放。微软在 .NET 4.0 发布任务并行库（TPL），`Task` 由此诞生——它把"要执行的工作"抽象成可组合、可等待、可取消的对象，由线程池统一调度。上位机里"同时轮询 3 台 PLC"过去要自己写线程集合、自己处理锁，现在一个 `Task.WhenAll` 就搞定。

> [!essentials] 核心要点
> - 创建：`Task.Run(() => { })`、`new Task(...)`、`Task.FromResult(value)`
> - `task.Status`：状态
> - `task.Wait()`：同步阻塞等待（避免在 UI 线程用）
> - `Task.WhenAll`：等所有完成
> - `Task.WhenAny`：任意一个完成
> - `task.ContinueWith`：链式回调

> [!example] 完整示例
> ```csharp
> // ====== 创建和等待 ======
> Task<int> calculateTask = Task.Run(() =>
> {
>     Thread.Sleep(1000); // 模拟计算
>     return 42;
> });
> Console.WriteLine("任务已提交，做其他事...");
> int result = await calculateTask;  // 拿结果
> Console.WriteLine($"结果: {result}");

> // ====== 上位机实战：并行轮询 ======
> async Task<double> PollDeviceAsync(string id)
> {
>     await Task.Delay(new Random().Next(500, 1500)); // 模拟通信延迟
>     return 20 + new Random().NextDouble() * 40;
> }

> var tasks = new[] 
> {
>     PollDeviceAsync("PLC-001"),
>     PollDeviceAsync("PLC-002"),
>     PollDeviceAsync("PLC-003")
> };

> double[] results = await Task.WhenAll(tasks);
> for (int i = 0; i < results.Length; i++)
>     Console.WriteLine($"  PLC-00{i+1}: {results[i]:F1}℃");

> // ====== 异常处理 ======
> try
> {
>     var badTask = Task.Run(() => throw new Exception("设备离线"));
>     await badTask;
> }
> catch (Exception ex)
> {
>     Console.WriteLine($"捕获: {ex.Message}");
> }
> ```

> [!scene] 适用场景
> ✅ 所有异步操作（设备轮询、通信收发、文件读写）
> ✅ 多个独立任务并行执行（`Task.WhenAll`）
> ✅ 取最快响应/超时控制（`Task.WhenAny`）
> ❌ 大量 CPU 密集计算 → 用 `Task.Run` 交线程池执行
> ❌ 长时间阻塞的任务 → 单独线程，别占线程池

> [!pitfall] 常见踩坑
> 坑 1：**UI 线程调用 `task.Wait()` / `task.Result`** → 任务内部若又回到 UI 线程等待（未 `ConfigureAwait(false)`），形成经典死锁。UI 线程一律用 `await`。
> 坑 2：**任务抛异常却不 await** → 成为"未观察异常"静默丢失（只触发 `UnobservedTaskException`）。务必 `await`，或在任务内自行 try-catch。
> 坑 3：**`Task.Run` 包裹 IO 操作** → 无谓占用线程池线程，IO 应直接用 `XxxAsync` 原生异步方法。
> 坑 4：**把任务对象当"线程"反复重跑** → `Task` 只能执行一次，重跑需重新创建。

> [!best] 最佳实践
> - `Task.Run` 用于 CPU 密集型
> - IO 操作用 `XxxAsync` 方法
> - 多个独立任务用 `WhenAll`

> [!practice] 上手练习
> **Lv.1**：创建并等待 Task
> **Lv.2**：用 WhenAll 并行读取多设备
> **Lv.3**：带超时和异常处理的多设备轮询

> [!related] 相关知识链接
> - ← 同步vs异步
> - → async/await
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task
