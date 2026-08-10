---
title: Queue 与 Stack
section: 00-prelude
parent: 数组与集合
---

# Queue 与 Stack

> [!plain] 白话理解
> `Queue` 是"排队"——先进先出（FIFO），就像银行窗口排队，先来的先办。`Stack` 是"叠盘子"——后进先出（LIFO），最后放上去的盘子最先被拿走。上位机中，`Queue` 是串口数据缓冲区的天然模型（先收到的字节先处理），`Stack` 是撤销操作（Ctrl+Z）和导航历史的天然模型（后退回到上一个界面）。

> [!def] 官方定义
> `Queue<T>` 和 `Stack<T>` 是 `System.Collections.Generic` 下的泛型集合，分别实现先进先出（FIFO）和后进先出（LIFO）的数据结构。
> - `Queue<T>` 主要方法：`Enqueue`（入队）、`Dequeue`（出队）、`Peek`（查看队首不出队）
> - `Stack<T>` 主要方法：`Push`（入栈）、`Pop`（出栈）、`Peek`（查看栈顶不出栈）
> - 两者都基于环形数组实现，均摊 O(1) 操作

> [!origin] 由来背景>
> 队列和栈是计算机科学中最基础的数据结构。CPU 的中断处理用栈保存上下文、操作系统的消息循环用队列传递事件。在 .NET 中，还有一个特殊的 `ConcurrentQueue<T>`——线程安全版，适合生产者-消费者模式（如串口数据接收线程写入、UI 线程读取）。上位机开发中最经典的 `Queue` 场景：串口 DataReceived 事件把数据 `Enqueue`，主线程定时 `Dequeue` 处理——实现了接收和处理的解耦。

> [!essentials] 核心要点
> - Queue：`Enqueue` 加队尾、`Dequeue` 取队首（抛异常如果空）、`TryDequeue` 安全取
> - Stack：`Push` 压栈、`Pop` 弹栈（抛异常如果空）、`TryPop` 安全弹
> - 两者都有 `Count`、`Clear()`、`Contains()`、`ToArray()`
> - 空队列/栈调用 `Dequeue()`/`Pop()` 抛 `InvalidOperationException`
> - 线程安全版：`ConcurrentQueue<T>`、`ConcurrentStack<T>`

> [!example] 完整示例
> ```csharp
> // ========== Queue：串口数据缓冲区 ==========
> var dataQueue = new Queue<byte[]>();

> // 模拟串口 DataReceived 事件：数据入队
> dataQueue.Enqueue(new byte[] { 0x01, 0x03, 0x08 });
> dataQueue.Enqueue(new byte[] { 0x00, 0xFF, 0x00 });
> dataQueue.Enqueue(new byte[] { 0x01, 0x02, 0x44, 0x09 });

> Console.WriteLine($"缓冲区中有 {dataQueue.Count} 帧数据");

> // 主循环取数据（先进先出）
> while (dataQueue.TryDequeue(out byte[]? frame))
> {
>     string hex = string.Join(" ", frame.Select(b => $"{b:X2}"));
>     Console.WriteLine($"  处理帧: {hex}");
> }

> // ========== Stack：操作历史（撤销功能）==========
> var operationStack = new Stack<string>();

> operationStack.Push("修改温度上限: 80→85");
> operationStack.Push("添加设备: PLC-003");
> operationStack.Push("修改采样周期: 1000ms→500ms");

> Console.WriteLine($"\n操作历史 ({operationStack.Count}步):");
> foreach (string op in operationStack)
>     Console.WriteLine($"  {op}");

> // 撤销：后进先出
> Console.WriteLine($"\n执行撤销: {operationStack.Pop()}");
> Console.WriteLine($"执行撤销: {operationStack.Pop()}");
> Console.WriteLine($"剩余历史: {operationStack.Count}步");

> // ========== 上位机实战：命令队列调度器 ==========
> var commandQueue = new Queue<(string DeviceId, byte[] Command)>();
> commandQueue.Enqueue(("PLC-001", new byte[] { 0x01, 0x03, 0x00, 0x00, 0x00, 0x04 }));
> commandQueue.Enqueue(("PLC-002", new byte[] { 0x01, 0x03, 0x00, 0x10, 0x00, 0x02 }));

> Console.WriteLine($"\n命令队列 ({commandQueue.Count}条):");
> while (commandQueue.TryDequeue(out var cmd))
> {
>     Console.WriteLine($"  发送→{cmd.DeviceId}: [{string.Join(" ", cmd.Command.Select(b => $"{b:X2}"))}]");
>     // 实际中这里调用通信模块发送
> }
> ```

> [!scene] 适用场景
> ✅ Queue：串口/网络数据缓冲、命令调度、消息队列、打印任务排队
> ✅ Stack：撤销/重做、页面导航历史、表达式求值、递归模拟
> ❌ 需要随机访问 → `List<T>`
> ❌ 需要键值查找 → `Dictionary<K,V>`

> [!pitfall] 常见踩坑
> 坑 1：**空队列 `Dequeue()` 抛异常** → 用 `TryDequeue(out var item)` 判断是否成功。
> 坑 2：**`Peek` 也不安全** → 空时也会抛异常，先用 `Count > 0` 或 `TryPeek`。
> 坑 3：**`foreach` 遍历 Queue/Stack 不会移除元素** → 只是看看，元素还在。要取出处理必须用 `Dequeue`/`Pop`。

> [!best] 最佳实践
> - 取元素前用 `TryDequeue`/`TryPop`，永远别裸调 `Dequeue`/`Pop`
> - 生产环境用 `ConcurrentQueue<T>`，手动加锁的 `Queue<T>` 在高并发下可能有问题
> - 大型缓冲区限制最大容量，用自定义 `BoundedQueue` 或在 Enqueue 前判断 `Count`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 `Queue<string>` 存5台设备名，挨个 `Dequeue` 处理
> **Lv.2 小试牛刀**：模拟串口数据接收——定时 `Enqueue` 字节数组，另一个方法循环 `TryDequeue` 解析帧
> **Lv.3 融会贯通**：用两个 `Stack<int>` 实现一个 `Queue<int>`（经典面试题）

> [!related] 相关知识链接
> - ← 前置知识：List、Dictionary
> - ⇄ 关联概念：`LinkedList<T>`（双向链表，另一种特殊集合）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.queue-1
