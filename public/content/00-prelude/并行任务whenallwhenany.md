---
title: WhenAll 与 WhenAny
section: 00-prelude
parent: 异步编程
---

# WhenAll 与 WhenAny

> [!plain] 白话理解
> `Task.WhenAll` 是"等所有人都干完"——你给 PLC-001、PLC-002、PLC-003 各发一条查询，然后等它们**全部**回复。`Task.WhenAny` 是"等最快的那个人"——你给三个备用的温度传感器发查询，谁先回就用谁的数据。这两个方法是并行异步操作的指挥官，让你从"串行等 3 秒"变成"并行等 1 秒"。

> [!def] 官方定义
> - `Task.WhenAll(IEnumerable<Task>)`：等所有 Task 完成后返回（任意一个失败则抛 AggregateException）
> - `Task.WhenAny(IEnumerable<Task>)`：返回最先完成的 Task（其他继续执行）
> - 都返回 `Task`/`Task<Task<T>>`，不会抛异常到调用方

> [!origin] 由来背景
> 在 TPL 之前，上位机要并行读取多台设备，只能手动开线程：一个设备一个 `Thread`，再用 `Join()` 或轮询 `IsAlive` 等待全部结束，代码里全是线程集合和标志位，异常还容易漏。TPL 把"等待多个任务"抽象成 `WhenAll`/`WhenAny` 两个静态方法：`WhenAll` 返回一个在所有子任务完成后才完成的新任务，`WhenAny` 返回一个在任意子任务完成时就完成的新任务。从此"并行等 3 台 PLC 回复"变成一行代码，超时控制也顺手解决了。

> [!essentials] 核心要点
> - `Task.WhenAll(params Task[] tasks)`：返回的新 Task 在所有子任务都完成后才完成
> - `Task.WhenAll<T>(IEnumerable<Task<T>>)`：返回 `Task<T[]>`，结果**按输入顺序**排列（不是完成顺序）
> - `WhenAll` 任一子任务抛异常 → 结果 Task 为 Faulted，await 时抛 `AggregateException`（可遍历 `InnerExceptions`）
> - `Task.WhenAny` 返回 `Task<Task<T>>`——先完成的那个子任务就是结果；其余子任务继续执行不会被打断
> - 经典超时模式：`var winner = await Task.WhenAny(realTask, Task.Delay(2000));` 判断谁先完成
> - 两者都是**非阻塞组合器**：调用本身不阻塞线程，只是构造新 Task

> [!example] 完整示例
> ```csharp
> // ====== WhenAll：并行等全部 ======
> async Task<double> ReadTemp(string id, int delay)
> {
>     await Task.Delay(delay);
>     return 20 + delay / 100.0;
> }

> var watch = System.Diagnostics.Stopwatch.StartNew();

> var results = await Task.WhenAll(
>     ReadTemp("PLC-001", 1000),
>     ReadTemp("PLC-002", 1200),
>     ReadTemp("PLC-003", 800)
> );

> watch.Stop();
> Console.WriteLine($"全部完成，耗时 {watch.ElapsedMilliseconds}ms");  // ~1200ms
> foreach (int i in new[] { 0, 1, 2 })
>     Console.WriteLine($"  PLC-00{i+1}: {results[i]:F1}℃");

> // ====== WhenAny：谁先到用谁 ======
> async Task<string> TryConnect(string ip, int delay)
> {
>     await Task.Delay(delay);
>     return $"{ip} 已连接";
> }

> var firstResponse = await Task.WhenAny(
>     TryConnect("192.168.1.100", 2000),
>     TryConnect("192.168.1.101", 1000),  // 这个是赢家
>     TryConnect("192.168.1.102", 3000)
> );

> Console.WriteLine($"\n最快响应: {await firstResponse}");

> // ====== WhenAny + 超时 ======
> var dataTask = ReadTemp("PLC-001", 5000);
> var timeoutTask = Task.Delay(2000);

> var completed = await Task.WhenAny(dataTask, timeoutTask);
> if (completed == timeoutTask)
>     Console.WriteLine("读取超时！");
> else
>     Console.WriteLine($"数据: {await dataTask:F1}℃");
> ```

> [!scene] 适用场景
> ✅ `WhenAll`：并行读取多个设备
> ✅ `WhenAny`：冗余传感器取最快、超时控制

> [!pitfall] 常见踩坑
> 坑 1：**把 `await` 误写在 WhenAll 参数里** → `Task.WhenAll(await A(), await B())` 变成串行等待，并行全废。先收集任务再统一 WhenAll。
> 坑 2：**WhenAll 中一个任务失败就"崩"** → await 时抛 `AggregateException`，其余任务的结果与异常被掩盖。对每个子任务单独 try-catch，或事后遍历 `task.Exception` 收集全部故障。
> 坑 3：**WhenAny 赢家是失败/取消的任务** → 先完成的可能是个 Faulted 任务。必须 `await winner` 或在分支里检查 `IsCompletedSuccessfully`。
> 坑 4：**WhenAny 输家仍在后台跑** → 剩余任务继续执行可能抛未观察异常或泄漏资源。搭配 CancellationToken 及时取消输家。

> [!best] 最佳实践
> - 并行读取多台设备用 `WhenAll`，让采样尽量贴近同一时刻
> - 冗余传感器（双温度计、双电源检测）用 `WhenAny` 取最快响应
> - 超时控制固定模板：`var winner = await Task.WhenAny(task, Task.Delay(timeout));`
> - 结合 CancellationToken：WhenAny 分出胜负后立即取消输家，避免后台空转
> - 设备数量大时限制并发（`SemaphoreSlim` 分批），避免线程池瞬间过载

> [!practice] 上手练习
> **Lv.1**：用 WhenAll 并行执行 3 个 Task
> **Lv.2**：用 WhenAny 实现冗余传感器+超时控制
> **Lv.3**：上位机多设备并行轮询框架

> [!related] 相关知识链接
> - ← Task
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.whenall
