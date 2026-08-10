---
title: delegate 委托
section: 00-prelude
parent: 委托与事件
---

# delegate 委托

> [!plain] 白话理解
> 委托（delegate）就是把"方法"当作"变量"传来传去。你定义了一个委托类型 `delegate int MathOp(int a, int b);`，它就可以指向任何"输入两个 int、返回一个 int"的方法。就像你家里的万能遥控器——它并不内置任何设备的红外码，但你"教"它学哪个它就会哪个。上位机中最典型的委托用法：通信库收到数据后回调通知你的处理方法，至于处理方法具体做什么——通信库不需要知道。

> [!def] 官方定义
> 委托是类型安全的函数指针（方法引用）。C# 中 `delegate` 关键字定义委托类型：
> - `delegate 返回类型 委托名(参数列表);`
> - 实例化：`委托名 instance = 方法名;` 或直接 `new 委托名(方法名)`
> - 调用：`instance(参数);` 或 `instance.Invoke(参数);`
> - 多播委托：可以用 `+=` `-=` 绑定多个方法，逐个调用
> - 委托是 `Action`/`Func`/`Predicate` 的内置泛型版本的前身

> [!origin] 由来背景
> 委托是 C# 中事件机制和异步编程的基石。C# 1.0 就引入了委托，语法厚重。C# 2.0 加入匿名方法（`delegate(int x) { }`），C# 3.0 加入 Lambda 表达式，最终让委托写起来像呼吸一样自然。上位机通信库中"数据到达→通知处理方"的松耦合模式，本质上就是委托在背后运筹。

> [!essentials] 核心要点
> - 定义：`delegate void MyDelegate(string msg);`
> - 实例化：`MyDelegate d = SomeMethod;`、`MyDelegate d = (msg) => Console.WriteLine(msg);`
> - 调用：`d("Hello");` 或 `d.Invoke("Hello");`
> - 多播：`d += AnotherMethod;`
> - 检查空委托：`d?.Invoke("...");`（C# 6）

> [!example] 完整示例
> ```csharp
> // ====== 定义委托 ======
> public delegate double MathOperation(double a, double b);

> // ====== 接口方法能匹配 ======
> static double Add(double x, double y) => x + y;
> static double Subtract(double x, double y) => x - y;

> // ====== 使用 ======
> MathOperation op = Add;
> Console.WriteLine($"5 + 3 = {op(5, 3)}");

> op = Subtract;  // 换一个方法
> Console.WriteLine($"5 - 3 = {op(5, 3)}");

> // ====== 多播委托（链式调用）==========
> public delegate void LogHandler(string msg);

> LogHandler logger = m => Console.WriteLine($"[INFO] {m}");
> logger += m => Console.WriteLine($"[DEBUG] {m}");
> logger("设备已连接");  // 两个方法都执行！

> // ====== 上位机实战：数据回调 ======
> public delegate void DataReceivedHandler(byte[] data);

> public class SerialPortReader
> {
>     public DataReceivedHandler? OnDataReceived;
    
>     public void SimulateData()
>     {
>         var data = new byte[] { 0x01, 0x03, 0x08 };
>         OnDataReceived?.Invoke(data);  // 安全调用（null 检查）
>     }
> }

> var reader = new SerialPortReader();
> reader.OnDataReceived += data => Console.WriteLine($"收到{data.Length}字节");
> reader.SimulateData();
> ```

> [!scene] 适用场景
> ✅ 回调函数（数据到达/操作完成/状态改变）
> ✅ 策略模式
> ✅ 事件机制底层
> ❌ 现在新代码优先用 `Action`/`Func` + Lambda

> [!pitfall] 常见踩坑
> 坑 1：**委托未赋值就 Invoke** → `NullReferenceException`，用 `?.Invoke()`。
> 坑 2：**多播委托有返回值只拿到最后一个** → 需要逐个调用和收集时手动遍历 `GetInvocationList()`。

> [!best] 最佳实践
> - 新代码用 `Action`/`Func` 替代自定义 `delegate`
> - 委托字段命名以 `On` 开头
> - 安全调用：`handler?.Invoke(args);`

> [!practice] 上手练习
> **Lv.1**：定义 `delegate bool Filter(int n);` 和几个过滤方法
> **Lv.2**：用委托实现设备数据回调
> **Lv.3**：实现带多播委托的简易事件总线

> [!related] 相关知识链接
> - → Action/Func、event、Lambda
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/reference-types#the-delegate-type
