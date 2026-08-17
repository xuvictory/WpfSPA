---
title: WPF 内存常见问题与泄漏场景
section: 13-performance
parent: 13.3 内存管理
---

# WPF 内存常见问题与泄漏场景

> [!plain] 白话理解
> 内存泄漏好比"借了工具从不还库房"：程序运行时间越长，库房（内存）里堆的"没用的工具"越多，直到库房放不下、整个车间瘫痪。WPF 里最常见的"借了不还"，就是**事件订阅**：一个对象订阅了长期存活的事件源（比如上位机的报警中心），相当于把自己的名字登记在对方的"强引用通讯录"上——只要对方还活着，就永远拽着你不放，哪怕你已经不需要它了。示例用 `WeakReference` 做"测谎仪"：强事件订阅的对象在 GC 后依然存活（泄漏实锤），弱事件订阅的对象则被正常回收（一身轻松）。

> [!def] 官方定义
> 内存泄漏（Memory Leak）指程序持有不再使用的对象引用，使这些对象无法被垃圾回收器（GC）回收，导致可用内存持续下降。在 WPF/.NET 中，GC 只回收"无根（unreachable）"对象；只要存在一条从 GC 根（静态字段、存活线程、事件源等）到对象的强引用链，对象就永不回收。WPF 常见泄漏源：①事件订阅不解除（事件源强引用订阅者）；②静态字段/静态事件持有对象；③`DataContext`/绑定未清理（尤其 `Binding` 到非 `INotifyPropertyChanged` 对象）；④Timer/动画/`Dispatcher` 未停止；⑤`Image` 位图未释放（见 `图片优化与位图缓存`）。检测手段：`WeakReference` 观测、`GC.GetTotalMemory` 读数（见 `内存分析工具`）、`dotnet-dump`/VS 诊断工具。详见官方文档：[垃圾回收机制](https://learn.microsoft.com/zh-cn/dotnet/standard/garbage-collection/fundamentals)、[解决 WPF 内存泄漏](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/wpf-performance-tuning)。

> [!origin] 由来背景
> .NET 有自动垃圾回收，给开发者"内存不用管"的错觉，但 WPF 出现后，"内存越用越大"的报告就层出不穷。根因在于 WPF 是"事件驱动 + 数据绑定"的框架：控件之间、业务对象与 UI 之间靠事件和绑定**相互强引用**。WinForms 时代控件少、事件简单，泄漏不明显；WPF 动辄几十个窗口、几百个绑定，任何一个"忘了退订"的事件，都能让整个页面常驻内存。微软官方性能文档把"事件处理程序和委托"列为泄漏头号来源，并给出了 `WeakEventManager` 这套弱事件方案。对上位机尤其致命：程序要 7×24 小时运行，泄漏再小也会在几天后变成"内存撑爆、界面假死"的故障。

> [!essentials] 核心要点
> - **GC 只回收无根对象**：静态字段、事件源、存活线程都是"根"，被它们强引用的对象回收不了
> - **事件订阅是头号泄漏源**：`source.Event += handler` 让事件源强引用订阅者，订阅者"被动常驻"
> - **弱事件是解药**：`WeakEventManager` 让事件源只持有弱引用，订阅者无其他引用时即可回收（示例 `CleanSubscriber`）
> - **生命周期要匹配**：短暂对象订阅长期对象（报警中心、数据服务）时必须用弱事件或显式退订
> - **GC 验证法**：`WeakReference` + `GC.Collect()` 是判断对象是否"泄漏"的标准自证手段（示例 `OnCheck`）

> [!example] 完整示例
> **事件订阅导致的内存泄漏演示：强事件订阅无法回收，弱事件/解除订阅可正常回收：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="WPF 内存泄漏场景" Height="380" Width="580"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="事件订阅导致的内存泄漏演示"
>                    Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock x:Name="ExplainText" Foreground="#8B949E" Margin="0,10,0,0" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,14,0,0">
>             <Button Content="创建强事件订阅（泄漏）" Click="OnCreateLeaky" Padding="8"
>                     Background="#DA3633" Foreground="White"/>
>             <Button Content="创建弱事件订阅（安全）" Click="OnCreateClean" Padding="8" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <Button Content="执行 GC 并检查对象存活" Click="OnCheck" Padding="8" Margin="0,10,0,0"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>         <TextBlock x:Name="ResultText" Foreground="#58A6FF" Margin="0,14,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly AlarmSource _source = new AlarmSource();
>         private WeakReference _leakyRef;   // 强事件订阅对象引用
>         private WeakReference _cleanRef;   // 弱事件订阅对象引用
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             ExplainText.Text = "事件源被强引用时，订阅了它的对象无法被 GC 回收，这就是最常见的泄漏场景。";
>         }
>
>         // 制造泄漏：订阅对象被事件源强引用，即使局部变量置空也无法回收
>         private void OnCreateLeaky(object sender, RoutedEventArgs e)
>         {
>             var sub = new LeakySubscriber(_source);
>             _leakyRef = new WeakReference(sub);
>             sub = null;
>         }
>
>         // 正确做法：用 WeakEventManager 订阅，不阻止 GC 回收
>         private void OnCreateClean(object sender, RoutedEventArgs e)
>         {
>             var sub = new CleanSubscriber(_source);
>             _cleanRef = new WeakReference(sub);
>             sub = null;
>         }
>
>         // 强制 GC 后检查两个订阅对象是否仍存活
>         private void OnCheck(object sender, RoutedEventArgs e)
>         {
>             GC.Collect();
>             GC.WaitForPendingFinalizers();
>             GC.Collect();
>             bool leak = _leakyRef?.IsAlive == true;
>             bool clean = _cleanRef?.IsAlive == true;
>             ResultText.Text = $"强事件订阅对象存活：{leak}（true = 已被事件源持有，泄漏）；" +
>                               $"弱事件订阅对象存活：{clean}（false = 已正常回收）";
>         }
>     }
>
>     // 事件源：长期存活（比如上位机主机的数据服务）
>     public class AlarmSource
>     {
>         public event EventHandler<AlarmEventArgs> AlarmRaised;
>         public void Raise(string msg) => AlarmRaised?.Invoke(this, new AlarmEventArgs(msg));
>     }
>
>     public class AlarmEventArgs : EventArgs
>     {
>         public AlarmEventArgs(string message) => Message = message;
>         public string Message { get; }
>     }
>
>     // 强事件订阅：事件源持有对自身的强引用，形成泄漏
>     public class LeakySubscriber
>     {
>         public LeakySubscriber(AlarmSource source) => source.AlarmRaised += OnAlarm;
>         private void OnAlarm(object sender, AlarmEventArgs e) { }
>     }
>
>     // 弱事件订阅：事件源只持有弱引用，不再阻止回收
>     public class CleanSubscriber
>     {
>         public CleanSubscriber(AlarmSource source) =>
>             WeakEventManager<AlarmSource, AlarmEventArgs>.AddHandler(
>                 source, nameof(AlarmSource.AlarmRaised), OnAlarm);
>         private void OnAlarm(object sender, AlarmEventArgs e) { }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 页面/窗口反复开关：主界面打开 100 次报警页，内存却不涨——说明页面订阅的事件都正确清理了
> ✅ 7×24 小时运行监控：长时间无人值守，内存稳定在启动后水平，无泄漏（泄漏会导致几天后假死）
> ✅ 数据服务订阅：业务页订阅全局报警/数据服务事件，页面关闭后订阅者必须能回收
> ✅ 列表刷新：旧行对象订阅的 Timer/事件不清理，刷新几轮后内存膨胀
> ✅ 主题/皮肤切换：旧的样式资源、绑定不释放，切换多次后内存上涨
> ❌ 程序生命周期 = 对象生命周期的单例（如日志服务本身），不存在"回收"问题，无需弱事件
> ❌ 一次性工具类程序（运行几分钟就退出，泄漏无实际影响，但仍是坏习惯）

> [!pitfall] 常见踩坑
> 坑 1：**只造泄漏不验证** → 现象：代码审查发现 `+=` 一堆事件，却无法证明真泄漏 → 原因：没有观测手段，靠猜 → 解决：用示例的 `WeakReference` + `GC.Collect()` 自证法，把"对象是否存活"打印出来
> 
> 坑 2：**弱事件一上了事** → 现象：改用 `WeakEventManager` 后事件收不到了 → 原因：订阅对象没被别处强引用，直接被 GC 回收，回调自然失效 → 解决：弱事件只用于"订阅者生命周期短于事件源"的场景；需要持续收事件的业务对象要由所有者显式持有
>
> 坑 3：**漏掉 DispatcherTimer/动画这类隐式引用** → 现象：窗口关了内存还不降 → 原因：`DispatcherTimer` 在运行、`Storyboard` 未停止，它们持有回调引用 → 解决：窗口 `Closed` 时统一 `Stop()` 所有 Timer/动画并退订事件（见 `资源释放与-idisposable` 的统一清理入口）

> [!best] 最佳实践
> - 规则：**谁订阅谁退订**，`+=` 和 `-=` 成对出现；长生命周期对象被订阅时优先用 `WeakEventManager`
> - 窗口/页面统一做资源清理：`Closed` 事件里停止 Timer、退订事件、释放位图（见 `资源释放与-idisposable`）
> - 用示例的"泄漏自证"模式给每个可疑点写观测代码，把泄漏消灭在开发期而不是上线后
> - 定期做内存基线测试：连续开关页面 100 次，内存应回到基线水平（允许小幅波动）
> - 全局单例数据服务对外只暴露弱事件，或提供 `Unsubscribe` 接口，从源头杜绝"业务页拽着数据服务"

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，先点"创建强事件订阅"再点"执行 GC"，观察结果为"存活：true"（泄漏）；再点"创建弱事件订阅"重测，观察"存活：false"（正常）
> **Lv.2 小试牛刀**：给 `AlarmSource` 加一个"解除订阅"按钮：用 `-=` 退订强事件后再 GC，验证泄漏被修复；用 `GC.GetTotalMemory` 对比泄漏与修复后的内存读数
> **Lv.3 融会贯通**：为你的真实项目做一次"开关页面 100 次"的内存基线测试：用 `内存分析工具` 的读数和 VS 诊断工具抓内存快照，找出"每次开关都涨"的泄漏页，修复后重测直至内存回落

> [!related] 相关知识链接
> - ← 前置知识：`弱事件模式`（泄漏的解药，本节兄弟篇）、`什么是路由事件`（WPF 事件机制基础）
> - → 后续必学：`资源释放与-idisposable`（非托管资源怎么还）、`内存分析工具`（泄漏怎么量化验证）
> - ⇄ 关联概念：`图片优化与位图缓存`（位图泄漏是第二重灾区）、`什么是数据绑定`（Binding 泄漏的边界）、`内存分析工具`（GC 读数与进程工作集）
> - 📖 官方文档：[垃圾回收机制](https://learn.microsoft.com/zh-cn/dotnet/standard/garbage-collection/fundamentals)、[WeakEventManager](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.weakeventmanager)、[优化 WPF 应用程序性能](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/optimizing-performance-application-performance)
