---
title: PasswordBox 密码框
section: 04-controls
parent: 4.3 文本类控件
---

# PasswordBox 密码框

> [!plain] 白话理解
> 操作员登录、修改密码、安全确认——这些场景输入的字符不能明文显示，更不能让密码以字符串形式散落在内存里。`PasswordBox` 就是专为"敏感输入"设计的：输入的每个字符都显示为掩码字符（默认 `●`），并且刻意不提供 `Text` 属性，防止开发者图省事把密码变成普通字符串。
> 取值要用 `Password`（字符串）或更安全的 `SecurePassword`（`SecureString`，内存加密且可释放）。校验完成后用 `Clear()` 清空。上位机里的权限登录、工程师模式解锁，都是它的典型应用。

> [!def] 官方定义
> PasswordBox 是 WPF 中用于"密码等敏感文本输入"的控件，位于 `System.Windows.Controls` 命名空间。它没有公开的 `Text` 属性（刻意设计），提供 `Password`（明文 `string`，仅限确认场景使用）、`SecurePassword`（`SecureString`，推荐，内存中加密存储）、`PasswordChar`（掩码字符，默认 `●`）与 `PasswordChanged` 事件。`MaxLength` 可限制输入长度。由于无 Text 属性，`SecurePassword`/`Password` 不支持数据绑定，MVVM 下需通过附加属性或行为桥接。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.passwordbox

> [!origin] 由来背景
> 传统文本框输入密码时，程序拿到的是普通字符串：`string` 在 .NET 中不可变，任何拼接/拷贝都会在托管堆里留下多个副本，即使变量被释放，残留内容仍可能被内存扫描工具读取。微软为此在 .NET Framework 2.0 引入 `SecureString`（内存加密 + 可显式 Dispose），WPF 同步设计了不暴露 Text 的 PasswordBox，强制开发者走 `SecurePassword` 通道。这是"控件级安全设计"的典范：不是提醒你"别把密码存字符串"，而是从 API 层面让你无法轻易犯错。工业上位机的操作员权限体系（角色、密码、审计）正是靠这一层保障。

> [!essentials] 核心要点
> - **无 Text 属性**：刻意不提供明文绑定，密码不经过普通字符串
> - **SecurePassword 优先**：`using (var sec = pwd.SecurePassword)` 用完即释放
> - **Password 兜底**：确需明文时用 `Password`，但尽量只在"比对长度/校验格式"时用
> - **PasswordChar 掩码**：可自定义掩码字符（`●`、`*`）
> - **校验后清空**：`Clear()` 降低内存残留与泄露风险
> - **MVVM 桥接**：无 Text 属性，需用附加属性/行为才能双向绑定（第 6 章命令章节常见做法）

> [!example] 完整示例
> **操作员登录窗口演示：PasswordChar 掩码、SecurePassword 安全取密、用后即清：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="操作员登录 - PasswordBox" Height="320" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117"
>         ResizeMode="NoResize">
>     <StackPanel Margin="20" Width="300">
>         <TextBlock Text="用户名：" Foreground="White"/>
>         <TextBox x:Name="txtUser" Margin="0,4,0,12" Padding="6"/>
>
>         <TextBlock Text="密码：" Foreground="White"/>
>         <!-- PasswordChar 指定掩码字符；MaxLength 限制输入长度 -->
>         <PasswordBox x:Name="pwdBox" PasswordChar="●" MaxLength="16"
>                      Margin="0,4,0,12" Padding="6"/>
>
>         <Button Content="登录" Click="OnLogin" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Security;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnLogin(object sender, RoutedEventArgs e)
>         {
>             // 安全做法：用 SecurePassword 而不是 Password（避免明文常驻内存）
>             using (SecureString sec = pwdBox.SecurePassword)
>             {
>                 bool ok = txtUser.Text == "admin" && sec.Length == 6;
>                 tipText.Text = ok ? "登录成功，欢迎进入监控系统" : "用户名或密码错误";
>             }
>             pwdBox.Clear(); // 校验完成后立即清空，降低泄露风险
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 操作员登录：用户名 + 密码输入
> ✅ 权限升级：工程师模式、管理员解锁时二次验证
> ✅ 修改密码表单：旧密码 + 新密码 + 确认密码
> ✅ 连接凭据：数据库/设备连接时输入凭据
> ❌ 非敏感文本输入（用「textbox-文本框」即可，不要滥用密码框）
> ❌ 需要与 ViewModel 直接绑定的场景（无 Text 属性，需附加属性桥接，成本高）

> [!pitfall] 常见踩坑
> 坑 1：**误用 `Password` 做长时存储/跨页面传递** → 密码明文滞留内存。原因：字符串不可变，副本残留。解决：验证后立刻 `Clear()`；必须传值时用 `SecureString` 并尽快释放
>
> 坑 2：**MVVM 下直接绑 `Password` 失败** → 绑定异常或无效果。原因：PasswordBox 没有 Text，也不实现双向绑定。解决：用附加属性（Attached Behavior）桥接 `PasswordChanged` 到 VM 属性
>
> 坑 3：**按下"登录"时密码已变化** → 拿到的密码是旧值/空值。原因：读取时机早于输入完成。解决：在登录命令里实时读取（事件驱动），不要在窗口加载时缓存
>
> 坑 4：**忘了清空密码框** → 他人可复用上次输入。原因：界面残留。解决：登录成功/失败后都执行 `PasswordBox.Clear()`

> [!best] 最佳实践
> - 验证逻辑统一收敛到登录命令：读 `Password` → 校验 → 立即 `Clear()`
> - 业务代码尽量用 `SecurePassword`（`SecureString`），用完 `Dispose`
> - MVVM 需要绑定时封装"附加属性"，一处实现全项目复用
> - 密码框旁配"显示/隐藏"开关时，切换用 `PasswordChar='\0'` 而非换控件
> - 密码策略（长度/复杂度）提示放在界面文案里，减少错误输入

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，输入密码点登录，观察成功/失败提示与密码框清空行为
> **Lv.2 小试牛刀**：加"显示密码"CheckBox：勾选时 `PasswordChar` 改为 `'\0'` 显示明文，取消恢复 `●`
> **Lv.3 融会贯通**：封装 PasswordBox 的附加属性（AttachedProperty）桥接 `PasswordChanged`，实现 MVVM 下绑定到 VM 属性
> **Lv.4 挑战**：实现完整的"登录窗口"：用户名 + 密码 + 记住我 + 错误次数锁定（连续 5 次错误禁用输入 60 秒），密码框操作全部走 SecureString

> [!related] 相关知识链接
> - ← 前置知识：「textbox-文本框」对比普通输入；「label-标签」配合助记符聚焦密码框
> - → 后续必学：MVVM 命令与附加属性见第 6 章「命令系统」与第 7 章「MVVM 模式」
> - ⇄ 关联概念：「messagebox-消息弹窗」常用于登录结果提示；「checkbox-复选框」做"记住密码"
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.passwordbox
