---
title: WPF 本地化方案
section: 11-advanced-ui
parent: 11.4 多语言与国际化
---

# WPF 本地化方案

> [!plain] 白话理解
> 本地化就是给上位机**配多套"方言"**：同一台设备卖到国外，界面要从中文换成英文，但业务逻辑一个字都不用改。做法是上一节说的"标识牌总表"（`.resx`）做多份：`Strings.resx` 存默认中文、`Strings.en-US.resx` 存英文。切换语言时，把当前区域（`CurrentUICulture`）换成"en-US"，资源管理器自动去读英文表，代码里再把界面文字重新刷一遍。示例点"Switch to English"，标题、提示、窗口标题全部变英文——就像给车间换了一套英文标识牌，机器还是那些机器。

> [!def] 官方定义
> WPF 本地化（Localization）指让应用界面文字、日期格式等按语言/区域（`CultureInfo`）变化的技术。完整方案由三部分组成：**资源层**（`.resx` 按区域分文件 + `ResourceManager` 按 `CurrentUICulture` 选择）、**区域层**（`Thread.CurrentThread.CurrentUICulture` 控制资源语言、`CurrentCulture` 控制数字/日期格式）、**界面层**（切换后重读资源刷新 UI）。微软还提供 `LocBaml` 工具（基于 BAML 的 XAML 本地化），但社区更常用 resx + 强类型资源类方案。详见官方文档：[CultureInfo 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.globalization.cultureinfo)、[桌面应用本地化](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/wpf-globalization-and-localization-overview)。

> [!origin] 由来背景
> .NET Framework 1.0（2002 年）就内置了完整的本地化设施：`CultureInfo` 定义语言/区域，`.resx` + 卫星程序集（`zh-CN`/`en-US` 子目录下的附属 DLL）实现"一份代码、多语言分发"，`ResourceManager` 负责按当前 UI 文化选择资源。WPF（2006 年）沿用了这套机制，并增加了面向 XAML 的 `BAML` 本地化（`LocBaml`）与 `UICulture` 编译选项。相比 WinForms 的资源内嵌，WPF 的本地化难点在"XAML 里写死的文字"与"运行时动态生成的文字"两类都要覆盖——示例展示了 code-behind 侧最常用的强类型资源 + 切文化 + 刷新 UI 的闭环。

> [!essentials] 核心要点
> - **资源分层**：`Strings.resx`（默认/中文）+ `Strings.zh-CN.resx` + `Strings.en-US.resx`，同 key 不同值
> - **强类型访问**：`.resx` 访问修饰符设 public 生成 `Resources.Strings` 类，`_strings.MainTitle` 编译期取资源（示例）
> - **设置文化**：`Thread.CurrentThread.CurrentUICulture`（资源语言）+ `Thread.CurrentThread.CurrentCulture`（数字/日期），示例同时设置两者
> - **自动选择**：`ResourceManager` 按 `CurrentUICulture` 匹配资源，无对应语言时回退默认资源
> - **界面刷新**：切换语言后需要手动把资源值赋回各控件（示例 `ApplyLanguage`），或绑定资源代理类实现自动刷新
> - **启动语言**：构造里先 `ApplyLanguage(默认)`，或从 `Properties.Settings`/系统区域读取初始语言

> [!example] 完整示例
> **上位机中英文切换演示：通过 CultureInfo + ResourceManager 读取 resx 资源文件实现界面本地化，点击按钮在中文/英文之间动态切换（依赖 System.Resources 资源文件，需先在项目中新建 Strings.resx 与 Strings.en-US.resx）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="WPF 本地化方案" Height="320" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="WPF 本地化方案（resx + CultureInfo 动态切换）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <TextBlock x:Name="TitleText" Margin="0,18,0,0" FontSize="16" FontWeight="Bold"
>                    Foreground="White"/>
>         <TextBlock x:Name="HintText" Margin="0,8,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,22,0,0">
>             <Button x:Name="BtnZh" Content="切换为中文" Padding="14,8" Margin="0,0,10,0"
>                     Background="#21262D" Foreground="White" Click="OnSwitchToZh"/>
>             <Button x:Name="BtnEn" Content="Switch to English" Padding="14,8"
>                     Background="#21262D" Foreground="White" Click="OnSwitchToEn"/>
>         </StackPanel>
>         <TextBlock x:Name="CultureText" Foreground="#58A6FF" Margin="0,18,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Globalization;
> using System.Threading;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 资源管理器的命名空间须与 .resx 文件生成的强类型一致
>         private readonly Resources.Strings _strings = new Resources.Strings();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             ApplyLanguage(new CultureInfo("zh-CN"));
>         }
>
>         // 切换语言核心：设置线程当前区域文化 → 重新读取资源 → 刷新界面文字
>         private void ApplyLanguage(CultureInfo culture)
>         {
>             Thread.CurrentThread.CurrentUICulture = culture;
>             Thread.CurrentThread.CurrentCulture = culture;
>
>             // ResourceManager 按 CurrentUICulture 自动选择对应语言的资源
>             TitleText.Text = _strings.MainTitle;
>             HintText.Text = _strings.MainHint;
>             CultureText.Text = $"当前区域：{culture.Name}（{culture.DisplayName}）";
>             Title = _strings.WindowTitle;
>         }
>
>         private void OnSwitchToZh(object sender, RoutedEventArgs e)
>             => ApplyLanguage(new CultureInfo("zh-CN"));
>
>         private void OnSwitchToEn(object sender, RoutedEventArgs e)
>             => ApplyLanguage(new CultureInfo("en-US"));
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 出口设备的上位机：同一程序按客户地区显示中/英/俄界面（示例场景）
> ✅ 工厂多国籍操作员共用一台设备，界面语言可现场切换
> ✅ 界面文案与代码分离的规范化项目：翻译由专职人员维护 `.resx`，开发不参与
> ✅ 与日期/数字格式联动的场景：`CurrentCulture` 影响小数分隔符、日期显示（本地化不只是文字）
> ❌ 仅内部使用的单语种工具（本地化框架的复杂度大于收益）
> ❌ 界面文字极少且不会变的演示程序（直接写死即可）

