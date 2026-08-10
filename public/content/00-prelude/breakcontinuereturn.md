---
title: break、continue、return
section: 00-prelude
parent: 流程控制
---

# break、continue、return

> [!plain] 白话理解
> 这三个关键字是循环里的"交通警察"。`break` 是"停车！前面的路不通了，循环到此为止"；`continue` 是"这个跳过，下一个！"——不退出循环，只跳过当前这一轮；`return` 是"下班！整个方法到此结束，后面的代码全都不要了"。上位机代码里它们无处不在：搜索到目标设备就 `break` 出循环；遇到通信异常的记录就 `continue` 跳过；检测到致命错误就 `return` 直接退出方法。

> [!def] 官方定义
> - `break`：立即终止最内层的循环或 `switch` 语句，控制流转到循环/switch 之后的下一条语句。
> - `continue`：跳过当前循环迭代的剩余部分，立即开始下一次迭代（重新判断循环条件）。
> - `return`：终止当前方法的执行，将控制权返回给调用方。可附带返回值（对于有返回值的方法）或不带返回值（`void` 方法）。
> - 三者都是跳转语句（Jump Statement），`break`/`continue` 用于循环，`return` 用于方法。

> [!origin] 由来背景
> 这三个关键字从 C 语言时代（1972年）就存在了。`goto` 是它们的老祖宗——在结构化编程运动之前，程序员用 `goto` 跳来跳去，面条式代码让维护变成噩梦。Edsger Dijkstra 在 1968 年发表了著名的《Go To Statement Considered Harmful》，直接催生了 `break`/`continue`——把无限制的跳转限制为"只作用于当前循环"的安全跳转。`return` 更是面向对象方法的基石——没有它，方法就没法返回值。

> [!essentials] 核心要点
> - `break`：只跳出**最内层**循环，外层循环继续
> - `continue`：跳到循环的条件判断处，不是循环开头
> - `return`：方法级退出，循环也随之终止
> - `break` 不能用于 `if` 语句（除非 `if` 在循环/switch 里面）
> - `yield return` 不是 `return`，它不退出方法（迭代器专有）
> - 嵌套循环中 `break` 只能跳一层，多层用 `goto` 或标志变量

> [!example] 完整示例
> ```csharp
> // ========== break：找到后立即退出 ==========
> string[] devices = { "PLC-001", "温度变送器", "压力传感器", "变频器" };
> string target = "压力传感器";

> foreach (string device in devices)
> {
>     Console.WriteLine($"  检查 {device}...");
>     if (device == target)
>     {
>         Console.WriteLine($"  ✅ 找到目标设备: {target}");
>         break;  // 找到了，不用再检查后面的
>     }
> }

> // ========== continue：跳过异常数据 ==========
> double[] readings = { 85.5, -999, 92.1, double.NaN, 78.3, -1 };
> int validCount = 0;
> double sum = 0;

> foreach (double reading in readings)
> {
>     if (reading < 0)       // 负数视为传感器故障
>     {
>         Console.WriteLine($"  ⚠ 跳过异常值: {reading}");
>         continue;
>     }
>     if (double.IsNaN(reading))  // NaN 也跳过
>     {
>         Console.WriteLine($"  ⚠ 跳过 NaN");
>         continue;
>     }
    
>     validCount++;
>     sum += reading;
>     Console.WriteLine($"  有效读数 #{validCount}: {reading}℃");
> }

> double average = validCount > 0 ? sum / validCount : 0;
> Console.WriteLine($"\n有效读数 {validCount}/{readings.Length}，平均值: {average:F1}℃");

> // ========== 上位机实战：Modbus 轮询 + break/continue ==========
> ushort[] registerValues = { 0, 0, 85, 0, 0, 62 };
> const int MAX_READS = 6;

> Console.WriteLine("\n开始轮询 Modbus 保持寄存器：");
> for (int regIndex = 0; regIndex < MAX_READS; regIndex++)
> {
>     // 空寄存器跳过（上位机中常见的稀疏地址表）
>     if (registerValues[regIndex] == 0)
>     {
>         Console.WriteLine($"  寄存器[{regIndex}] = 0 (跳过空值)");
>         continue;
>     }
    
>     Console.WriteLine($"  寄存器[{regIndex}] = {registerValues[regIndex]}");
    
>     // 模拟通信中断
>     if (regIndex == 4)  // 假设读到第4个时通信断了
>     {
>         Console.WriteLine("  🔴 通信中断！停止轮询");
>         break;  // 直接退出轮询
>     }
> }

> // ========== return：方法级退出 ==========
> bool ProcessSensorData(double[] data, out string report)
> {
>     report = "";
    
>     if (data == null || data.Length == 0)
>     {
>         report = "数据为空";
>         return false;  // 提前退出，后面的代码不执行
>     }
    
>     double min = double.MaxValue, max = double.MinValue, sum = 0;
>     int validCount = 0;
    
>     foreach (double d in data)
>     {
>         if (double.IsNaN(d)) 
>             continue;  // 跳过无效数据
        
>         if (d < -50 || d > 150)
>         {
>             report = $"传感器故障：读数 {d} 超出正常范围";
>             return false;  // 发现严重异常，整个处理中断
>         }
        
>         validCount++;
>         sum += d;
>         if (d < min) min = d;
>         if (d > max) max = d;
>     }
    
>     if (validCount == 0)
>     {
>         report = "无有效数据";
>         return false;
>     }
    
>     double avg = sum / validCount;
>     report = $"有效{validCount}条 | 平均:{avg:F1} | 最小:{min:F1} | 最大:{max:F1}";
>     return true;
> }

> string result;
> bool ok = ProcessSensorData(readings, out result);
> Console.WriteLine($"\n处理结果: {(ok ? "✅" : "❌")} {result}");

> // ========== 嵌套循环中的 break（只跳一层）==========
> Console.WriteLine("\n设备矩阵扫描：");
> string[] rows = { "A", "B", "C" };
> string[] cols = { "1", "2", "3" };

> for (int r = 0; r < rows.Length; r++)
> {
>     for (int c = 0; c < cols.Length; c++)
>     {
>         if (rows[r] == "B" && cols[c] == "2")
>         {
>             Console.WriteLine($"  发现故障点在 {rows[r]}{cols[c]}，跳过该行剩余位置");
>             break;  // 只跳出内层 for 循环（列），外层行循环继续
>         }
>         Console.WriteLine($"  扫描 {rows[r]}{cols[c]}... OK");
>     }
> }
> ```

