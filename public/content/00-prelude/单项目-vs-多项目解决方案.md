---
title: 单项目 vs 多项目解决方案
section: 00-prelude
parent: 解决方案结构
---

# 单项目 vs 多项目解决方案

> [!plain] 白话理解
> 单项目就是「一个人住单间」——所有代码（界面、逻辑、数据、通讯）塞在一个项目里，简单省事但容易乱。多项目解决方案就是把代码拆成「多个房间」——界面放 WPF 项目、数据模型放类库项目、通讯协议放另一个类库、单元测试放测试项目。这样做的好处是代码更清晰、可以复用（这个项目的通讯库给另一个上位机直接用）、每个项目职责单一。刚开始就一个项目完全没问题，等代码涨到几千行再拆也来得及。

> [!def] 官方定义
> 解决方案（Solution，`.sln` 文件）是 VS 中管理和组织多个项目的容器。一个解决方案可以包含多个项目（Project），每个项目编译后生成一个程序集（`.exe` 或 `.dll`）。单项目方案只包含一个主项目；多项目方案将一个大型应用拆分为多个项目，通过项目引用（Project Reference）建立依赖关系。解决方案配置定义了各项目的编译顺序和条件。

> [!origin] 由来背景
> VS 从诞生之初就引入了「解决方案」概念（最早叫 Workspace）。但最初大部分应用是小型的，一个 .exe 打天下。随着企业软件开发复杂度上升，特别是 SOA / 微服务思想的影响，多项目方案成了标配。上位机开发中这个趋势也很明显：早年一个 Form1.cs 从设备通讯写到界面展示，现在规范的工程会把通讯协议层（如 Modbus、OPC UA 客户端）独立成库，方便多个上位机项目共用。

> [!essentials] 核心要点

> **单项目 vs 多项目对比**：

> | 维度 | 单项目 | 多项目 |
> |------|--------|--------|
> | 复杂度 | 简单，一把梭 | 需要理解项目引用和依赖 |
> | 编译速度 | 快（只编译一个） | 慢一点（逐个编译） |
> | 代码复用 | 复制粘贴 | 引用类库 DLL |
> | 职责划分 | 所有代码混在一起 | 界面/逻辑/数据分离 |
> | 适合规模 | 小型工具（< 20 个文件） | 中大型系统（> 50 个文件） |
> | 团队协作 | 难以并行开发 | 各人负责不同项目 |

> **上位机多项目方案的经典拆分**：

> ```
> PlcMonitor.sln
> ├── PlcMonitor.App          ← WPF 项目（界面，.exe）
> │   └── 引用 ↓
> ├── PlcMonitor.ViewModels   ← 类库（MVVM 视图模型，.dll）
> │   └── 引用 ↓
> ├── PlcMonitor.Models       ← 类库（数据模型，.dll）
> ├── PlcMonitor.Services     ← 类库（业务服务/通讯，.dll）
> │   └── 引用 ↓
> ├── PlcMonitor.Protocols    ← 类库（Modbus/OPC 协议实现，.dll）
> └── PlcMonitor.Tests        ← 测试项目（单元测试，.dll）
> ```

