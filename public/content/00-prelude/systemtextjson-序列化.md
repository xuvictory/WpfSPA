---
title: System.Text.Json
section: 00-prelude
parent: JSON 序列化
---

# System.Text.Json

> [!plain] 白话理解
> `System.Text.Json`（STJ）是微软在 .NET Core 3.0 推出的"亲儿子"JSON 库，内置于运行时、零依赖、比 Newtonsoft 更快。如果 Newtonsoft 是第三方高手，STJ 就是国家队——性能和安全性更好，但 API 风格更严格、功能覆盖不如 Newtonsoft 全面。新项目优先上 STJ，遇到 STJ 不支持的特性再切 Newtonsoft。

> [!def] 官方定义
> `System.Text.Json` 是 .NET 内置的高性能 JSON 序列化框架。核心类 `JsonSerializer`：
> - `Serialize(obj)` / `Deserialize<T>(json)`
> - 默认严格区分大小写
> - 默认不处理循环引用
> - 通过 `JsonSerializerOptions` 配置

> [!origin] 由来背景
> Newtonsoft.Json 统治 .NET 生态十余年，但它诞生于 .NET Framework 时代，内部大量使用反射与正则，内存分配多，对高吞吐场景力不从心。.NET Core 3.0 发布时，微软基于 `Span<T>` 重写了一套零反射、无正则的 JSON 库——`System.Text.Json`（STJ），并内置进运行时：序列化速度快数倍、内存占用更低，从 .NET Core 3.0 起成为官方默认选择。上位机里每 100ms 上报一次的 JSON 数据，用 STJ 序列化的性能优势非常明显。

> [!essentials] 核心要点
> - `JsonSerializer.Serialize(obj, options)` / `Deserialize<T>(json, options)`
> - 默认区分大小写；`PropertyNameCaseInsensitive = true` 可放宽
> - 默认会序列化 null 字段；`DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull` 忽略
> - `PropertyNamingPolicy = JsonNamingPolicy.CamelCase`：属性名转驼峰（对接 Web API 惯例）
> - `[JsonPropertyName("...")]`：属性名显式映射
> - `JsonSerializerOptions` 必须单例复用（每次 new 都会重建元数据缓存，性能下降数倍）

> [!example] 完整示例
> ```csharp
> using System.Text.Json;

> var config = new { Ip = "192.168.1.100", Port = 502 };

> // 序列化
> var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
> string json = JsonSerializer.Serialize(config, options);
> Console.WriteLine(json);

> // 反序列化
> var loaded = JsonSerializer.Deserialize<DeviceConfig>(json);
> Console.WriteLine($"还原: {loaded!.Ip}:{loaded.Port}");

> public class DeviceConfig
> {
>     public string Ip { get; set; } = "";
>     public int Port { get; set; }
> }
> ```

> [!scene] 适用场景
> ✅ .NET Core/5+ 新项目默认选择
> ✅ 性能敏感场景（比 Newtonsoft 快 1.5~3倍）

> [!pitfall] 常见踩坑
> 坑 1：**频繁 new `JsonSerializerOptions`** → 每个实例都要重建反射元数据，序列化性能暴跌数倍。定义为静态只读单例复用。
> 坑 2：**大小写不匹配返回默认值** → STJ 默认区分大小写，Web API 传 `ip`、模型叫 `Ip` 时静默匹配失败。加 `PropertyNameCaseInsensitive = true` 或 `[JsonPropertyName]`。
> 坑 3：**null 被序列化成 `null`** → 默认会写 null 字段，对接方解析失败。`DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull` 忽略空值。
> 坑 4：**循环引用直接抛异常** → 模型互相引用时默认抛 `JsonException`。用 `ReferenceHandler.IgnoreCycles` 或在模型层断开。

> [!best] 最佳实践
> - 新项目首选 STJ
> - `PropertyNamingPolicy = CamelCase` 适配 Web API
> - `JsonSerializerOptions` 单例复用

> [!practice] 上手练习
> **Lv.1**：STJ 基本序列化
> **Lv.2**：配置 STJ 选项（驼峰/忽略null/缩进）

> [!related] 相关知识链接
> - ← Newtonsoft.Json
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/standard/serialization/system-text-json
