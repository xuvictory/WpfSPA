---
title: CancellationToken 取消令牌
section: 00-prelude
parent: 异步编程
---

# CancellationToken 取消令牌

> [!plain] 白话理解
> `CancellationToken` 是一个"中止信号"。你开启了一个长时间读取设备数据的异步操作，突然用户点了"停止"按钮——怎么让正在跑的读取停下来？你不能把线程杀了（危险），你需要给那个异步操作发一个"取消信号"。`CancellationTokenSource` 就是信号发射器，`CancellationToken` 是接收器——接收方定期检查 `IsCancellationRequested`，一旦为 true 就优雅退出。

> [!def] 官方定义
> - `CancellationTokenSource`：创建和管理取消信号的源，调用 `Cancel()` 发出取消请求
> - `CancellationToken`：轻量级值类型，传递给可取消操作，检查 `IsCancellationRequested`
> - `token.ThrowIfCancellationRequested()`：如果已取消就抛 `OperationCanceledException`
> - 可绑定超时：`new CancellationTokenSource(TimeSpan.FromSeconds(5))`

> [!example] 完整示例
> ```csharp
> // ====== 基本模式 ======
> using var cts = new CancellationTokenSource();

> // 5秒后自动取消
> cts.CancelAfter(TimeSpan.FromSeconds(5));

> try
> {
>     await LongRunningOperationAsync(cts.Token);
> }
> catch (OperationCanceledException)
> {
>     Console.WriteLine("操作已被取消");
> }

> async Task LongRunningOperationAsync(CancellationToken token)
> {
>     for (int i = 0; i < 10; i++)
>     {
>         token.ThrowIfCancellationRequested();  // 检查并抛异常
>         Console.WriteLine($"进度 {i + 1}/10");
>         await Task.Delay(1000, token);  // 支持取消的延迟
>     }
> }

> // ====== 上位机实战：可取消的设备轮询 ======
> public class DevicePoller
> {
>     private CancellationTokenSource? _cts;
    
>     public async Task StartPolling(List<string> devices)
>     {
>         _cts = new CancellationTokenSource();
>         try
>         {
>             while (!_cts.Token.IsCancellationRequested)
>             {
>                 foreach (var device in devices)
>                 {
>                     Console.WriteLine($"轮询 {device}...");
>                     _cts.Token.ThrowIfCancellationRequested();
>                 }
>                 await Task.Delay(1000, _cts.Token);
>             }
>         }
>         catch (OperationCanceledException)
>         {
>             Console.WriteLine("轮询已停止");
>         }
>     }
    
>     public void Stop() => _cts?.Cancel();
> }
> ```

> [!scene] 适用场景
> ✅ 长时间操作的中止
> ✅ 超时控制
> ✅ 用户点了停止/取消按钮

> [!best] 最佳实践
> - CancellationToken 贯穿所有异步方法
> - `CancellationToken.None` 表示不可取消的操作
> - 搭配 `using var cts = new CancellationTokenSource(timeout);` 自动超时

> [!practice] 上手练习
> **Lv.1**：实现可取消的异步循环
> **Lv.2**：设备轮询器——点击停止时优雅退出

> [!related] 相关知识链接
> - ← Task、async/await
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.cancellationtoken
