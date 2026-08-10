---
title: while 循环与 do-while 循环
section: 00-prelude
parent: 流程控制
---

# while 循环与 do-while 循环

> [!plain] 白话理解
> `while` 和 `do-while` 是"不知道要干多少次，只知知道什么时候停"的循环。就像你在流水线上盯传感器：不知道什么时候会来料，只知道"如果来料就处理，没来料就继续等"——这就是 `while`。`do-while` 就更倔了："不管三七二十一，先做一次，做完再决定要不要继续"。上位机中最常见的场景：`while (serialPort.BytesToRead > 0)` 持续读取串口缓冲区、`while (!connected)` 反复尝试连接设备。

> [!def] 官方定义
> - **`while` 循环**：先判断条件再执行循环体。条件为 `true` 进入循环，每次执行完循环体后重新判断条件。如果一开始条件就是 `false`，循环体一次也不执行。
> - **`do-while` 循环**：先执行一次循环体，再判断条件。条件为 `true` 继续，为 `false` 退出。循环体**至少执行一次**。
> - 两者都是 C# 的迭代语句，适用于循环次数不确定的场景。
> - `break` 可以提前退出，`continue` 跳过本次剩余部分。

> [!origin] 由来背景
> `while` 和 `for` 一样古老，源自 ALGOL 时代。在底层汇编层面，`while` 对应一条"条件跳转"指令，`do-while` 对应"先执行再跳转"——后者少一次判断，在嵌入式领域有时能省几个时钟周期。但在上位机中，`while` 远比 `do-while` 常用，因为大多数场景下"先检查再干活"比"先干活再检查"更安全。一个经典反例：`do { data = ReadSensor(); } while (data == null);` 如果 ReadSensor 在传感器未初始化时抛异常，那就直接炸了——所以你很少见到 `do-while`。

> [!essentials] 核心要点
> - `while`：先判断，后执行（可能执行 0 次）
> - `do-while`：先执行，后判断（至少执行 1 次）
> - `do-while` 最后有分号 `;`：`do { ... } while (condition);`
> - 别忘了循环体中改变条件的语句，否则就是死循环
> - `while (true)` 是合法的无限循环写法
> - 在上位机中 `while` 通常配合"超时"使用，避免死等

> [!example] 完整示例
> ```csharp
> // ========== 基本 while 循环 ==========
> int countdown = 5;
> while (countdown > 0)
> {
>     Console.WriteLine($"倒计时: {countdown}");
>     countdown--;  // ← 别忘了递减！否则死循环
> }
> Console.WriteLine("启动！");

> // ========== 基本 do-while ==========
> int attempt = 0;
> string? password;
> do
> {
>     attempt++;
>     Console.Write($"请输入密码(第{attempt}次): ");
>     password = Console.ReadLine();
> } while (password != "1234" && attempt < 3);

> if (password == "1234")
>     Console.WriteLine("密码正确，登录成功！");
> else
>     Console.WriteLine("密码错误次数过多，已锁定！");

> // ========== 上位机实战：串口数据读取 ==========
> // while (serialPort.BytesToRead > 0) 持续读取直到缓冲区为空
> byte[] buffer = new byte[256];
> int totalRead = 0;

> void ReadSerialBuffer(int bytesAvailable)  // 模拟传入可用字节数
> {
>     totalRead = bytesAvailable;
>     int consumed = 0;
>     while (consumed < totalRead)
>     {
>         // 每次读一个字节（实际中可能批量读）
>         // serialPort.Read(buffer, consumed, 1);
>         consumed++;
>         // 处理 buffer[consumed - 1] ...
>     }
>     Console.WriteLine($"从缓冲区读取了 {totalRead} 个字节");
> }
> ReadSerialBuffer(128); // 模拟：缓冲区有128字节

> // ========== 上位机实战：设备重连循环 ==========
> bool TryConnect(string ip, int port)
> {
>     // 模拟连接过程，第三次成功
>     Random rnd = new Random(42);
>     return rnd.Next(3) == 2;
> }

> int retryCount = 0;
> const int MAX_RETRIES = 5;
> const int RETRY_INTERVAL_MS = 1000;

> while (retryCount < MAX_RETRIES)
> {
>     Console.WriteLine($"尝试连接设备... (第{retryCount + 1}次)");
    
>     if (TryConnect("192.168.1.100", 502))
>     {
>         Console.WriteLine("✅ 设备连接成功！");
>         break;
>     }
    
>     retryCount++;
>     if (retryCount < MAX_RETRIES)
>     {
>         Console.WriteLine($"连接失败，{RETRY_INTERVAL_MS}ms 后重试...");
>         Thread.Sleep(RETRY_INTERVAL_MS); // 生产中可能用 await Task.Delay
>     }
> }

> if (retryCount >= MAX_RETRIES)
>     Console.WriteLine($"❌ 连接失败：已重试 {MAX_RETRIES} 次");

> // ========== while (true) + break: 事件等待循环 ==========
> int eventCounter = 0;
> while (true)
> {
>     // 主循环：持续监控
>     // 实际项目中这通常是应用程序的消息泵或主线程
>     Console.WriteLine($"监控周期 #{++eventCounter}: 设备状态正常");
    
>     if (eventCounter >= 3)
>     {
>         Console.WriteLine("收到停止信号，退出监控");
>         break;  // 退出无限循环
>     }
    
>     // 模拟循环间隔
>     // Thread.Sleep(1000);
> }

> // ========== 踩坑警示：忘记改变条件 ==========
> // while (true) { /* 合法但小心 */ }
> // int x = 0;
> // while (x < 10) { Console.WriteLine(x); } // 死循环！x 永远 = 0
> ```

