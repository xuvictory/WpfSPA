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

> [!pitfall] 常见踩坑
> 坑 1：**忘了 Dispose** → 串口/Socket 未释放，端口泄露。
> 坑 2：**using 里 return** → 没问题！`Dispose()` 在 return 之后、方法真正返回之前执行。

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
