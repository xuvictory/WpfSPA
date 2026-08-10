---
title: try-catch-finally
section: 00-prelude
parent: 异常处理
---

# try-catch-finally

> [!plain] 白话理解
> `try-catch` 就是给代码穿上救生衣——你把可能出错的代码放进 `try` 块，如果它炸了（抛异常），`catch` 接住它，程序不会直接崩。`finally` 更绝——不管有没有出异常，它一定会执行。就像"试着打开设备连接（try），如果失败了就记录日志（catch），无论如何都要关闭串口（finally）"。上位机中，`try-catch` 必须包裹所有与外部设备的通信代码——设备断电、网线被拔、PLC 死机，都是家常便饭。

> [!def] 官方定义
> `try-catch-finally` 是 C# 的结构化异常处理（SEH）块：
> - `try`：监视可能抛出异常的代码
> - `catch (ExceptionType ex)`：捕获并处理特定类型的异常（可多个 catch 块，从具体到宽泛）
> - `finally`：无论是否发生异常都会执行的清理代码（即使 try 中有 `return`）
> - `catch { throw; }` 重抛（保留原始堆栈），`catch { throw ex; }` 重置堆栈（不推荐）

> [!origin] 由来背景
> 在没有异常处理的时代（C 语言），错误通过返回值（`-1`/`NULL`/错误码）传递，每个函数调用后都要 `if (result < 0)` 检查——代码里 60% 是错误检查。C# 的异常机制把"正常逻辑"和"错误处理"分离开，让代码更清晰。`finally` 的"保证执行"语义更是精妙——即使 `try` 块里 `return` 了，`finally` 仍然会跑完才真正返回。

> [!essentials] 核心要点
> - `try` 后必须有至少一个 `catch` 或 `finally`
> - `catch` 可以有多个，从最具体的异常类型开始
> - `finally` 一定执行（除非 `Environment.FailFast` 或进程被杀）
> - `throw;` 不乱堆栈，`throw ex;` 重置堆栈起点
> - `when` 过滤器（C# 6）：`catch (Exception ex) when (ex.Message.Contains("timeout"))`
> - 不要空 `catch`！至少记录日志

> [!example] 完整示例
> ```csharp
> // ====== 基本模式 ======
> try
> {
>     // 可能出错的代码
>     int result = 10 / 0;  // DivideByZeroException!
> }
> catch (DivideByZeroException ex)
> {
>     Console.WriteLine($"除数不能为零: {ex.Message}");
> }
> catch (Exception ex)
> {
>     Console.WriteLine($"未预期的错误: {ex.Message}");
> }
> finally
> {
>     Console.WriteLine("清理工作完成");
> }

> // ====== 上位机实战：带重试的通信 ======
> const int MAX_RETRIES = 3;
> for (int attempt = 1; attempt <= MAX_RETRIES; attempt++)
> {
>     try
>     {
>         Console.WriteLine($"[尝试 {attempt}/{MAX_RETRIES}] 连接设备...");
>         // 模拟：第3次才成功
>         if (attempt < 3) throw new TimeoutException("设备未响应");
        
>         Console.WriteLine("✅ 连接成功！");
>         break;
>     }
>     catch (TimeoutException ex) when (attempt < MAX_RETRIES)
>     {
>         Console.WriteLine($"  超时: {ex.Message}，{1000}ms后重试");
>     }
>     catch (Exception ex)
>     {
>         Console.WriteLine($"❌ 连接失败: {ex.Message}");
>         throw; // 非超时异常直接重抛
>     }
> }

> // ====== finally 确保资源释放 ======
> // 无论如何都要关串口
> try
> {
>     Console.WriteLine("打开串口 COM3...");
>     Console.WriteLine("读取数据...");
>     throw new InvalidOperationException("串口突然断开！");
> }
> catch (Exception ex)
> {
>     Console.WriteLine($"异常: {ex.Message}");
> }
> finally
> {
>     Console.WriteLine("关闭串口（一定会执行）");
> }
> ```

> [!scene] 适用场景
> ✅ 所有 IO 操作（文件、网络、串口）
> ✅ 外部设备通信和外层入口
> ✅ 资源清理
> ❌ 常规流程控制（不应用异常替代 if）

> [!pitfall] 常见踩坑
> 坑 1：**空 catch** → `catch { }` 吞掉异常，无日志——生产环境查问题无解！
> 坑 2：**catch 太宽泛** → `catch (Exception)` 把所有异常一网打尽。
> 坑 3：**`throw ex;` 丢失堆栈** → 应该 `throw;` 保留原始堆栈信息。

> [!best] 最佳实践
> - catch 具体异常 + 通用兜底
> - finally 用于资源释放（`using`/`using var` 更简洁）
> - 用 `when` 做条件过滤
> - 上位机顶层加全局异常处理作为最后防线

> [!practice] 上手练习
> **Lv.1**：写出捕获除零异常的代码
> **Lv.2**：模拟带重试+when过滤的设备连接
> **Lv.3**：为上位机实现带日志的通信重试管理器

> [!related] 相关知识链接
> - → 后续必学：using/IDisposable
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/exception-handling-statements
