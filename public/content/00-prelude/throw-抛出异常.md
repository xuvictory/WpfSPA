---
title: throw 抛出异常
section: 00-prelude
parent: 异常处理
---

# throw 抛出异常

> [!plain] 白话理解
> `throw` 就是代码里的"警报按钮"——检测到不能继续执行的状态时，拍下去，把问题抛给上层处理。比如构造函数里发现传入的设备 IP 是空的——不能假装没事继续创建对象，必须 `throw new ArgumentException("IP不能为空")`。上位机中最常见的 throw 场景：校验失败（端口号超范围）、前置条件不满足（还没连接就发命令）、协议解析异常（收到非法帧）。

> [!def] 官方定义
> `throw` 语句用于手动引发异常，终止当前方法的执行并将异常沿调用堆栈向上传播。`throw` 可以抛出 `System.Exception` 或其任何派生类的实例。

> [!origin] 由来背景
> 异常抛出机制让故障和正常逻辑各行其道——不污染返回值语义。C# 团队设计 `throw` 时考虑了一点：在 `catch` 块中 `throw;` 保留原始堆栈，`throw ex;` 重置堆栈。

> [!essentials] 核心要点
> - `throw new ExceptionType("message");`
> - `throw;`：在 catch 块中重抛，保持原始堆栈
> - 常见内置异常：
>   - `ArgumentException` / `ArgumentNullException`：参数无效
>   - `InvalidOperationException`：对象状态不适合当前操作
>   - `NotSupportedException`：方法不被支持
>   - `NotImplementedException`：暂未实现（TODO）
> - 可以创建自定义异常类

> [!example] 完整示例
> ```csharp
> public class DeviceController
> {
>     private bool _isConnected;
    
>     public void SendCommand(byte[] command)
>     {
>         // 前置条件校验
>         if (command == null || command.Length == 0)
>             throw new ArgumentException("命令不能为空", nameof(command));
        
>         if (!_isConnected)
>             throw new InvalidOperationException("设备未连接，无法发送命令");
        
>         if (command.Length > 256)
>             throw new ArgumentOutOfRangeException(nameof(command), "命令长度不能超过256字节");
        
>         Console.WriteLine($"发送 {command.Length} 字节");
>     }
> }

> var controller = new DeviceController();
> try
> {
>     controller.SendCommand(new byte[300]); // 太长了！
> }
> catch (ArgumentOutOfRangeException ex)
> {
>     Console.WriteLine($"参数错误: {ex.ParamName} - {ex.Message}");
> }
> ```

> [!scene] 适用场景
> ✅ 构造函数参数校验
> ✅ 前置条件检查（Guard Clauses）
> ✅ 不支持的操作
> ❌ 可预期的业务流程控制

> [!pitfall] 常见踩坑
> 坑 1：**`throw ex;` 重置堆栈** → catch 块里 `throw ex;` 会把异常堆栈起点改成 catch 所在行，原始抛出处丢失，故障排查无从下手。一律用 `throw;` 保留原始堆栈。
> 坑 2：**抛出笼统的 `new Exception(...)`** → 上层只能 catch 到 Exception 再解析字符串，无法按类型精确处理。抛具体异常（`ArgumentOutOfRangeException`、`InvalidOperationException` 或自定义异常）。
> 坑 3：**把 throw 当流程控制** → 用异常模拟 if-else（如"读到 -1 就抛异常"）既慢又难读，还会干扰调试器。可预期的业务分支用返回值、枚举或结果对象。

> [!best] 最佳实践
> - 抛具体异常，不是 `Exception`
> - 异常消息包含关键上下文信息
> - 使用 `nameof(param)` 不是硬编码

> [!practice] 上手练习
> **Lv.1**：在方法里校验参数并在不合法时 throw
> **Lv.2**：为通信类添加多层校验throw
> **Lv.3**：设计一个上位机方法的前置条件体系

> [!related] 相关知识链接
> - ← try-catch-finally
> - → 自定义异常
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/throw
