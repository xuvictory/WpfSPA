---
title: Mutex 跨进程互斥
section: 08-threading
parent: 8.5 多线程同步与安全
---

# Mutex 跨进程互斥

> [!plain] 白话理解
> `lock` 管的是"一个程序里多个线程"，而 `Mutex` 管的是"**多个程序（进程）之间**"——就像给工厂里的**公共食堂**装了一把锁：无论是 1 号车间还是 2 号车间的人（不同进程），同一时间只能有一个车间的人进门就餐（执行临界区）。最常见的用途是**单实例保护**：上位机程序防止被操作员双击启动两次，否则两个实例同时打开串口、抢占 PLC，数据就乱了。用命名 Mutex（如 `Global\HmiDemo.SingleInstance`）后，第二个实例启动时发现锁已被第一个实例持有，直接弹出"程序已在运行"并退出。
>
> 一句话：**lock 锁线程、Mutex 锁进程——命名 Mutex 让多个程序之间也能互斥**。

> [!def] 官方定义
> - **`System.Threading.Mutex`**：同步原语，协调**多个进程或线程**对共享资源的互斥访问。与 `Monitor`/`lock`（仅进程内）不同，Mutex 是**命名对象**，可跨进程共享。
> - **命名 Mutex**：`new Mutex(bool initiallyOwned, string name, out bool createdNew)`，name 以 `Global\` 或 `Local\` 前缀区分会话作用域；不同进程用相同 name 即共享同一互斥体。
> - **核心方法**：`WaitOne()`（阻塞直到获得）、`WaitOne(timeout)`（超时未获得返回 false）、`ReleaseMutex()`（释放，须由持有者调用）。
> - **`Mutex(true, name, out createdNew)`**：`createdNew == true` 表示本进程是第一个创建者并已获得锁，常用于"单实例检测"。
> - **对比 `lock`**：进程内互斥用 `lock`（轻量）；跨进程互斥必须用 `Mutex`（较重，系统内核对象）。
> - 📖 官方文档：[Mutex 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.mutex)、[Mutex 与 Monitor](https://learn.microsoft.com/zh-cn/dotnet/standard/threading/overview-of-synchronization-primitives)、[如何：确保单实例](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/app-development/how-to-implement-application-single-instance)

> [!origin] 由来背景
> 多进程互斥的需求源于操作系统早期：多个程序要共享打印机、文件、设备，必须协调"谁先用"。Win32 提供内核互斥量（mutex）与信号量（semaphore）等原语，.NET 1.0 起通过 P/Invoke 包装成 `System.Threading.Mutex`。WPF 的单实例需求尤其经典：GUI 程序被重复启动会同时抢占串口、共享数据库文件。微软官方文档专门给出了用命名 Mutex 实现 WPF 单实例的推荐方案（上述链接），成为上位机工程的标配做法。相比后来的一些 IPC 方案，命名 Mutex 简单可靠，至今仍是"进程互斥/单实例"的首选。

> [!essentials] 核心要点
> - **命名 Mutex 才能跨进程**：不命名的 Mutex 只在进程内有效，等价于较重的 lock
> - **`Global\` vs `Local\` 前缀**：`Global\` 全系统可见（服务与桌面程序交互）；`Local\` 仅当前登录会话（默认场景，避免终端服务冲突）
> - **`createdNew` 用于单实例**：第一个创建者拿到 `true`；后续进程拿到 `false`，据此提示退出
> - **`WaitOne(timeout)` 是"尝试获取"**：拿不到返回 false，不会无限等待——UI 场景必须给超时，否则窗口可能卡在等锁
> - **持有者才能 `ReleaseMutex`**：跨线程/进程释放会抛 `ApplicationException`
> - **记得 `Dispose`**：不再使用后 `_mutex.ReleaseMutex()` + `Dispose()`，避免内核对象泄漏

> [!example] 完整示例
> **Mutex 跨进程互斥演示：防止上位机被重复启动：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Mutex 跨进程互斥" Height="340" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="Mutex 跨进程互斥演示" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <TextBlock Text="本程序在启动时用命名 Mutex 保证同一时间只有一个实例运行。"
>                    TextWrapping="Wrap" Foreground="#8B949E" Margin="0,0,0,10"/>
>         <TextBlock x:Name="InstanceText" Foreground="#238636" TextWrapping="Wrap"
>                    FontSize="14" Margin="0,0,0,10"/>
>         <Button Content="尝试启动第二个实例" Click="OnCheckClick"
>                 Margin="0,5" Padding="8" Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="ResultText" Foreground="#8B949E" TextWrapping="Wrap"
>                    Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Threading;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 全局命名的 Mutex 可跨进程共享，名称要唯一
>         private static Mutex _appMutex =
>             new Mutex(true, @"Global\HmiDemo.SingleInstance", out bool isNew);
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // isNew 为 true 表示当前进程第一个拿到该互斥体
>             InstanceText.Text = isNew
>                 ? "当前是第一个实例：已获得互斥体 ✓"
>                 : "互斥体已被占用（本窗口无法正常打开）";
>         }
>
>         private void OnCheckClick(object sender, RoutedEventArgs e)
>         {
>             // 尝试在 100ms 内获得互斥体：拿不到说明另一个实例在运行
>             if (_appMutex.WaitOne(100))
>             {
>                 ResultText.Text = "获得互斥体：当前实例独占运行";
>                 _appMutex.ReleaseMutex(); // 用完立即释放
>             }
>             else
>             {
>                 ResultText.Text = "未获得互斥体：已有另一个上位机实例在运行！";
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ **上位机单实例保护**：防止双击启动两个实例同时打开串口/PLC，用命名 Mutex 拒绝第二个实例
> ✅ **共享配置文件/数据库的进程互斥**：两个服务进程写同一个配置文件，用 Mutex 串行化
> ✅ **多进程协作的"谁先到谁干活"**：守护进程与主程序争抢"某个初始化任务"，Mutex 保证只执行一次
> ✅ **服务与桌面程序通信互斥**：`Global\` 前缀让 Windows 服务与桌面客户端共享锁
> ❌ **进程内线程互斥**：同进程用 `lock`/`Monitor` 更轻量，Mutex 是内核对象，开销大
> ❌ **单纯"防重入"的同线程场景**：`lock` 完全够用，别上 Mutex 增加复杂度

> [!pitfall] 常见踩坑
> 坑 1：**Mutex 忘释放** → 现象：第二次启动永远提示"已在运行"，即使第一个实例已关闭 → 原因：进程异常退出或没 `ReleaseMutex`，内核对象残留 → 解决：持有者在 finally 中 `ReleaseMutex` + `Dispose`；进程正常退出时 OS 会自动回收，但异常场景可能残留
>
> 坑 2：**`WaitOne()` 不带超时在 UI 线程调用** → 现象：另一个实例死锁/挂起时，当前窗口"卡死等锁" → 原因：无限等待阻塞 UI 线程 → 解决：UI 场景永远用 `WaitOne(100)` 等短超时，拿不到就提示，不阻塞界面
>
> 坑 3：**Mutex 名称太通用** → 现象：与本机其他程序意外互斥，莫名其妙"无法启动" → 原因：名称（如 "MyApp"）被别的程序占用 → 解决：名称带项目/公司唯一前缀，如 `Global\WpfSpa.HmiDemo.SingleInstance`；用 `createdNew` 判断而非想当然
>
> 坑 4：**以为 `createdNew == false` 的进程能"接管"** → 现象：第二个实例判断互斥后直接退出，但界面没提示 → 原因：只做了判断没做提示 → 解决：`false` 时弹 `MessageBox`"程序已在运行"并 `Shutdown()`；想"激活已运行窗口"需配合 IPC/命名管道，Mutex 本身不做这件事

> [!best] 最佳实践
> - **单实例逻辑放 `App.xaml.cs`**：`OnStartup` 里创建 Mutex，`createdNew == false` 时提示并 `Shutdown()`，窗口代码不掺和
> - **名称格式统一**：`Global\{Company}.{Product}.SingleInstance`，避免冲突、便于识别
> - **`WaitOne` 一律给超时**：UI 线程用短超时，后台用合理超时，杜绝无限等待
> - **持有期间尽快释放**：互斥区内只做"独占性小操作"，别把整个采集循环包进去
> - **异常场景用 `try/finally` 包住互斥区**：确保任何路径都 `ReleaseMutex`
> - **提示语要友好**：重复启动时提示"程序已运行，请查看任务栏"，而不是直接静默退出

> [!practice] 上手练习
> **Lv.1 运行改参数**：编译运行后连开两个实例：第二个实例提示互斥体被占用；关闭第一个实例后再开第二个，观察恢复正常；把名称前缀 `Global\` 改成 `Local\` 再试
> **Lv.2 加属性**：给 OnCheckClick 加一个"模拟独占 2 秒"按钮：`WaitOne` 后 `Thread.Sleep(2000)` 再释放，期间点击第二个实例的按钮观察等待效果
> **Lv.3 改造**：把单实例逻辑移到 `App.xaml.cs`：`OnStartup` 创建 Mutex，`createdNew==false` 时 `MessageBox` 提示 + `Shutdown()`；启动参数带 `--allow-multi` 时跳过检测（便于调试）
> **Lv.4 挑战**：实现"多进程共享计数"：两个程序实例都用同一个命名 Mutex 保护一个共享内存文件（用临时文件模拟），各自 `WaitOne` 后追加一行记录再释放，验证跨进程互斥生效且文件不乱

> [!related] 相关知识链接
> - ← 前置知识：`lock-与-monitor`（进程内互斥的基础概念）、`主线程与后台线程`（进程与线程的区别）
> - → 后续必学：`semaphore-信号量`（另一个内核同步原语：控制并发数量而非互斥）
> - ⇄ 关联概念：`并发集合`（进程内免锁容器）、`生产者-消费者模式`（多进程/多线程协作结构）
> - 📖 官方文档：[Mutex 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.threading.mutex)、[同步原语概述](https://learn.microsoft.com/zh-cn/dotnet/standard/threading/overview-of-synchronization-primitives)、[WPF 单实例应用](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/app-development/how-to-implement-application-single-instance)
