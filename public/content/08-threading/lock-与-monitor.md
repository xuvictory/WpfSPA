---
title: lock 与 Monitor
section: 08-threading
parent: 8.5 多线程同步与安全
---

# lock 与 Monitor

> [!plain] 白话理解
> 多个后台线程同时改同一个变量，就像**几个人抢同一支笔在同一个本子上记账**：A 刚把笔拿起写了一半，B 就抢走笔接着写，最后账本上的数字完全对不上。`lock` 就是给这本账本配的**"排队锁"**：谁想记账先拿锁，记完再交出来，其他人排队等——同一时刻只有一个人能动这本账本。C# 的 `lock` 语句只是 `Monitor.Enter`/`Monitor.Exit` 的语法糖：编译器自动在进入时拿锁、退出时（包括异常时）释放锁。**核心价值：把"读-改-写"这种非原子操作变成原子操作，避免竞态条件**。
>
> 一句话：**lock 给共享数据上"排队锁"，保证同一时刻只有一个线程能改它**。

> [!def] 官方定义
> - **`lock (lockObject) { ... }`**：C# 语句，等价于 `Monitor.Enter(obj)` + `try { ... } finally { Monitor.Exit(obj); }`（C# 4.0 起推荐重载 `Monitor.Enter(obj, ref lockTaken)` 模式，编译器的 lock 已自动处理）。确保临界区在任何路径（含异常）下都释放锁。
> - **`System.Threading.Monitor`**：提供线程同步的静态类。核心方法：`Enter`（获取排他锁）、`Exit`（释放）、`TryEnter`（带超时地尝试获取）、`Wait`/`Pulse`（配合条件等待，生产环境较少直接用）。
> - **锁对象约定**：锁对象通常是一个 `private readonly object _lock = new object();`，**不要锁** `this`、字符串、`typeof(...)` 等公共对象（易被其他代码锁同一对象造成意外死锁）。
> - **`Interlocked`**：对于 `count++` 这类简单原子操作，`System.Threading.Interlocked.Increment(ref _counter)` 是比 lock 更轻量的选择（无锁，硬件级原子指令）。
> - **`lock` 与 `async`**：`lock` 内不能 `await`（编译错误 CS1996），因为锁的持有线程不能跨越 await 切换；异步锁需 `SemaphoreSlim`。
> - 📖 官方文档：[lock 语句](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/lock)、[Monitor 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.monitor)、[Interlocked 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.interlocked)

> [!origin] 由来背景
> 多线程编程中的"竞态条件"从操作系统诞生起就存在：两个线程并发执行 `count++`（读取-加一-写回三步）时可能互相覆盖。早期 C 用互斥量（mutex）/临界区（critical section）手动加锁，繁琐且易漏释放。.NET 1.0 引入 `Monitor` 类；C# 2.0（2005）把最常用的加锁场景语法化为 `lock` 语句，自动生成 try-finally 保证释放。之后 .NET 4.0 提供 `Interlocked` 与并发集合（`ConcurrentQueue` 等），进一步把"常用同步"内置化。`lock` 至今仍是 .NET 进程内互斥的首选，上位机中保护共享缓存、状态变量、计数器时几乎天天用到。

> [!essentials] 核心要点
> - **`lock` 是互斥锁**：同一时刻只有一个线程能持有锁进入临界区，其他线程阻塞等待
> - **锁对象必须稳定**：用 `private readonly object` 专用字段，锁对象不可变、不对外暴露
> - **临界区越小越好**：只在"读-改-写"那几行加锁，别把无关代码包进去（锁太大性能差）
> - **`lock` 内禁止 `await`**：C# 编译器直接报错；需要"异步互斥"用 `SemaphoreSlim(1,1)`（见 `semaphore-信号量`）
> - **能不用锁就不用锁**：原子变量用 `Interlocked`、只读数据用不可变集合、容器用 `并发集合`
> - **锁不是"万能安全"**：不变量（invariant）跨多个字段时，锁的范围要覆盖全部相关字段，否则仍可能读到中间态

