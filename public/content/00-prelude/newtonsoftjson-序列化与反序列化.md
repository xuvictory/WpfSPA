---
title: JSON 序列化与反序列化（Newtonsoft.Json）
section: 00-prelude
parent: JSON 序列化
---

# JSON 序列化与反序列化（Newtonsoft.Json）

> [!plain] 白话理解
> JSON 序列化就是把 C# 对象变成字符串（方便存文件、发网络），反序列化就是把字符串变回对象。比如你有一个 `DeviceConfig` 对象，调用 `JsonConvert.SerializeObject(config)` 就能得到 `{"ip":"192.168.1.100","port":502}` 这样的 JSON 字符串——保存到 `config.json`，下次程序启动读回来，`JsonConvert.DeserializeObject<DeviceConfig>(json)` 还原成对象。Newtonsoft.Json（NuGet: `Newtonsoft.Json`，俗称 Json.NET）是 .NET 生态中事实标准的 JSON 库。

> [!def] 官方定义
> Json.NET 是高性能的 .NET JSON 框架。核心类 `JsonConvert` 提供：
> - `SerializeObject(obj)`：对象 → JSON 字符串
> - `DeserializeObject<T>(json)`：JSON 字符串 → 强类型对象
> - `JObject`：动态解析 JSON（不建类也能访问）

> [!origin] 由来背景
> 2007 年前后 .NET 只有 `DataContractJsonSerializer` 和 `JavaScriptSerializer`，要么配置繁琐、要么性能差，JSON 生态一片荒芜。James Newton-King 开源了 Json.NET（Newtonsoft.Json），凭"功能全、速度快、上手简单"横扫社区，多年霸占 NuGet 下载量榜首，连 ASP.NET 官方默认序列化器都是它。上位机对接 WebAPI、保存设备参数时，`JsonConvert.SerializeObject` 一句就完成，成了老项目的标配——直到 .NET Core 3.0 微软才用 System.Text.Json 收复失地。

> [!essentials] 核心要点
> - `JsonConvert.SerializeObject(obj, Formatting.Indented)`：对象 → 可读 JSON 字符串
> - `JsonConvert.DeserializeObject<T>(json)`：JSON 字符串 → 强类型对象
> - `[JsonProperty("name")]`：属性名映射（对接外部字段命名不一致时必备）
> - `[JsonIgnore]`：排除属性（密码、运行时缓存等）
> - `JObject`/`dynamic`：不建类也能动态读取 JSON
> - `JsonSerializerSettings`：统一配置日期格式（`DateFormatString`）、空值忽略（`NullValueHandling.Ignore`）等

> [!example] 完整示例
> ```csharp
> using Newtonsoft.Json;

> public class DeviceConfig
> {
>     public string Ip { get; set; } = "192.168.1.100";
>     public int Port { get; set; } = 502;
>     public List<string> Sensors { get; set; } = new() { "TEMP-01" };
> }

> // 序列化
> var config = new DeviceConfig();
> string json = JsonConvert.SerializeObject(config, Formatting.Indented);
> Console.WriteLine(json);
> File.WriteAllText("config.json", json);

> // 反序列化
> string read = File.ReadAllText("config.json");
> var loaded = JsonConvert.DeserializeObject<DeviceConfig>(read);
> Console.WriteLine($"IP: {loaded!.Ip}, 端口: {loaded.Port}");

> // 动态解析（不建类）
> string raw = @"{""temperature"":85.5,""alarms"":[""高温"",""高压""]}";
> dynamic dyn = JsonConvert.DeserializeObject(raw)!;
> Console.WriteLine($"温度: {dyn.temperature}℃, 告警数: {dyn.alarms.Count}");
> ```

> [!scene] 适用场景
> ✅ 配置文件（appsettings 的替代/补充）、设备参数保存、网络API

> [!pitfall] 常见踩坑
> 坑 1：**循环引用死循环** → 对象互相引用（设备↔通道）直接序列化抛 `JsonSerializationException`。用 `ReferenceLoopHandling.Ignore` 或在模型层 `[JsonIgnore]` 断开。
> 坑 2：**属性名不匹配** → 反序列化找不到对应属性就跳过，结果全是默认值。用 `[JsonProperty("name")]` 精确映射。
> 坑 3：**DateTime 格式混乱** → 默认 ISO8601，老系统对接要配 `DateFormatString = "yyyy-MM-dd HH:mm:ss"`。
> 坑 4：**反序列化返回 null 不报错** → 用 `??` 兜底并记录日志，别让 null 一路传播到 UI 崩溃。

> [!best] 最佳实践
> - 使用 `[JsonProperty("name")]` 映射不同命名
> - 用 `Formatting.Indented` 让配置文件可读
> - `JsonSerializerSettings` 统一配置日期格式、null 处理

> [!practice] 上手练习
> **Lv.1**：序列化和反序列化一个配置对象
> **Lv.2**：保存和加载设备列表
> **Lv.3**：实现配置管理单例模式

> [!related] 相关知识链接
> - → System.Text.Json
> - 📖 官方文档：https://www.newtonsoft.com/json/help