> [!scene] 适用场景
> ✅ `while`：读取不固定长度的数据流（串口、TCP Socket、文件流）
> ✅ `while`：设备重连、资源等待、条件轮询
> ✅ `while (true)`：应用程序主循环、服务守护进程
> ✅ `do-while`：用户输入验证（至少让用户输入一次再判断）
> ✅ `do-while`：协议握手（至少发一次握手包）
> ❌ 已知循环次数 → 用 `for`
> ❌ 遍历集合 → 用 `foreach`

> [!pitfall] 常见踩坑
> 坑 1：**死循环：忘了在循环体内改变条件** → 
> ```csharp
> int i = 0;
> while (i < 10) { Console.WriteLine(i); } // i 永远不变 → 死循环！
> ```
> 解决：确保循环体内有能趋向退出条件的操作
>
> 坑 2：**`while` 条件里的方法有副作用** → 
> ```csharp
> while (ReadSensor(out data)) { Process(data); }
> // ReadSensor 每次判断都执行一次！如果你期望它只在一开始判断一次就错了
> ```
> 解决：如果只需要判断一次，先赋值给变量再判断：
> ```csharp
> bool hasData = ReadSensor(out data);
> while (hasData) { ...; hasData = ReadSensor(out data); }
> ```
>
> 坑 3：**`do-while` 后面忘写分号** → `do { ... } while (condition)` ❌ 最后那个 `;` 很容易忘！C# 编译器会报错，但新手容易困惑。

> [!best] 最佳实践
> - 循环条件复杂时，用 `bool` 变量命名，提高可读性：
>   ```csharp
>   bool keepMonitoring = !emergencyStop && isConnected;
>   while (keepMonitoring) { ... }
>   ```
> - 上位机中的 `while` 循环永远带超时保护：
>   ```csharp
>   var start = DateTime.Now;
>   while (!responseReceived && (DateTime.Now - start).TotalSeconds < 5)
>       await Task.Delay(100);
>   ```
> - `while (true)` 里面必须有明确的 `break` 路径
> - `do-while` 几乎只在"用户交互/至少尝试一次"的场景使用，不要滥用
> - 循环体超过 20 行，考虑抽成方法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 `while` 循环实现 10→1 倒计时，打印每条倒计时信息；用 `do-while` 实现同样的功能，体会先判断和后判断的区别
> **Lv.2 小试牛刀**：模拟串口数据读取——用 `Random` 随机生成 0~10 个字节数，用 `while` 循环读取模拟缓冲区直到为空，打印每次读取了多少字节和缓冲区剩余量
> **Lv.3 融会贯通**：实现一个"设备重连管理器"类：包含 `TryConnect` 方法，用 `while` 循环重试连接，支持指数退避（第1次等1秒，第2次等2秒，第3次等4秒...），最大重试10次，达到上限后触发 `ConnectionFailed` 事件

> [!related] 相关知识链接
> - ← 前置知识：for 循环（固定次数用 for，不确定次数用 while）
> - → 后续必学：foreach 循环（遍历集合专用）
> - → 后续必学：break/continue/return（循环控制关键字）
> - ⇄ 关联概念：异步编程（`while + await` 实现非阻塞循环）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/iteration-statements