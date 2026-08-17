---
title: DTO vs Entity
section: 07-mvvm
parent: 7.2 Model 层
---

# DTO vs Entity

> [!plain] 白话理解
> 设备详情页要展示温度，但底层数据里除了温度还有"是否已校准、通道号、原始码值"这些内部信息——直接全给界面，界面看到了不该看的，还可能被误改。
> Entity（实体）是"底层世界的完整档案"：数据库/PLC 里有什么字段它都有；DTO（数据传输对象）是"给界面/网络看的对外名片"：只挑该展示的字段，还帮你格式化好（"125.3 ℃"、"超限，请检查"）。**Entity 管"全"，DTO 管"给"**——界面永不接触内部实现，改内部结构时接口层不受影响。

> [!def] 官方定义
> 两者都是数据载体，职责不同：
> - **Entity（实体/领域模型）**：与业务/存储结构一一对应的对象（数据库表、PLC 寄存器映射），包含完整字段与领域规则（如 `IsCalibrated`、换算方法），**不面向界面**；
> - **DTO（Data Transfer Object，数据传输对象）**：为跨层传输（数据库→界面、进程间通信、API 请求/响应）定制的对象，只含传输所需字段，通常**不可变、无业务方法**，序列化友好。
> 二者的核心矛盾：Entity 变更频繁（随存储/业务演进），DTO 需保持稳定（对外契约）。因此由 Entity → DTO 的**映射**（手工方法、AutoMapper、record `with` 表达式）是常见配套工程。
> 参考：https://martinfowler.com/bliki/LocalDTO.html（Fowler 提醒：本地进程内直接传领域对象即可，DTO 主要用于跨边界传输）

> [!origin] 由来背景
> 企业应用常出现"接口泄漏"问题：数据库表 20 个字段，界面根本用不到的内部标志、审计字段全部暴露给前端，改动内部结构就牵连界面，序列化还会把敏感字段一起发出去。Sun 的 Java 蓝图文档和 Martin Fowler 的"LocalDTO"讨论先后提出：**跨进程/跨层边界时，应该用专门的对象传输所需数据**。分布式系统（Web API、微服务）把 DTO 变成标配后，桌面端也吸收了这个理念——上位机对接 WebAPI、MQTT 报文时，Entity 管领域、DTO 管传输的分离，让"换协议、换数据库"都只动边界层。

> [!essentials] 核心要点
> - **Entity 是"全量档案"**：与数据库/PLC 映射，可含内部字段（`IsCalibrated`）、业务方法与领域规则
> - **DTO 是"对外名片"**：只含传输/展示所需字段，通常 `get;` 只读或 `record` 不可变，无业务逻辑
> - **方向唯一**：Entity → DTO 单向映射（示例的 `MapToDto`）；反向（DTO → Entity）仅出现在写入场景，同样集中在映射层
> - **映射点收敛**：手工映射方法、AutoMapper 配置或 record `with` 表达式，避免散落各处
> - **边界判断**：同进程内纯展示可退化为"ViewModel 直接包装 Entity"，跨进程/API/序列化则必须 DTO

