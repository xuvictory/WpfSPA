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

> [!origin] 由来背景
> 早期多线程程序取消一个运行中的操作非常粗暴：要么用 `Thread.Abort()` 强行终止线程（.NET Core 中已移除，破坏性太强），要么用共享 `bool isCancelled` 标志位——但标志位要自己加锁或 `volatile`，被取消方与请求方还耦合在一起。.NET 4.0 引入 TPL 时带来了 `CancellationTokenSource`/`CancellationToken` 这对**协作式取消**模型：取消不是"杀死"线程，而是"礼貌地通知"——接收方定期检查信号、清理资源、自己退场。上位机里这正好对应"用户点了停止按钮，设备轮询线程优雅收尾"的场景。

> [!essentials] 核心要点
> - 发起方持有 `CancellationTokenSource`，接收方只拿只读的 `CancellationToken`（值类型，可安全传递，线程安全）
> - 两种检查姿势：`token.IsCancellationRequested` 轮询，或 `token.ThrowIfCancellationRequested()` 抛异常中断
> - 注册取消回调：`token.Register(() => Console.WriteLine("已取消"))`，在取消发生时执行清理
> - 超时取消：`new CancellationTokenSource(TimeSpan.FromSeconds(5))` 或 `cts.CancelAfter(5000)`，到点自动 Cancel
> - 支持取消的异步 API 必须传 token：`Task.Delay(1000, token)`、`File.ReadAllBytesAsync(path, token)`
> - 不取消就传 `CancellationToken.None`（默认值），语义上表示"不可取消"

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

> [!pitfall] 常见踩坑
> 坑 1：**取消后不释放 `CancellationTokenSource`** → 内部定时器/回调引用无法被 GC 回收。用 `using var cts` 或手动 `cts.Dispose()`。
> 坑 2：**只在个别循环点检查取消** → 如果被取消方长时间卡在一个同步阻塞调用里（如 `Thread.Sleep`、`ReadLine`），取消信号永远轮不到。同步阻塞点要么换成支持取消的异步 API，要么改用超时 `CancelAfter` 兜底。
> 坑 3：**取消后直接 return 不抛 `OperationCanceledException`** → 调用方 `await` 无法感知"已取消"，把取消当成正常完成。协同式取消的标准姿势是 `ThrowIfCancellationRequested()`。
> 坑 4：**`Register` 回调里抛异常** → 取消时会连带抛异常干扰流程，回调内部要自己 try-catch。

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
