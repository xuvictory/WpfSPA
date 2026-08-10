---
title: StringBuilder（字符串构建器）
section: 00-prelude
parent: 字符串操作
---

# StringBuilder（字符串构建器）

> [!plain] 白话理解
> 如果你要写 10000 行设备日志，用 `+=` 拼接字符串等于在每个字后面都换一张新纸——写完 10000 个字，你擦了 9999 次桌子（创建了 9999 个临时对象）。`StringBuilder` 是一个"活页本"——在里面写多少行都不创建新本子，最后一把撕下来（`ToString()`）就是完整内容。在上位机中，连续采集几万条数据然后导出一份报告、拼接一个巨大的 JSON 文件、逐行生成 G-code 数控代码——这些场景离开 `StringBuilder` 就等着程序卡死。

> [!def] 官方定义
> `System.Text.StringBuilder` 是一个**可变的字符串**类，用于高效地执行大量字符串拼接操作。它在内部维护一个字符缓冲区（char array），当容量不足时自动扩容（通常翻倍）。主要方法：
> - `Append(...)`：追加任意类型的文本（有重载支持 int、double、string 等）
> - `AppendLine(...)`：追加一行并加换行符
> - `AppendFormat(...)`：追加格式化字符串
> - `Insert(index, ...)`：在指定位置插入文本
> - `Replace(old, new)`：就地替换字符/字符串
> - `Remove(start, len)`：删除指定范围
> - `ToString()`：输出最终的不可变 string
> - `Clear()`：清空（从 .NET 2.0 开始推荐替代设置 `Length = 0`）

> [!origin] 由来背景
> `StringBuilder` 来自 Java（`java.lang.StringBuilder`，JDK 1.5，2004年），但 .NET 自 1.0 就有它了（`System.Text.StringBuilder`，2002年）——比 Java 还早。它的设计思想源自"字符串的不可变性是有代价的"这一认识。实现原理是预先分配一块比所需更大的内存（默认16字符），每次追加到不满就不扩容。扩容时翻倍容量并复制现有内容（类似 `List<T>` 的策略）。在上位机中，如果你要拼接一个百万行的 CSV 导出文件，`StringBuilder` 和 `+` 的性能差距可能是 100 倍以上。

> [!essentials] 核心要点
> - 和 `string` 的根本区别：`StringBuilder` 是**可变**的，`string` 不可变
> - 默认容量 16 字符，超出自动扩容（翻倍）
> - `Append()` 返回 `this`，可以链式调用
> - `AppendLine()` 追加的换行符是 `Environment.NewLine`
> - 预估容量用构造函数 `new StringBuilder(estimatedCapacity)` 避免频繁扩容
> - 对少量（<10次）拼接，`$""` 插值比 `StringBuilder` 更简洁且性能差异可忽略
> - `Clear()` 只是重置内部指针，不释放内存——适合重用

> [!example] 完整示例
> ```csharp
> using System.Text;

> // ========== 基本用法 ==========
> var sb = new StringBuilder();
> sb.Append("设备: ");
> sb.Append("PLC-001");
> sb.Append(", 温度: ");
> sb.Append(85.5);
> sb.Append("℃");
> Console.WriteLine(sb.ToString());  // 设备: PLC-001, 温度: 85.5℃

> // ========== 链式调用（推荐）==========
> var sb2 = new StringBuilder()
>     .Append("设备状态报告")
>     .AppendLine()
>     .Append(new string('-', 30))
>     .AppendLine()
>     .Append("温度: ").Append(85.5).AppendLine("℃")
>     .Append("压力: ").Append(2.1).AppendLine("MPa")
>     .Append("状态: ").Append("运行正常");
> Console.WriteLine(sb2.ToString());

> // ========== 上位机实战：生成 CSV 导出文件 ==========
> // 模拟 10000 条传感器数据导出
> var csv = new StringBuilder();
> csv.AppendLine("时间戳,设备编号,温度(℃),湿度(%),压力(MPa),状态");

> var random = new Random(42);
> DateTime baseTime = DateTime.Now;

> for (int i = 0; i < 10; i++)  // 示例只跑10条，实际可能是10万条
> {
>     DateTime t = baseTime.AddSeconds(i);
>     string device = $"PLC-{i % 5:D3}";
>     double temp = 20 + random.NextDouble() * 40;
>     double humidity = 40 + random.NextDouble() * 40;
>     double pressure = 0.5 + random.NextDouble() * 2.0;
>     string status = temp > 80 ? "告警" : "正常";
    
>     csv.Append(t.ToString("HH:mm:ss")).Append(',')
>        .Append(device).Append(',')
>        .Append(temp.ToString("F1")).Append(',')
>        .Append(humidity.ToString("F1")).Append(',')
>        .Append(pressure.ToString("F2")).Append(',')
>        .AppendLine(status);
> }

> Console.WriteLine($"\nCSV 报告前 3 行:");
> string[] csvLines = csv.ToString().Split(Environment.NewLine);
> for (int i = 0; i < Math.Min(4, csvLines.Length); i++)
>     Console.WriteLine($"  {csvLines[i]}");

> // ========== 构建 JSON（简单场景）==========
> var json = new StringBuilder();
> json.AppendLine("{");
> json.AppendLine("  \"deviceId\": \"PLC-001\",");
> json.AppendLine("  \"sensors\": [");
> json.AppendLine("    { \"type\": \"temperature\", \"value\": 85.5 },");
> json.AppendLine("    { \"type\": \"humidity\", \"value\": 62.3 }");
> json.AppendLine("  ]");
> json.AppendLine("}");
> Console.WriteLine($"\n{json}");

> // ========== AppendFormat：格式化追加 ==========
> var log = new StringBuilder();
> string[] levels = { "INFO", "WARNING", "ERROR" };
> string[] messages = { "系统启动", "温度偏高", "通信中断" };

> for (int i = 0; i < levels.Length; i++)
> {
>     log.AppendFormat("[{0:HH:mm:ss}] [{1}] {2}",
>         DateTime.Now.AddMinutes(i), levels[i], messages[i]);
>     log.AppendLine();
> }
> Console.WriteLine($"\n{log}");

> // ========== 预分配容量：避免多次扩容 ==========
> // 知道大概要拼 10000 个字符，直接给容量
> var sb3 = new StringBuilder(10000);  // 一次分配到位
> for (int i = 0; i < 1000; i++)
>     sb3.Append(i).Append(',');
> Console.WriteLine($"\n构建了 {sb3.Length} 字符的字符串");

> // ========== Clear 重用 ==========
> sb.Clear();
> sb.Append("复用同一个 StringBuilder 实例");
> Console.WriteLine($"\n清空后重建: {sb}，容量保留: {sb.Capacity}");
> ```