> [!example] 完整示例
> **lock 与 Monitor 演示：多线程竞争计数器，加锁保证原子性：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="lock 与 Monitor" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="lock 与 Monitor 演示" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <!-- 10 个线程并发对同一计数器加 100 次 -->
>         <Button Content="无锁并发累加（结果会错乱）" Click="OnNoLockClick"
>                 Margin="0,5" Padding="8" Background="#DA3633" Foreground="White"/>
>         <Button Content="lock 加锁累加（结果准确）" Click="OnLockClick"
>                 Margin="0,5" Padding="8" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="LogText" Foreground="#8B949E" TextWrapping="Wrap"
>                    MinHeight="150" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Threading;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private int _counter;          // 共享计数器
>         private readonly object _lock = new object(); // 锁对象
>
>         public MainWindow() => InitializeComponent();
>
>         // 无锁版：count++ 非原子，10 个线程互相打断，结果 < 1000
>         private void OnNoLockClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             RunConcurrent(false);
>         }
>
>         // 加锁版：lock 保证同一时刻只有一个线程进入临界区
>         private void OnLockClick(object sender, RoutedEventArgs e)
>         {
>             LogText.Text = "";
>             RunConcurrent(true);
>         }
>
>         private void RunConcurrent(bool useLock)
>         {
>             _counter = 0;
>             var tasks = new Task[10];
>             for (int i = 0; i < tasks.Length; i++)
>             {
>                 tasks[i] = Task.Run(() =>
>                 {
>                     for (int j = 0; j < 100; j++)
>                     {
>                         if (useLock)
>                         {
>                             // lock 等价于 Monitor.Enter/Exit 的 try-finally 写法
>                             lock (_lock)
>                             {
>                                 _counter++;
>                             }
>                         }
>                         else
>                         {
>                             _counter++; // 读取-加一-写回三步可能被中断
>                         }
>                     }
>                 });
>             }
>             Task.WhenAll(tasks).ContinueWith(_ => Dispatcher.Invoke(() =>
>                 LogText.Text = $"10 个线程各累加 100 次：结果 = {_counter}" +
>                                $"（{(useLock ? "加锁，应为 1000" : "未加锁，可能小于 1000")}）"));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **保护共享计数器/状态标志**：采集线程与 UI 线程共享"在线次数、报文计数"，`lock` 或 `Interlocked`
> ✅ **保护共享集合的"检查后修改"**：`if (list.Count > 0) list.RemoveAt(0)` 必须整体加锁，否则检查与移除之间被插队
> ✅ **多线程写同一个配置对象**：后台线程更新设备参数，UI 线程读显示，锁保证读到一致快照
> ✅ **日志队列的入队操作**：多个采集线程同时 `Enqueue`，加锁保证不丢
> ❌ **纯 CPU 并行计算**：`Parallel.For` 内各线程处理独立数据时无需锁，加锁反而拖慢
> ❌ **高性能读多写少**：读写锁 `ReaderWriterLockSlim` 或原子操作更合适，`lock` 把所有读者也互斥了

> [!pitfall] 常见踩坑
> 坑 1：**锁了 `this` / 字符串 / `typeof(T)`** → 现象：偶发死锁且极难排查 → 原因：这些对象全局可见，其他代码可能锁同一对象 → 解决：永远用 `private readonly object _lock = new object();` 私有锁对象
>
> 坑 2：**`lock` 里 `await`** → 现象：编译错误 CS1996（无法在锁内 await）→ 原因：锁跨 await 无法保持线程所有权 → 解决：重活放 `await` 前算好，临界区只保留同步短操作；必须异步互斥用 `SemaphoreSlim(1,1)` + `await WaitAsync()`
>
> 坑 3：**锁的粒度太大** → 现象：并发性能骤降，多个无关操作排队 → 原因：把整个方法都包进 lock → 解决：临界区最小化；不同数据用不同锁对象；先 `lock` 拷贝副本再在锁外处理
>
> 坑 4：**"检查-再执行"没整体加锁** → 现象：数据偶发错乱、集合越界 → 原因：`if(Count>0)` 与 `RemoveAt(0)` 之间别的线程把元素取走 → 解决：检查+操作必须同一把锁内完成
>
> 坑 5：**死锁（多把锁顺序不一致）** → 现象：程序卡死 → 原因：线程 A 持有锁 1 等锁 2，线程 B 持有锁 2 等锁 1 → 解决：全局统一加锁顺序，或尽量减少同时持有多把锁（详见 `死锁的成因与避免`）

> [!best] 最佳实践
> - **锁对象私有且只读**：`private readonly object _lock = new object();` 是标准写法
> - **临界区最小化**：只保护共享数据操作，计算、IO 放锁外
> - **简单计数用 `Interlocked`**：`Interlocked.Increment/Add/CompareExchange` 免锁、更快
> - **集合优先 `并发集合`**：ConcurrentQueue/ConcurrentDictionary 自带同步，比自己加锁更不易错（见 `并发集合`）
> - **锁内禁止异步与重 IO**：违反会造成持锁过久、死锁风险
> - **跨进程互斥用 `Mutex`**：`lock` 只在进程内有效，跨进程需 `Mutex`（见 `mutex-跨进程互斥`）

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例对比无锁（结果<1000）与加锁（结果=1000）；把线程数改 100、每线程累加 1000 次，更明显看到无锁丢失
> **Lv.2 加属性**：把计数器换成"共享 List"：无锁并发 `Add` 到 `List<int>`，观察报错或丢元素；加锁后正常
> **Lv.3 改造**：用 `Interlocked.Increment` 替代 `lock` 重写加锁版，验证结果一致且代码更短
> **Lv.4 挑战**：实现"线程安全的共享缓存"：`Cache` 类用 `lock` 保护 `Dictionary<string,double>`，支持 `Get`/`Set`；用 4 个线程并发读写 1000 次，验证无异常、值一致；再用 `ConcurrentDictionary` 重写对比

> [!related] 相关知识链接
> - ← 前置知识：`主线程与后台线程`（多线程基础）、`taskrun-与-taskdelay`（并发来源）
> - → 后续必学：`死锁的成因与避免`（锁用错的严重后果）、`semaphore-信号量`（异步互斥与并发上限）
> - ⇄ 关联概念：`并发集合`（免锁容器的选择）、`mutex-跨进程互斥`（进程级同步）、`生产者-消费者模式`（锁与队列的配合）
> - 📖 官方文档：[lock 语句](https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/lock)、[Monitor 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.monitor)、[Interlocked 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.interlocked)
