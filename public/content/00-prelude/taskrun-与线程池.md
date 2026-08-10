---
title: Task.Run 与线程池
section: 00-prelude
parent: 异步编程
---

# Task.Run 与线程池

> [!plain] 白话理解
> `Task.Run` 是"把重活丢给后台工人去干"——CPU 密集型计算（如大量数据校验、图像处理、加密编码），丢给线程池别卡住 UI。你的 WPF 窗口主线程只负责"接待用户"（渲染界面、响应点击），凡是需要大量计算的活，统统 `Task.Run` 交给线程池里的工人线程去干。干完了把结果通过 `await` 优雅地拿回来更新 UI。

> [!def] 官方定义
> `Task.Run(Action)` 将任务排入线程池（ThreadPool），在线程池线程上异步执行。返回 `Task` 或 `Task<TResult>`，可被 await。适用于将 CPU 密集型工作移出 UI 线程，避免界面卡顿。内部使用 `TaskScheduler.Default`。

> [!essentials] 核心要点
> - `Task.Run(() => DoWork())` 跑在线程池线程
> - 返回 `Task<T>`，用 `await` 取结果回到 UI 线程
> - 不适合 IO 操作（直接用 `XxxAsync` 方法，别包裹在 `Task.Run` 里）
> - 线程池线程不适合长时间阻塞的操作

> [!example] 完整示例
> ```csharp
> // ====== 基本用法：CPU密集操作后台执行 ======
> var data = new double[1_000_000];
> var rnd = new Random();
> for (int i = 0; i < data.Length; i++) data[i] = rnd.NextDouble() * 100;

> double result = await Task.Run(() =>
> {
>     // 大量计算放在线程池中，不卡 UI
>     return data.Where(v => v > 50).Average();
> });
> Console.WriteLine($"后台计算结果: {result:F2}");

> // ====== 上位机实战：Task.Run 处理大量传感器数据 ======
> var rawSamples = new ushort[10000];
> for (int i = 0; i < rawSamples.Length; i++) rawSamples[i] = (ushort)i;

> var engineeringValues = await Task.Run(() =>
>     rawSamples.Select(r => r * 5.0 / 1023.0  // AD值转工程值
> ).ToArray());

> Console.WriteLine($"转换了 {engineeringValues.Length} 个工程值");

> // ====== 多个计算并行 ======
> var task1 = Task.Run(() => ComputeChecksum(data));
> var task2 = Task.Run(() => ComputeAverage(data));
> await Task.WhenAll(task1, task2);
> Console.WriteLine($"校验和: {await task1}, 均值: {await task2:F2}");

> static int ComputeChecksum(double[] d) => (int)d.Sum() % 65536;
> static double ComputeAverage(double[] d) => d.Average();
> ```

> [!scene] 适用场景
> ✅ CPU 密集型操作（加密/编码/数据校验/大量计算/图像处理）
> ✅ 需要将耗时计算从 UI 线程移走
> ❌ 包裹 IO 操作 → 直接用 async IO 方法（`ReadAsync`、`ConnectAsync` 等）
> ❌ 长时间阻塞线程池线程 → 用专用线程

> [!pitfall] 常见踩坑
> 坑 1：**`Task.Run` 包裹 async IO** → 浪费线程池资源，IO 操作本身就用 IO 完成端口
> 坑 2：**不 await Task.Run** → 拿不到结果，异常也会丢失
> 坑 3：**在 ASP.NET 中滥用 Task.Run** → 抢线程池线程反而降低吞吐量

> [!best] 最佳实践
> - `Task.Run` 用于 CPU、`XxxAsync` 用于 IO
> - 始终 `await` Task.Run 的返回值
> - 上位机：传感器数据批量转换、Modbus 帧 CRC 校验、数据加密解密

> [!practice] 上手练习
> **Lv.1**：用 Task.Run 执行一个 1 亿次的累加计算
> **Lv.2**：在 WPF 按钮中用 Task.Run + await 处理大量数据并更新 UI
> **Lv.3**：实现多线程并行处理多设备数据的框架

> [!related] 相关知识链接
> - ← Task 类、async/await
> - → Task.Delay、CancellationToken
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.tasks.task.run
