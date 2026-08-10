---
title: 方法、值传递、ref 与 out
section: 00-prelude
parent: 类与对象
---

# 方法、值传递、ref 与 out

> [!plain] 白话理解
> 方法是类里的"技能"——对象能做的事。`void StartCollect()` 是"开始采集"，`double CalcAverage()` 是"计算平均值"。调用方法时，`int`/`double` 等值类型是"复印一份"传过去（改复印件不影响原件），对象等引用类型是"给个地址"传过去（通过地址能找到原件并修改它）。`ref` 和 `out` 打破了规则：`ref` 让值类型也能被方法修改，`out` 更绝——"我什么都不带，你给我装满了再回来"。上位机中 `out` 最常见于 `TryParse` 模式：`int.TryParse(input, out int result)`。

> [!def] 官方定义
> - **值传递（默认）**：实参的值复制给形参。值类型拷贝数据，引用类型拷贝引用。
> - **`ref`**：按引用传递。方法内外共享同一个变量，调用前变量必须已初始化。
> - **`out`**：输出参数。方法负责赋值，调用前变量不需要初始化（方法内必须给它赋值）。
> - **`in`**（C# 7.2）：只读引用传递。防止大结构体拷贝，但方法内不能修改。
> - 方法签名 = 方法名 + 参数类型和顺序（不包含返回类型）

> [!origin] 由来背景
> C# 的值传递/引用传递模型直接继承自 C/C++，但做了一处精妙的改进：`out` 参数。C++ 中"返回多个值"要么用指针、要么用 `std::tuple`，都很丑。C# 的 `out` 配合 `TryParse` 模式，让"尝试获取结果"变得优雅自然。而 `in` 参数（C# 7.2）则是性能优化的产物——对于大结构体（>16字节），按值传递的拷贝成本很高，`in` 让编译器用引用传递但保证只读。

> [!essentials] 核心要点
> - 值类型默认按值传递：方法内改形参不影响实参
> - 引用类型默认按值传递：拷贝引用，但指向同一对象（改属性会影响外部）
> - `ref`：方法内外共享同一个变量，改哪都是改这个
> - `out`：方法内必须赋值，调用前不必初始化
> - 调用时 `ref`/`out` 关键字必须同时出现在声明和调用处
> - `out` 可以内联声明：`Method(out int result);`（C# 7.0）

> [!example] 完整示例
> ```csharp
> // ========== 值类型：按值传递 ==========
> static void ModifyValue(int x)
> {
>     x = 999;
>     Console.WriteLine($"  方法内: x = {x}");
> }

> int a = 100;
> Console.WriteLine($"调用前: a = {a}");
> ModifyValue(a);
> Console.WriteLine($"调用后: a = {a}");  // 仍是 100！因为传的是副本

> // ========== ref：按引用传递 ==========
> static void ModifyRef(ref int x)
> {
>     x = 999;
> }

> int b = 100;
> ModifyRef(ref b);  // 调用时也要写 ref
> Console.WriteLine($"\nref修改后: b = {b}");  // 999！修改了原变量

> // ========== out：输出参数 ==========
> static bool TryParseSensorData(string raw, out double value, out string unit)
> {
>     value = 0;
>     unit = "未知";
    
>     // 模拟解析 "85.5℃" 
>     if (raw.EndsWith("℃"))
>     {
>         string numPart = raw.TrimEnd('℃');
>         if (double.TryParse(numPart, out value))
>         {
>             unit = "℃";
>             return true;
>         }
>     }
>     return false;
> }

> if (TryParseSensorData("85.5℃", out double temp, out string tempUnit))
>     Console.WriteLine($"\n解析成功: {temp}{tempUnit}");

> // ========== 上位机实战：Modbus 数据交换 ==========
> static void SwapRegisters(ref ushort reg1, ref ushort reg2)
> {
>     ushort temp = reg1;
>     reg1 = reg2;
>     reg2 = temp;
> }

> ushort highWord = 0x0001, lowWord = 0x0002;
> Console.WriteLine($"\n交换前: 高字=0x{highWord:X4}, 低字=0x{lowWord:X4}");
> SwapRegisters(ref highWord, ref lowWord);
> Console.WriteLine($"交换后: 高字=0x{highWord:X4}, 低字=0x{lowWord:X4}");

> // ========== 引用类型：拷贝引用 ==========
> static void ModifyDevice(DeviceInfo device)
> {
>     device.Temperature = 999;  // 改的是同一对象！
> }

> class DeviceInfo { public double Temperature { get; set; } }

> var device = new DeviceInfo { Temperature = 85.5 };
> Console.WriteLine($"\n修改前: {device.Temperature}℃");
> ModifyDevice(device);
> Console.WriteLine($"修改后: {device.Temperature}℃");  // 999！同一对象被改了
> ```

> [!scene] 适用场景
> ✅ `out`：TryParse 模式、多返回值（C# 7 前）
> ✅ `ref`：需要方法直接修改调用方变量的场景（交换、累加器）
> ✅ 默认值传递：日常 90% 的方法参数
> ❌ `ref`/`out` 滥用会降低可读性——能返回值就返回值

> [!pitfall] 常见踩坑
> 坑 1：**以为 `out` 参数可以不赋值** → 方法里必须给 `out` 参数赋值才能 `return`。
> 坑 2：**`ref` 参数未初始化** → `int x; ModifyRef(ref x);` ❌ 调用前 x 必须有值。
> 坑 3：**引用类型"按值传递"误认为不会影响外部** → 拷贝了引用地址，"原地改属性"外部可见。"重新 new"不影响外部。

> [!best] 最佳实践
> - C# 7+ 尽量用元组返回多值代替 `out`：`(bool ok, int result) = TryParse(input);`
> - `out` 只在 TryXxx 模式和互操作场景中使用
> - `ref` 谨慎使用，代码评审时会引人注目（说明这里故意修改变量）
> - 引用类型参数加 null 检查

> [!practice] 上手练习
> **Lv.1 照猫画虎**：写 `AddTen`(值传递)和 `AddTenRef`(ref)各自调一次看区别
> **Lv.2 小试牛刀**：用 `out` 实现 `TryDecodeModbusFrame(byte[] frame, out byte slave, out byte func, out ushort addr)`
> **Lv.3 融会贯通**：用 `ref` 实现原地反转数组

> [!related] 相关知识链接
> - ← 前置知识：值类型与引用类型
> - → 后续必学：方法重载
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/keywords/method-parameters