> [!example] 完整示例
>
> **创建多项目解决方案的步骤（VS 操作）**：
>
> 1. 创建空白解决方案：`dotnet new sln -n PlcMonitor`
> 2. 创建各个项目：
> ```bash
> dotnet new wpf -n PlcMonitor.App -o src/PlcMonitor.App
> dotnet new classlib -n PlcMonitor.Models -o src/PlcMonitor.Models
> dotnet new classlib -n PlcMonitor.Services -o src/PlcMonitor.Services
> ```
> 3. 把项目加入解决方案：
> ```bash
> dotnet sln add src/PlcMonitor.App
> dotnet sln add src/PlcMonitor.Models
> dotnet sln add src/PlcMonitor.Services
> ```
> 4. 添加项目引用（App 依赖 Services，Services 依赖 Models）：
> ```bash
> dotnet add src/PlcMonitor.Services reference src/PlcMonitor.Models
> dotnet add src/PlcMonitor.App reference src/PlcMonitor.Services
> dotnet add src/PlcMonitor.App reference src/PlcMonitor.Models
> ```
>
> **项目引用关系图**：
> ```
> PlcMonitor.App (exe)
>      ├──→ PlcMonitor.Services (dll)
>      │         └──→ PlcMonitor.Models (dll)
>      └──→ PlcMonitor.Models (dll)
> ```
>
> ```csharp
> // Models/DeviceStatus.cs — 纯数据模型，不依赖任何其他项目
> namespace PlcMonitor.Models
> {
>     public class DeviceStatus
>     {
>         public string DeviceName { get; set; }
>         public bool IsConnected { get; set; }
>         public double Temperature { get; set; }
>         public int Pressure { get; set; }
>     }
> }
> ```
>
> ```csharp
> // Services/PlcService.cs — 引用 Models 项目
> using PlcMonitor.Models;
> 
> namespace PlcMonitor.Services
> {
>     public class PlcService
>     {
>         public DeviceStatus ReadStatus(string deviceName)
>         {
>             // 模拟从 PLC 读取数据
>             return new DeviceStatus
>             {
>                 DeviceName = deviceName,
>                 IsConnected = true,
>                 Temperature = 36.5,
>                 Pressure = 101
>             };
>         }
>     }
> }
> ```
>
> ```csharp
> // App 项目的 MainWindow.xaml.cs — 引用 Services 和 Models
> using PlcMonitor.Models;
> using PlcMonitor.Services;
> 
> namespace PlcMonitor.App
> {
>     public partial class MainWindow
>     {
>         private PlcService _plcService = new PlcService();
>         
>         private void BtnRead_Click(object sender, RoutedEventArgs e)
>         {
>             DeviceStatus status = _plcService.ReadStatus("PLC-01");
>             TxtTemp.Text = $"{status.Temperature} ℃";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 中大型上位机：界面、通讯、数据、日志清晰分层
> ✅ 多产品线共享：公司有 5 个上位机项目，Modbus 通讯库提取成独立类库，一次开发五处使用
> ✅ 团队协作：A 写 UI、B 写通讯层，各自在自己的项目里工作不互相阻塞
> ✅ 单元测试：独立测试项目引用业务层，不依赖 WPF 界面
> ❌ 小工具（如串口调试助手）——单项目足矣，拆太散反而增加维护成本
> ❌ 原型验证——快速验证想法时别花时间拆项目

> [!pitfall] 常见踩坑
> 坑 1：**添加了项目引用但代码里 still 报找不到类型** → 项目引用只是建立了编译时依赖，你还要在代码文件顶部加 `using` 语句。另外检查引用的项目的 TargetFramework 是否兼容——不能把一个 net8.0 的项目引用给一个 net6.0 的项目。
>
> 坑 2：**循环引用（A 引用 B，B 也引用 A）** → VS 会直接报错阻止你创建循环引用。如果你遇到这种情况，说明架构设计有问题——把公共类型抽到第三个项目 C，A 和 B 都引用 C。
>
> 坑 3：**类库项目里用了 WPF 类型（如 `System.Windows.Media.Brush`）但没加 `<UseWPF>true</UseWPF>`** → 类库项目默认不启用 WPF。如果类库要用 WPF 的类型（如颜色、画刷、依赖属性），需要在类库的 .csproj 中加 `<UseWPF>true</UseWPF>`。

> [!best] 最佳实践
> - 先单后多：项目初期用单项目快速推进，当某个文件夹里的 .cs 文件超过 15 个时，考虑把那部分提取为单独的类库
> - 依赖方向：上层引用下层（App → Services → Models），绝对不能反过来
> - 命名规范：解决方案名用 PascalCase（`PlcMonitor`），项目名用 `方案名.层名`（`PlcMonitor.Services`）
> - 文件夹结构：用 `src/` 放所有源码项目，`tests/` 放测试项目，`docs/` 放文档
> - 类库项目默认没有 `MainWindow`，记得把自动生成的 `Class1.cs` 重命名为有意义的类名

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建一个多项目解决方案。包含：一个 WPF 项目（App）、一个类库项目（Models）。在 Models 中定义一个 `DeviceInfo` 类，在 App 中引用 Models 并创建 `DeviceInfo` 对象显示在 MessageBox 中。
>
> **Lv.2 小试牛刀**：在上面基础上再添加一个 Services 类库。Services 引用 Models，App 引用 Services 和 Models。在 Services 中写一个 `DeviceService` 类，方法返回 `List<DeviceInfo>`。在 App 中调用并显示设备数量。
>
> **Lv.3 融会贯通**：搭建一个完整的上位机多项目方案骨架：App（WPF）、ViewModels（类库）、Models（类库）、Services（类库）、Protocols（类库）。确保引用关系正确（无循环）、所有项目用 .NET 8、可编译通过。

> [!related] 相关知识链接
> - ← WPF App 项目模板——App 项目就是从这里创建的
> - → 类库项目的作用——深入了解如何设计和组织类库
> - → 项目引用与依赖管理——项目间引用的配置方法
> - → NuGet 包管理器——类库也可以打成 NuGet 包共享给其他团队
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/visualstudio/ide/solutions-and-projects-in-visual-studio
