---
title: MSI 安装包（WiX Toolset）
section: 15-deployment
parent: 15.1 发布方式
---

# MSI 安装包（WiX Toolset）

> [!plain] 白话理解
> MSI 安装包像"正规军部署"：它不只把文件复制过去，还登记注册表、创建开始菜单、支持卸载和修复，Windows 会把它当"正式居民"管理。而 WiX 就是用来"写 MSI 施工图纸"的工具——你用 XML 描述"要装哪些文件、装到哪、写哪些注册表项"，WiX 把它编译成标准 MSI。上位机软件出厂交付，客户要"双击 setup 就能装、控制面板里能卸载"，MSI 就是满足这个诉求的成熟方案。

> [!def] 官方定义
> **Windows Installer（MSI）** 是 Windows 官方的**安装服务引擎**，以 `.msi` 数据库文件描述安装内容与规则，支持无人值守安装（`msiexec /i app.msi /qn`）、修复、卸载与权限提升。**WiX Toolset**（Windows Installer XML）是微软 2004 年开源的**工具集**：用 XML 编写安装定义（`.wxs` 源文件），经 `candle`（编译为 .wixobj）与 `light`（链接为 .msi）两步生成安装包；配套 `heat` 从目录自动抓取文件清单，`WixUIExtension` 提供标准安装向导界面。官方文档：https://learn.microsoft.com/zh-cn/windows/win32/msi/windows-installer-portal

> [!origin] 由来背景
> 1990 年代 Windows 软件安装混乱不堪：各家用私有格式，卸载不干净、没有修复机制。微软 1999 年推出 Windows Installer 统一安装标准，2004 年又开源了自家的 WiX 工具集（微软最早的开源项目之一），让开发者能用文本化、可版本控制的 XML 定义安装包，替代拖拽式安装制作工具。2010 年代 WiX 成为 Windows 生态生成 MSI 的事实标准，Visual Studio 项目也能通过 WiX 工程一键产出安装包；后来微软推出更现代的 MSIX 打包格式，但 WiX/MSI 在企业批量部署中仍是主流。

> [!essentials] 核心要点
> - **产品三角**：WiX 的核心结构是 `Product`（一个产品）→ `Feature`（可选功能组）→ `Component`（最小安装单元，含文件/注册表/服务），每个 Component 必须有唯一 GUID
> - **两步构建**：`.wxs` 源文件 → `candle.exe` 编译成 `.wixobj` → `light.exe` 链接出 `.msi`；VS 的 WiX 工程在生成时自动完成
> - **文件收集**：`heat` 工具扫描目录自动生成 Component 定义，避免手写上百条文件项
> - **安装行为**：`InstallScope`（perMachine 需管理员 / perUser 免提权）、`UpgradeCode`（跨版本升级识别码，必须保持不变）、`MajorUpgrade`（覆盖安装旧版本）
> - **UI 与本地化**：`WixUIExtension` 提供安装向导；`WixUI_InstallDir` 实现安装目录选择页