> [!scene] 适用场景
> ✅ 循环中大量拼接字符串（>10 次操作）
> ✅ 生成导出文件（CSV、JSON、XML 等文本格式）
> ✅ 构建大块文本内容（邮件正文、报告、日志缓冲区）
> ✅ 协议命令帧的逐字节构造
> ✅ 拼接 SQL 语句（参数化查询前的模板构建阶段）
> ❌ 简单 2~3 个字符串合并 → `$""` 插值更简洁
> ❌ `StringBuilder` 本身不是线程安全的 ← 多线程场景需加锁或不用

> [!pitfall] 常见踩坑
> 坑 1：**`Append` + 加号 + 插值 vs 链式 `Append` 混用** → 
> ```csharp
> sb.Append("temp: " + temp + "℃");  // 内部还是创建了多个临时 string
> sb.AppendFormat("temp: {0}℃", temp); // 稍好但仍有一次内部 Format
> sb.Append("temp: ").Append(temp).Append("℃"); // ✅ 真正零临时对象
> ```
>
> 坑 2：**无穷增长不清空** → 如果你在循环外用了一个 `StringBuilder` 对象长期追加从不 Clear，内存会一直涨。对于一个长久运行的采集程序，每次 `ToString()` 后应该 `Clear()`。
>
> 坑 3：**`StringBuilder` 的 `Replace` 性能不一定好** → 如果你只做少量替换，`string.Replace` 反而更快。`StringBuilder.Replace` 会对整个缓冲区做 O(n) 扫描。

> [!best] 最佳实践
> - 预知大致长度时在构造函数中给容量：`new StringBuilder(estimatedLength)`
> - 用链式 `.Append()` 替代 `+` 和 `string.Format`
> - 一个 `StringBuilder` 实例在生命周期内可以多次 `Clear()` 重用
> - 对于只需要一次性输出的场景，结束后用 `sb.ToString()` 获取结果
> - 上位机日志缓冲区可以考虑用 1 个全局 `StringBuilder` + lock，定期刷盘后 Clear
> - 量级 < 10 次拼接 → 直接用 `$""`；> 10 次 → 切 `StringBuilder`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 `StringBuilder` 生成 1~100 的数字序列，逗号分隔，最后打印结果的前 50 个字符
> **Lv.2 小试牛刀**：模拟一个数据记录器——每秒产生一条传感器记录（时间+温度+湿度+压力），用 `StringBuilder` 追加 100 条，最后 `ToString()` 输出为 CSV 格式，并统计用了多少毫秒
> **Lv.3 融会贯通**：实现一个环形日志缓冲区类：内部用 `StringBuilder` 存储，最多保留 500 行日志；超过 500 行时用 `Remove` 删除最旧的行；提供 `GetRecent(n)` 取最近 n 行，`FlushToFile()` 刷盘

> [!related] 相关知识链接
> - ← 前置知识：字符串拼接与格式化（StringBuilder 是大量拼接的性能优化方案）
> - ⇄ 关联概念：`string.Join`（数组元素组合时比 StringBuilder 更简洁）
> - ⇄ 关联概念：`File.AppendAllText`（把 StringBuilder 内容写入文件）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.text.stringbuilder
