---
title: MVVM 与通信类 NuGet 包
section: 16-resources
parent: 16.6 常用 NuGet 包清单
---

# MVVM 与通信类 NuGet 包

> [!plain] 白话理解
> 上位机开发两大核心：**界面逻辑**（MVVM 绑定与命令）和**设备通信**（串口/Modbus/MQTT）。这两块都有成熟 NuGet 包：MVVM 用 `CommunityToolkit.Mvvm` 消灭样板代码，通信按协议选 `NModbus`/`MQTTnet`/`HslCommunication`。装上这些包，就像雇了两位"熟手"，把你最费劲的绑定通知和协议解析全包了。

> [!def] 官方定义
> **MVVM 与通信类 NuGet 包**是 WPF 生态中**界面架构**与**设备通信**两大方向的库集合（NuGet 检索：https://www.nuget.org/ ）。常用清单：
> - **CommunityToolkit.Mvvm**（微软官方维护）：MVVM 绑定工具包，`ObservableObject`、`[ObservableProperty]`、`[RelayCommand]`（见 `communitytoolkitmvvm` 篇）
> - **Prism**（NuGet：`Prism.DryIoc`）：企业级 MVVM + 模块化 + 区域导航框架（见 `prism` 篇）
> - **NModbus**（NuGet：`NModbus`）：Modbus RTU/ASCII/TCP 协议库（见 `nmodbus` 篇）
> - **MQTTnet**（NuGet：`MQTTnet`）：MQTT 3.1.1/5.0 客户端与服务端（见 `mqttnet` 篇）
> - **HslCommunication**（NuGet：`HslCommunication`）：多品牌 PLC 通信库（西门子/三菱/欧姆龙/Modbus 等）
> - **System.IO.Ports**（微软官方，NuGet：`System.IO.Ports`）：串口通信底层 API（https://learn.microsoft.com/zh-cn/dotnet/api/system.io.ports.serialport ）
>
> 微软官方提供的是 MVVM 基础接口（`INotifyPropertyChanged`、`ICommand`，https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/ ）与串口底层 API；**框架与协议库多为第三方开源**，二者配合使用。

> [!origin] 由来背景
> WPF 的绑定机制强大但样板代码多，2008 年前后 MVVMLight 等框架率先提出"基类 + 命令封装"思路，后由 **CommunityToolkit.Mvvm**（微软官方维护）在 2020 年后用**源生成器**把样板代码降到最低。通信侧同样演进出"协议库化"：Modbus 库 `NModbus`、MQTT 库 `MQTTnet`、多品牌 PLC 库 `HslCommunication` 先后成为社区标准。上位机开发因此从"手写绑定 + 手拼报文"升级为"**框架管界面、库管协议、开发者管业务**"的工程化模式。

> [!essentials] 核心要点
> - **MVVM 主线**：`CommunityToolkit.Mvvm` 做绑定（`[ObservableProperty]`/`[RelayCommand]`），大项目升级 `Prism` 加模块化
> - **通信主线**：Modbus 设备用 `NModbus`，物联网消息用 `MQTTnet`，多品牌 PLC 用 `HslCommunication`，串口原生用 `System.IO.Ports`
> - **异步纪律**：通信库的异步 API + `await`，禁止在 UI 线程同步阻塞读设备
> - **命令驱动**：界面操作全走 `ICommand`，通信服务注入 ViewModel，测试可替换
> - **封装服务**：通信库实例封装成单例服务（DI 管理），一处配置、全局复用
> - **组合套路**：`CommunityToolkit.Mvvm`（界面） + `NModbus`/`MQTTnet`（通信）是中小上位机的黄金组合