> [!example] 完整示例
> **MSI 安装信息读取器：遍历 Uninstall 注册表项读取 DisplayName/DisplayVersion/InstallLocation、选中项回显详情：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MSI 安装信息读取器" Height="480" Width="640"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Grid.Row="0" Text="已安装程序列表（来自 MSI 注册表项）" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,8"/>
>         <ListBox Grid.Row="1" x:Name="InstalledList" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#21262D" SelectionChanged="OnSelectionChanged"/>
>         <StackPanel Grid.Row="2" Margin="0,8,0,0">
>             <TextBlock x:Name="TxtDetail" Foreground="#8B949E" TextWrapping="Wrap"/>
>             <Button Content="重新加载" Click="OnReloadClick" Padding="8" Margin="0,8,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Controls;
> using Microsoft.Win32;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly List<KeyValuePair<string, string>> _apps = new();   // 名称 -> 安装详情
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnReloadClick(null, null);
>         }
>
>         private void OnReloadClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 InstalledList.Items.Clear();
>                 _apps.Clear();
>                 // WiX/MSI 安装的信息写入 Uninstall 注册表项，读取 DisplayName/DisplayVersion/InstallLocation
>                 string[] roots =
>                 {
>                     @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
>                     @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
>                 };
>                 foreach (string root in roots)
>                 {
>                     using RegistryKey key = Registry.LocalMachine.OpenSubKey(root);
>                     if (key == null) continue;
>                     foreach (string sub in key.GetSubKeyNames())
>                     {
>                         using RegistryKey app = key.OpenSubKey(sub);
>                         string name = app?.GetValue("DisplayName") as string;
>                         if (string.IsNullOrEmpty(name)) continue;   // 无显示名的多为驱动/系统补丁，跳过
>                         string version = app?.GetValue("DisplayVersion") as string ?? "未知";
>                         string location = app?.GetValue("InstallLocation") as string ?? "";
>                         _apps.Add(new KeyValuePair<string, string>(
>                             name,
>                             "版本：" + version + "\n安装位置：" +
>                             (string.IsNullOrEmpty(location) ? "未记录" : location)));
>                         InstalledList.Items.Add(name);
>                     }
>                 }
>                 TxtDetail.Text = "共读取到 " + _apps.Count + " 个已安装程序";
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("读取注册表失败：" + ex.Message, "MSI 安装信息");
>             }
>         }
>
>         private void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
>         {
>             int index = InstalledList.SelectedIndex;
>             if (index >= 0 && index < _apps.Count)
>                 TxtDetail.Text = _apps[index].Value;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 需要"正规安装体验"的出厂交付：客户要求双击 setup 安装、控制面板里能卸载修复，MSI 是标配
> ✅ 大批量静默部署：`msiexec /i HmiSetup.msi /qn` 无界面安装，可配合组策略/脚本推到几十台机器
> ✅ 要写注册表、装 Windows 服务、建快捷方式的软件：WiX 的 Component 可定义注册表项、服务与文件关联
> ✅ 升级与覆盖安装管控：用 `UpgradeCode` + `MajorUpgrade` 保证旧版本被干净替换
> ❌ 每天多次更新迭代的内网小工具：MSI 的构建与升级流程重，用 `clickonce-发布` 更轻
> ❌ 纯绿色拷贝就能跑的便携工具：打包成本高于收益，直接 XCopy 或 `独立发布与单文件发布` 即可

> [!pitfall] 常见踩坑
> 坑 1：**版本号格式不对导致"无法升级"** → 现象：`MajorUpgrade` 不生效，新旧版本共存甚至安装失败 → 原因：MSI 要求版本号为三段数字（如 `1.0.0`），且每段 ≤ 255，填 `1.0` 或带字母后缀都会被拒绝 → 解决：`Product/@Version` 用三段式，并与应用版本号保持一致
>
> 坑 2：**Component GUID 变了导致卸载不干净** → 现象：升级后旧文件残留、卸载报错 → 原因：每个 Component 的 GUID 必须终身不变，Windows Installer 凭它识别组件，改了就会被当成新组件 → 解决：把 GUID 当"身份证"，复制模板后务必修改，只在新增/删除文件时才动它
>
> 坑 3：**InstallScope 配错导致权限问题** → 现象：perUser 安装换用户后程序"消失"，或 perMachine 在无管理员权限的机器上装不上 → 原因：安装范围与目标环境用户权限不匹配 → 解决：车间机统一管理员账户用 `perMachine`（需提权 UAC），无管理员场景用 `perUser`

> [!best] 最佳实践
> - 用 heat 自动收集文件：上百个 dll 与资源别手写 Component，heat 扫描生成后微调即可
> - `UpgradeCode` 写死、`ProductCode` 每次发布换新：前者是产品跨版本"身份证"，后者区分安装实例
> - 安装目录用 `INSTALLFOLDER` 标准属性：后续要加"选择安装目录"界面（`WixUI_InstallDir`）不用重构
> - 发布前用 Orca / lessmsi 检查生成的 MSI：核对文件列表、注册表项、快捷方式是否齐全
> - 安装包文件名带版本号：`HmiSetup-2.1.0.msi` 归档保存，避免现场拿错包、回溯困难

> [!practice] 上手练习
> **Lv.1 照猫画虎**：在 VS 里新建"WiX Setup Project"，用 heat 收集示例项目输出，生成并安装一个最简 MSI
> **Lv.2 小试牛刀**：给 MSI 加开始菜单快捷方式和一个注册表项（如 `HKLM\Software\HmiDemo` 写入安装路径），安装后检查生效
> **Lv.3 融会贯通**：配置 `UpgradeCode` 与 `MajorUpgrade`，先装 `1.0.0` 再装 `1.1.0`，验证覆盖安装后"控制面板"里只有一条记录
> **Lv.4 拆层挑战**：用 `msiexec /i HmiSetup.msi /qn` 做静默安装、`msiexec /x HmiSetup.msi /qn` 静默卸载，写一个批量部署到多台车间机的脚本

> [!related] 相关知识链接
> - ← 前置知识：`独立发布与单文件发布`（先确定发布形态，再决定安装包内容）
> - → 后续必学：`目标机器-net-runtime-检查`（非自包含 MSI 安装前确认目标机运行时）
> - ⇄ 关联概念：`clickonce-发布`（轻量更新分发，与 MSI 互补）、`框架依赖-vs-独立部署比较`（MSI 里要不要带运行时）
> - 📖 官方文档：Windows Installer 概述：https://learn.microsoft.com/zh-cn/windows/win32/msi/windows-installer-portal ；WiX Toolset 文档：https://docs.firegiant.com/wix/
