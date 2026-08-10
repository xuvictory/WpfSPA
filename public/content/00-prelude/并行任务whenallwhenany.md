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

> [!practice] 上手练习
> **Lv.1**：用 WhenAll 并行执行 3 个 Task
> **Lv.2**：用 WhenAny 实现冗余传感器+超时控制
> **Lv.3**：上位机多设备并行轮询框架

> [!related] 相关知识链接
> - ← Task
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.whenall