> [!example] 完整示例
> **DTO vs Entity 演示：Entity 承载数据库/PLC 的完整字段（含内部标志），DTO 只暴露界面与传输所需的字段。从 Entity 到 DTO 用映射方法转换，避免把内部字段泄露给 UI：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DTO vs Entity" Height="360" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="温度采集（Entity → DTO）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="原始值（Entity）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <TextBlock Text="{Binding RawText}" Foreground="#8B949E" FontFamily="Consolas"/>
>         <TextBlock Text="界面展示（DTO）" Foreground="#8B949E" Margin="0,12,0,4"/>
>         <TextBlock Text="{Binding DisplayText}" Foreground="White" FontSize="20" FontWeight="Bold"/>
>         <TextBlock Text="{Binding SafeText}" Foreground="#238636" Margin="0,4,0,15"/>
>         <Button Content="模拟采集一次" Command="{Binding CollectCommand}" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— Entity、DTO 与映射：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // Entity：领域实体，字段与数据库/PLC 对应，可含仅内部使用的字段
>     public class TemperatureEntity
>     {
>         public int Channel { get; set; }          // 通道号
>         public double RawValue { get; set; }      // 原始数值（例如热电偶原始值）
>         public bool IsCalibrated { get; set; }    // 内部标志：是否已校准
>         public DateTime ReadTime { get; set; }    // 采集时间
>     }
>
>     // DTO：传输对象，只含界面需要展示的字段，隐藏内部实现细节
>     public class TemperatureDto
>     {
>         public string ChannelText { get; set; }   // "通道 03"
>         public string ValueText { get; set; }     // "125.3 ℃"
>         public string SafeText { get; set; }      // "温度正常" / "超限"
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private string _rawText = "（尚未采集）";
>         private string _displayText = "—";
>         private string _safeText = "等待采集";
>
>         public string RawText { get; private set; }
>         public string DisplayText { get; private set; }
>         public string SafeText { get; private set; }
>         public ICommand CollectCommand { get; }
>
>         public MainViewModel() => CollectCommand = new RelayCommand(Collect);
>
>         private void Collect()
>         {
>             // 1. 从采集层拿到 Entity
>             var entity = new TemperatureEntity
>             {
>                 Channel = 3,
>                 RawValue = 90 + new Random().NextDouble() * 60,
>                 IsCalibrated = true,
>                 ReadTime = DateTime.Now
>             };
>
>             // 2. 映射为 DTO，只把需要的字段交给界面
>             var dto = MapToDto(entity);
>             RawText = "通道=" + entity.Channel + " 原始值=" + entity.RawValue.ToString("F2")
>                       + " 已校准=" + entity.IsCalibrated;
>             DisplayText = dto.ValueText;
>             SafeText = dto.SafeText;
>             OnPropertyChanged(nameof(RawText));
>             OnPropertyChanged(nameof(DisplayText));
>             OnPropertyChanged(nameof(SafeText));
>         }
>
>         // 实体 → 传输对象 的映射逻辑（生产环境可用 AutoMapper）
>         private TemperatureDto MapToDto(TemperatureEntity e)
>         {
>             var value = Math.Round(e.RawValue, 1);
>             return new TemperatureDto
>             {
>                 ChannelText = "通道 " + e.Channel.ToString("00"),
>                 ValueText = value + " ℃",
>                 SafeText = value > 130 ? "超限，请检查" : "温度正常"
>             };
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     public class RelayCommand : ICommand
>     {
>         private readonly Action _execute;
>         public RelayCommand(Action execute) => _execute = execute;
>         public bool CanExecute(object parameter) => true;
>         public void Execute(object parameter) => _execute();
>         public event EventHandler CanExecuteChanged;
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = new MainViewModel();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 对接 WebAPI/MQTT：序列化发出去的对象必须是 DTO，避免把 Entity 内部字段（连接状态、缓冲）泄给外部
> ✅ 数据库字段含内部标志：`IsCalibrated`、`SyncFlag` 等界面不需要的字段，用 DTO 屏蔽
> ✅ 界面展示需要格式化：原始值 + 单位 + 报警判定统一由 DTO/ViewModel 加工，Entity 保持裸数据
> ✅ 多端复用（上位机/报表/移动端）：各端定义自己的 DTO，映射各自需要的数据子集
> ❌ 纯本地、无序列化的简单展示：ViewModel 直接绑 Entity 属性即可，硬加 DTO 只是样板
> ❌ 界面编辑实体场景（DataGrid 直接编辑）：此时 ViewModel 需可写包装属性，DTO 不可变反而不便

> [!pitfall] 常见踩坑
> 坑 1：**拿 Entity 直接序列化发给 API** → `IsCalibrated`、连接缓冲等内部字段一并暴露，还可能因循环引用序列化失败。对外一律用 DTO
>
> 坑 2：**DTO 属性名与字段用缩写** → `v`、`t`、`f` 这种名字在跨团队/跨语言对接时无人能懂。DTO 是契约，命名要完整明确（`MaxTemp`、`DeviceId`）
>
> 坑 3：**映射逻辑散落** → 10 个地方各自手写 `new Dto { ValueText = ... }`，Entity 加个字段改 10 处。收敛到 `MapToDto` 或 AutoMapper Profile
>
> 坑 4：**把 DTO 当 ViewModel 用** → DTO 没有 INPC、没有命令，直接绑界面改不了、刷不了。界面仍要 ViewModel 包装 DTO，DTO 只负责传输
>
> 坑 5：**无视 Fowler 的忠告** → 本地进程内（同 AppDomain）给每层都建 DTO 属于过度设计，层间直接传领域对象即可

> [!best] 最佳实践
> - 用 C# 9 `record` 定义 DTO（`record TemperatureDto(string ChannelText, string ValueText, string SafeText)`），不可变 + 值相等，序列化/测试都省心
> - 项目引入 AutoMapper 时，把映射配置放 `Profiles/` 目录并写单元测试验证字段齐全，防止"忘了映射新字段"
> - DTO 命名区分用途：`TemperatureDto`、`AlarmRecordDto`，避免 `DataModel`、`Info` 这类万能名
> - 需要批量映射时用 `Select(MapToDto)`（LINQ），避免手写循环（见示例可直接扩展）
> - 给 Entity→DTO 映射写测试：构造已知 Entity，断言 DTO 每个字段符合预期——这是防"字段漂移"的保险

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，多次点击"模拟采集一次"，观察 RawText（Entity 裸数据）与 DisplayText（DTO 格式化）的差异
> **Lv.2 小试牛刀**：给 `TemperatureEntity` 加 `SensorId`（传感器编号），DTO 增加 `SensorText`，映射里格式化后展示
> **Lv.3 融会贯通**：把 DTO 改成 `record TemperatureDto(...)`，用 `with` 表达式在映射里生成新实例，验证不可变性
> **Lv.4 挑战**：写一条映射单元测试——给定 `TemperatureEntity { RawValue = 135 }`，断言 `MapToDto` 返回 `SafeText == "超限，请检查"`，验证映射逻辑脱离界面可测

> [!related] 相关知识链接
> - ← 前置知识：「数据实体定义」理解 Entity 的定位；「数据访问repository-模式」看 Entity 从何而来
> - → 后续必学：7.3「datacontext-绑定到-viewmodel」「纯-xaml-展示」看 DTO/VM 如何被界面消费
> - ⇄ 关联概念：「inotifypropertychanged-实现」注意 DTO 不可变与界面可观察属性的边界；「viewmodel-间的通信」看 DTO 在多 VM 间流转
> - 📖 参考：Martin Fowler《LocalDTO》https://martinfowler.com/bliki/LocalDTO.html