> [!scene] 适用场景
> ✅ `break`：搜索/查找第一个匹配项、通信中断停止轮询、异常条件触发停止
> ✅ `continue`：过滤无效数据（NaN/负数/空值）、跳过已处理的元素
> ✅ `return`：守卫子句（方法开头检查参数）、提前退出、错误短路
> ❌ 在 `switch` 之外使用 `break`（只能用于循环或 switch）
> ❌ 滥用 `return` 导致方法有多重出口——适度即可

> [!pitfall] 常见踩坑
> 坑 1：**`break` 只跳一层！** → 嵌套循环中 `break` 只终止内层，外层照样执行。如果要跳出多层，用标志变量：
> ```csharp
> bool found = false;
> for (int i = 0; i < rows; i++) {
>     for (int j = 0; j < cols; j++) {
>         if (match) { found = true; break; }
>     }
>     if (found) break;
> }
> ```
>
> 坑 2：**`continue` 在 `for` 循环中仍会执行迭代器** → 
> ```csharp
> for (int i = 0; i < 10; i++) {
>     if (i == 5) continue;
>     Console.WriteLine(i);
> }
> // i 仍然会 ++，continue 只是跳到 i++ 再判断
> // 输出: 0,1,2,3,4,6,7,8,9 （跳过了5，但循环正常继续）
> ```
>
> 坑 3：**`return` 在 `using`/`try-finally` 块中仍会执行清理** → 这是好事！但新手可能以为 `return` 跳过了 `Dispose()`。实际上 `using` 块的 `finally` 在 `return` 执行前一定会运行。

> [!best] 最佳实践
> - `break` 替代标志变量的常用模式：
>   ```csharp
>   foreach (var dev in devices) {
>       if (dev.Status == "Alarm") { target = dev; break; }
>   }
>   // 比 while + bool found 更简洁
>   ```
> - `continue` 用来扁平化条件嵌套：
>   ```csharp
>   // 不推荐：深层嵌套
>   foreach (var d in data) {
>       if (d != null) {
>           if (d.IsValid) {
>               if (d.Value > 0) { Process(d); }
>           }
>       }
>   }
>   
>   // 推荐：用 continue 扁平化
>   foreach (var d in data) {
>       if (d == null) continue;
>       if (!d.IsValid) continue;
>       if (d.Value <= 0) continue;
>       Process(d);
>   }
>   ```
> - 方法出口尽量控制在 1-2 个，`return` 出现在异常处理中多于结尾——这是"守卫子句"风格的标志
> - 不要用 `goto` 替代多层 `break`，用标志变量或重构为方法更清晰

> [!practice] 上手练习
> **Lv.1 照猫画虎**：在 `for (int i = 1; i <= 10; i++)` 中：i==3 时 `continue`、i==8 时 `break`，观察输出序列
> **Lv.2 小试牛刀**：创建包含正常值、NaN、负数的传感器读数数组，用 `foreach`+`continue` 跳过无效数据，用 `break` 在连续3个无效数据后停止扫描
> **Lv.3 融会贯通**：实现一个"设备搜索并锁定"方法——遍历设备列表，找到第一个满足条件（在线+空闲）的设备后 `break`，然后 `return` 该设备对象；如果遍历完都没找到则 `return null`

> [!related] 相关知识链接
> - ← 前置知识：for 循环、while 循环、foreach 循环
> - → 后续必学：方法定义与返回值（`return` 的核心舞台）
> - → 后续必学：异常处理（`throw` 也是一种"跳转"，但是跨方法层的）
> - ⇄ 关联概念：`goto` 语句（C# 保留了它，但几乎只在 switch 的 case 间跳转）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/jump-statements