---
title: Action 与 Func
section: 00-prelude
parent: 委托与事件
---

# Action 与 Func

> [!plain] 白话理解
> 如果说 `delegate` 是让你自己造遥控器，那 `Action` 和 `Func` 就是现成的万能遥控器——你不用定义了，直接用就行。`Action` 是"只干活不汇报"（无返回值），`Func` 是"干活还交报告"（有返回值）。`Func<string, int, bool>` 表示"吃一个 string 和一个 int，吐一个 bool"。上位机中 `Action<string>` 常用于日志回调，`Func<double, string>` 常用于格式化转换。

> [!def] 官方定义
> - `Action`：无返回值的委托（0~16个参数），`Action<T1,T2,...>`
> - `Func<TResult>`：有返回值的委托（0~16个参数+1个返回值），`Func<T1,T2,...,TResult>`（最后一个类型参数总是返回类型）
> - 都是 `System` 命名空间内置泛型委托，不需要自定义 `delegate`

> [!origin] 由来背景
> 早期 C# 里"把一段行为传给方法"必须先声明委托类型：`public delegate int MyCalc(int a, int b);`——用一次声明一次，代码里到处是委托定义。.NET 3.5 引入 LINQ 时，微软发现到处都需要"带 0~N 个参数的方法引用"，于是内置了 `Action`（无返回值）和 `Func`（有返回值）两组泛型委托，配合 Lambda 表达式让"行为即数据"成为日常。上位机里传感器校准函数、温度格式化、告警回调，都用它们注入策略，不再需要自定义委托。

> [!essentials] 核心要点
> - `Action<string> log = msg => Console.WriteLine(msg);`
> - `Func<int, int, int> add = (a, b) => a + b;`
> - `Func<bool> isReady = () => IsConnected();`（无参 Func）
> - Action 无返回值，Func 最后一个类型参数是返回值类型

> [!example] 完整示例
> ```csharp
> // ====== Action：只干活不返回 ======
> Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
> log("设备启动");

> Action<double, double> alert = (temp, pressure) =>
> {
>     if (temp > 80) Console.WriteLine($"高温告警: {temp}℃");
>     if (pressure > 2.0) Console.WriteLine($"高压告警: {pressure}MPa");
> };
> alert(85.5, 2.1);

> // ====== Func：干活并返回 ======
> Func<double, string> formatTemp = t => $"{t:F1}℃";
> Func<int, int, bool> isGreater = (a, b) => a > b;

> Console.WriteLine($"温度: {formatTemp(85.5)}");  // 85.5℃
> Console.WriteLine($"10>5? {isGreater(10, 5)}");  // True

> // ====== 上位机实战：用 Func 做数据转换 ======
> public class SensorReader
> {
>     private readonly Func<double, double> _calibration;
    
>     public SensorReader(Func<double, double> calibration) => _calibration = calibration;
    
>     public double Read()
>     {
>         double raw = 1023.0;
>         return _calibration(raw);  // 应用校准函数
>     }
> }

> var reader = new SensorReader(raw => raw * 5.0 / 1023.0 - 0.5);
> Console.WriteLine($"校准值: {reader.Read():F2}V");
> ```

> [!scene] 适用场景
> ✅ 回调、转换器、事件处理器
> ✅ LINQ（内容全是 `Func`）
> ✅ 配置对象的行为（而非继承）

> [!pitfall] 常见踩坑
> 坑 1：**`Func` 的类型参数位置搞反** → 返回值永远在最后一个类型参数：`Func<int, string>` 是"入 int 出 string"，`Func<int, int, string>` 才是"入两个 int 出 string"。
> 坑 2：**Lambda 捕获循环变量** → `for` 循环里 `list.Add(() => Use(i))` 捕获的是同一个 `i`，循环结束后所有委托看到的都是最终值。需要局部副本 `int j = i;`（foreach 在 C# 5+ 已安全）。
> 坑 3：**委托长期捕获大对象** → 闭包会强引用捕获的所有变量，导致大对象无法被 GC。用完及时将委托置空或避免捕获。
> 坑 4：**在 `Action` 里做同步阻塞** → 回调里别放 `Thread.Sleep`/同步 IO，会卡住调用方线程。耗时工作交给 `Task.Run`。

> [!best] 最佳实践
> - 优先 `Action`/`Func`，不要再自定义 `delegate`
> - 参数多时考虑封装为参数类
> - 善用 `Func<T, bool>` 替代 `Predicate<T>`

> [!practice] 上手练习
> **Lv.1**：用 `Action<string>` 和 `Func<int,int,int>` 练习
> **Lv.2**：用 `Func<double,string>` 实现多格式温度显示
> **Lv.3**：实现通过 `Func` 注入校准策略的传感器读取器

> [!related] 相关知识链接
> - ← delegate
> - → event、Lambda
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.action-1
