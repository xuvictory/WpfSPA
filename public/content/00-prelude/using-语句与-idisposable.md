---
title: using 与 IDisposable
section: 00-prelude
parent: 异常处理
---

# using 与 IDisposable

> [!plain] 白话理解
> `IDisposable` 接口和 `using` 语句是 C# 里最优雅的"借-用-还"机制。文件打开了就该关闭、串口连上了就该断开——这些"用完要还"的资源，只要实现了 `IDisposable`，就能用 `using` 包裹：出了 `using` 块的大括号，不管有没有异常，`Dispose()` 一定自动被调用。上位机中管理串口、TCP 连接、文件句柄——离开 `using` 就是灾难。

> [!def] 官方定义
> `IDisposable` 接口声明 `void Dispose()` 方法，用于释放非托管资源（文件句柄、网络连接、数据库连接等）。`using` 语句确保 `Dispose()` 在作用域结束时被调用（即使用 `try-finally` 的语法糖）。C# 8.0 引入 `using var` 声明（`await using` 异步版）。

> [!origin] 由来背景
> C# 早期管理文件、网络等非托管资源全靠手动：用完必须记得 `Close()`/`Dispose()`，一旦中间抛异常，资源就泄漏——句柄耗尽后程序表现怪异且难以排查。`using` 语句（C# 1.0）把它变成编译器的 try-finally 语法糖：无论正常退出还是异常跳出，`Dispose()` 必然执行；C# 8.0 又加了 `using var`，让资源生命周期跟随作用域自动结束。上位机里串口、TCP、文件、数据库连接全是"借-用-还"型资源，`using` 是最可靠的归还方式。

> [!essentials] 核心要点
> - 只有实现 `IDisposable` 的类型才能进 `using`，否则编译报错
> - `using (var r = ...) { }`：离开块即 `Dispose()`，块内抛异常也不跳过
> - `using var r = ...;`（C# 8）：从声明处到当前作用域结束自动 `Dispose`
> - `await using`（C# 8）：配合 `IAsyncDisposable`，异步释放（如异步文件流）
> - 自己写的类持有非托管资源时：实现 `IDisposable`，可选析构函数兜底 + `GC.SuppressFinalize(this)`
> - `Dispose()` 必须幂等：被调用多次不抛异常、不重复释放

> [!example] 完整示例
> ```csharp
> // ====== 实现 IDisposable ======
> public class SerialPortWrapper : IDisposable
> {
>     private bool _disposed;
    
>     public void Open(string portName) => Console.WriteLine($"打开 {portName}");
    
>     public string ReadLine() => "TEMP:85.5";
    
>     public void Dispose()
>     {
>         if (_disposed) return;
>         Console.WriteLine("关闭串口，释放资源");
>         _disposed = true;
>         GC.SuppressFinalize(this);  // 不需要析构了
>     }
> }

> // ====== using 语句 ======
> using (var port = new SerialPortWrapper())
> {
>     port.Open("COM3");
>     string data = port.ReadLine();
>     Console.WriteLine($"收到: {data}");
> } // ← Dispose() 在这里自动调用

> // ====== using var 声明（C# 8） ======
> using var port2 = new SerialPortWrapper();
> port2.Open("COM4");
> // 方法结束时自动 Dispose

> // ====== 上位机中管理多个资源 ======
> using (var file = File.CreateText("log.txt"))
> {
>     file.WriteLine("设备启动");
>     // file 自动关闭
> }
> ```

> [!scene] 适用场景
> ✅ 串口/TCP/Socket 连接（用完必须断开）
> ✅ 文件读写、数据库连接（连接数有限，必须归还）
> ✅ 任何实现 `IDisposable` 的第三方资源
> ❌ 纯托管内存对象（如 `List<T>`）——GC 会回收，不需要 using
> ❌ 需要在多个方法间长期持有的连接 → 应放类字段，由类实现 `IDisposable` 统一释放

> [!pitfall] 常见踩坑
> 坑 1：**忘了 Dispose** → 串口/Socket 未释放，端口泄露，设备连接一多程序就"卡死"。连接一律用 `using` 或 try-finally 保证释放。
> 坑 2：**`Dispose` 没有幂等** → 重复释放时二次 `Close()` 抛 `ObjectDisposedException`。实现 `Dispose` 加 `_disposed` 标志，二次调用直接 return。
> 坑 3：**持非托管资源却只写终结器** → 句柄要等 GC 才释放，长时间占用。终结器只是兜底，应在不再使用时主动 `Dispose()`。
> 坑 4：**using 块里 return** → 这不是坑！`Dispose()` 会在 return 之后、方法真正返回之前执行——但别依赖它做业务逻辑，它只负责释放资源。

> [!best] 最佳实践
> - 只要类持有非托管资源就实现 `IDisposable`
> - 优先用 `using var`（C# 8+），作用域即资源生命周期
> - Dispose 模式：`protected virtual void Dispose(bool disposing)`

> [!practice] 上手练习
> **Lv.1**：创建实现 `IDisposable` 的类，用 using 包裹
> **Lv.2**：模拟串口类实现完整的 Dispose 模式
> **Lv.3**：管理多个可释放资源，用嵌套 using 或 using var

> [!related] 相关知识链接
> - ← finally（using 是它的语法糖）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/garbage-collection/implementing-dispose