> [!pitfall] 常见踩坑
> 坑 1：**只设置 `CurrentCulture` 没设置 `CurrentUICulture`** → 现象：界面语言不变，但日期格式变了 → 原因：资源选择看 `CurrentUICulture`，格式看 `CurrentCulture`，两者职责不同 → 解决：两个都设置（示例 `ApplyLanguage`）
> 
> 坑 2：**强类型资源类没生成** → 现象：`Resources.Strings` 编译不过或属性不存在 → 原因：`.resx` 的"访问修饰符"默认 internal，或没保存生成 → 解决：把 `.resx` 访问修饰符改为 public 后重新生成项目
>
> 坑 3：**XAML 里写死的文字不跟随语言切换** → 现象：窗口标题等 code-behind 更新了，但 XAML 里的 TextBlock 文字没变 → 原因：XAML 静态文字只在启动时渲染，不会自动换语言 → 解决：XAML 文字也走资源绑定（`x:Static` + 切换后 `UpdateDefaultStyle`/重绑定），或统一由资源代理类驱动刷新

> [!best] 最佳实践
> - 资源 key 用语义名，所有语言版本 key 严格一致；缺词宁可显示 key 名也要保证结构统一（便于发现漏译）
> - 切换语言统一入口：`SetLanguage(CultureInfo)` 只改文化与刷新，所有按钮/菜单都调它，禁止散落 `if` 分支
> - 语言选择持久化到 `Properties.Settings`，启动时先恢复用户上次选择
> - 界面刷新用"资源代理类 + 绑定"方案（`Resx` 实现 `INotifyPropertyChanged`），比逐控件赋值更可靠、更 MVVM
> - 涉及数字/日期显示的控件，切换语言后同步更新格式（`CurrentCulture`），避免"文字英文、日期中文"的混搭

> [!practice] 上手练习
> **Lv.1 照猫画虎**：项目新建 `Strings.resx`（`MainTitle`/`MainHint`/`WindowTitle`）与 `Strings.en-US.resx`，运行示例点击两个按钮观察中英文切换
> **Lv.2 小试牛刀**：新增第三个语言（如俄语 `ru-RU`）与切换按钮，验证"多语言可扩展"；给 `Strings` 加一个 `DeviceStatus` key 并显示
> **Lv.3 融会贯通**：把 `ApplyLanguage` 改成资源代理类（`Resx` 实现 `INotifyPropertyChanged`），界面用绑定引用资源，验证切换时全界面自动刷新而无需手动赋值
> **Lv.4 拆层挑战**：把语言选择做成 `Settings` 持久化 + 启动恢复，并让日期/数字格式随语言变化（如英文用 `MM/dd/yyyy`），完成完整本地化工程

> [!related] 相关知识链接
> - ← 前置知识：`资源文件resx与动态读取`（`ResourceManager` 按 key 读取是本地化的地基）
> - → 后续必学：`多屏适配拼接屏场景`（多语言 + 多屏的分辨率适配常一起出现在出口项目）、`per-monitor-dpi-awareness`（不同语言字体差异与 DPI 适配）
> - ⇄ 关联概念：「第 5 章·数据绑定」「什么是数据绑定」（资源代理类绑定方案）、`动态切换主题`（主题与语言切换的界面刷新思路同构）
> - 📖 官方文档：[CultureInfo 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.globalization.cultureinfo)、[WPF 全球化与本地化](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/wpf-globalization-and-localization-overview)、[打包与部署资源](https://learn.microsoft.com/zh-cn/dotnet/core/extensions/resources)
