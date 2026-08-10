---
title: JSON 配置文件的读写实战
section: 00-prelude
parent: JSON 序列化
---

# JSON 配置文件的读写实战

> [!plain] 白话理解
> 上位机软件一定需要配置文件——设备列表、通信参数、告警阈值总不能写死在代码里吧？JSON 是配置文件的最佳格式。流程就是：程序启动 → 读 `appconfig.json` → 反序列化为 C# 对象 → 程序用这些配置运行。用户改了 JSON 文件 → 程序重启后新的配置就生效了。

> [!example] 完整示例
> ```csharp
> using System.Text.Json;

> public class AppConfig
> {
>     public string AppName { get; set; } = "上位机监控";
>     public CommunicationConfig Communication { get; set; } = new();
>     public List<DeviceEntry> Devices { get; set; } = new();
>     public AlarmConfig Alarms { get; set; } = new();
> }
> public class CommunicationConfig { public int TimeoutMs { get; set; } = 3000; public int RetryCount { get; set; } = 3; }
> public class DeviceEntry { public string Id { get; set; } = ""; public string Ip { get; set; } = ""; public int Port { get; set; } = 502; }
> public class AlarmConfig { public double TemperatureHigh { get; set; } = 80; public double PressureHigh { get; set; } = 2.0; }

> public class ConfigManager
> {
>     private static readonly string ConfigPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appconfig.json");
    
>     public static AppConfig Load()
>     {
>         if (!File.Exists(ConfigPath))
>         {
>             var defaults = new AppConfig
>             {
>                 Devices = { new() { Id = "PLC-001", Ip = "192.168.1.100" } }
>             };
>             Save(defaults);
>             return defaults;
>         }
>         string json = File.ReadAllText(ConfigPath);
>         return JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
>     }
    
>     public static void Save(AppConfig config)
>     {
>         var options = new JsonSerializerOptions { WriteIndented = true };
>         string json = JsonSerializer.Serialize(config, options);
>         File.WriteAllText(ConfigPath, json);
>     }
> }

> // 使用
> var config = ConfigManager.Load();
> Console.WriteLine($"应用: {config.AppName}, 设备数: {config.Devices.Count}");
> config.Devices.Add(new() { Id = "PLC-002", Ip = "192.168.1.101" });
> ConfigManager.Save(config);
> ```

> [!best] 最佳实践
> - 第一次运行时自动生成默认配置文件
> - JSON 放执行文件同目录，方便现场修改
> - 配置改动后提供"重载"按钮（管理权限）

> [!practice] 上手练习
> **Lv.1**：保存/加载简单配置
> **Lv.2**：实现完整上位机配置管理器（含默认值生成）
> **Lv.3**：实现配置加密（敏感字段如密码）

> [!related] 相关知识链接
> - ← Newtonsoft、System.Text.Json
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/configuration