> [!example] 完整示例
> **MVVM 框架与通信库组合：CommunityToolkit.Mvvm 属性通知与命令绑定演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MVVM 通信组合" Height="380" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="MVVM + 通信库组合演示" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <TextBlock Text="设备地址：" Foreground="#8B949E"/>
>         <TextBox x:Name="AddressBox" Text="192.168.0.1" Margin="0,4,0,10" Padding="6"
>                  Background="#161B22" Foreground="White" BorderBrush="#21262D"/>
>         <TextBlock Text="连接状态：" Foreground="#8B949E"/>
>         <TextBlock x:Name="StateText" Text="未连接" Foreground="#DA3633" FontSize="18"
>                    Margin="0,4,0,10"/>
>         <Button x:Name="ConnectBtn" Content="连接设备" Click="OnConnectClick" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <Button x:Name="DisconnectBtn" Content="断开连接" Click="OnDisconnectClick"
>                 Padding="8" Margin="0,8,0,0" Background="#DA3633" Foreground="White"
>                 IsEnabled="False"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Threading.Tasks;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 真实项目中 ViewModel 用 CommunityToolkit.Mvvm 的 ObservableObject
>         // 与 RelayCommand 承载逻辑；此处用代码后台演示等价流程
>         public MainWindow() => InitializeComponent();
>
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             StateText.Text = "正在连接 " + AddressBox.Text + " ...";
>             StateText.Foreground = Brushes.OrangeRed;
>             ConnectBtn.IsEnabled = false;
>
>             // 模拟与通信库（如 MQTTnet / HslCommunication）的握手耗时
>             await Task.Delay(800);
>
>             StateText.Text = "已连接（MVVM 命令驱动）";
>             StateText.Foreground = Brushes.LimeGreen;
>             DisconnectBtn.IsEnabled = true;
>         }
>
>         private void OnDisconnectClick(object sender, RoutedEventArgs e)
>         {
>             StateText.Text = "已断开";
>             StateText.Foreground = Brushes.OrangeRed;
>             ConnectBtn.IsEnabled = true;
>             DisconnectBtn.IsEnabled = false;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 上位机界面与业务逻辑解耦（MVVM 绑定 + 命令）
> ✅ 对接 Modbus 设备（温控器/变频器/采集模块）
> ✅ 对接 PLC（西门子/三菱/欧姆龙，多品牌场景）
> ✅ MQTT 物联网数据上云/多端共享
> ✅ 串口仪表数据采集（System.IO.Ports）
> ❌ 无界面的纯服务/后台任务（不需要 MVVM 层）
> ❌ 硬实时控制场景（通信延迟不确定，不满足硬实时）

> [!pitfall] 常见踩坑
> 坑 1：**MVVM 与通信混在一处写** → 现象：ViewModel 里直接 new 通信库对象、代码耦合难测 → 原因：没把通信封装成服务 → 解决：通信库封装成独立服务类，通过构造注入 ViewModel（见第 12 章 DI）
>
> 坑 2：**在 UI 线程同步调通信 API** → 现象：点连接后窗口假死 → 原因：`ConnectServer()`/`ReadRegisters()` 阻塞 → 解决：一律用异步 API（`ConnectAsync`/`ReadHoldingRegistersAsync`）或 `Task.Run`
>
> 坑 3：**多个包版本冲突** → 现象：装 `NModbus`+`MQTTnet`+`HslCommunication` 后编译冲突 → 原因：传递依赖版本不一致 → 解决：先装核心包，冲突时在 NuGet 管理里统一升级传递依赖；尽量少引功能重叠的包

> [!best] 最佳实践
> - 固定组合套路：`CommunityToolkit.Mvvm`（界面）+ 按设备选通信库，团队统一技术栈
> - 通信服务单例化 + DI 注入，连接配置放配置文件，代码不硬编码 IP/端口
> - 命令里只做"调度"，实际通信放服务层，便于单测 mock
> - 连接状态（连接中/已连接/断开）做成 ViewModel 状态，界面按钮启用禁用由状态驱动
> - 通信异常统一记录 `serilog`，与 `上位机日志场景`（12 章）的日志体系对接

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把"连接设备"流程改成用 `CommunityToolkit.Mvvm` 的 `[RelayCommand]` 实现
> **Lv.2 小试牛刀**：给示例接入 `NModbus` 的 `ModbusTcpMaster`，实现真实 TCP 连接与断开
> **Lv.3 融会贯通**：用 `MQTTnet` 把连接状态/温度发布到 MQTT 主题，界面用 MVVM 绑定显示
> **Lv.4 拆层挑战**：搭建"DI 容器 + IDeviceService（连接/读取/断开）+ ViewModel + 界面"完整分层，写单元测试 mock 通信服务

> [!related] 相关知识链接
> - ← 前置知识：[`communitytoolkitmvvm`](communitytoolkitmvvm)、[`nmodbus`](nmodbus)、[`mqttnet`](mqttnet)
> - → 后续必学：[`prism`](prism)（大型项目框架化）
> - ⇄ 关联概念：[`数据类-nuget-包`](数据类-nuget-包)、[`ui-类-nuget-包`](ui-类-nuget-包)
> - 📖 官方文档：MVVM 绑定 https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/ ；串口 https://learn.microsoft.com/zh-cn/dotnet/api/system.io.ports.serialport
