---
title: HTTP API 调用
section: 09-communication
parent: 9.7 其他通信方式
---

# HTTP API 调用

> [!plain] 白话理解
> 现代上位机不只是连 PLC，还要连"云端"：把产量上报到 MES/ERP、从 Web API 拉取工单、调用第三方服务。HTTP 就是最通用的"网上对话"协议：客户端发请求（GET 取数据 / POST 提交数据），服务器返回 JSON。示例演示了 WPF 上位机调用 Web API 的完整流程——连接前、连接后、数据处理三件套。

> [!def] 官方定义
> HTTP（HyperText Transfer Protocol）是基于 TCP 的应用层协议，采用请求-响应模型。核心要素：方法（GET 读、POST 创建、PUT 改、DELETE 删）、URL（协议+主机+路径+查询参数）、请求头/响应头（Content-Type、Authorization、Accept 等）、状态码（200 成功、201 创建、400 参数错、401 未认证、404 不存在、500 服务器错误）、消息体（常为 JSON）。.NET 推荐用 HttpClient（.NET Core 起）调用；GET/POST 异步发送，服务器返回 JSON 反序列化为 DTO。

> [!origin] 由来背景
> 上位机原先只跟现场设备点对点通信，但随着"数字工厂/设备上云"，上位机需要与 MES、ERP、云平台、第三方 Web 服务频繁交换数据。HTTP 因通用、简单、跨语言、有成熟生态（JSON 序列化、REST 设计、OAuth 认证）成为系统间集成的默认标准。.NET 的 HttpClient 提供了线程安全、连接复用、异步支持的高效客户端，取代了老旧的 WebClient/HttpWebRequest，成为 WPF 上位机对接 Web 的标准入口。

> [!essentials] 核心要点
> - **HttpClient 是首选**：线程安全可复用；别每次请求 new 一个（会耗尽 socket），应用级单例或注入
> - **GetAsync/PostAsync**：GetStringAsync 直接取文本；PostAsJsonAsync 自动序列化 DTO 并设置 Content-Type
> - **JSON 序列化**：System.Text.Json（.NET 内建）或 Newtonsoft.Json；属性名大小写用 JsonSerializerOptions 处理
> - **响应处理**：EnsureSuccessStatusCode() 或判 IsSuccessStatusCode；失败时读取错误内容（ErrorContent）辅助排障
> - **状态码语义**：200/201 成功、401 认证失败（检查 Token）、404 路径错、500 服务器错
> - **超时与取消**：HttpClient.Timeout 设置超时；长任务用 CancellationToken 支持用户取消
> - **认证**：Bearer Token 加进 Authorization 请求头；Token 过期要刷新重试
> - **日志**：请求 URL、状态码、耗时记日志，联调排障必备

> [!example] 完整示例
> **HTTP API 调用演示：HttpClient 执行 GET 与 POST 请求并显示响应：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="HTTP API 调用" Height="480" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="HttpClient 是 .NET 推荐的 HTTP 客户端（GET/POST + JSON）"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <Button Content="GET 请求" Click="OnGetClick" Padding="10,4"
>                     Background="#21262D" Foreground="White"/>
>             <Button Content="POST 请求" Click="OnPostClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#238636" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="请求地址" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="UrlBox" Text="https://httpbin.org/get" Height="28" Margin="0,4,0,0"
>                  Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         <TextBlock Text="请求体（POST 时发送）" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="BodyBox" Text="{&quot;device&quot;:&quot;PLC-01&quot;,&quot;cmd&quot;:&quot;start&quot;}"
>                  Height="40" Margin="0,4,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" TextWrapping="Wrap"/>
>         <TextBlock Text="响应内容" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="RespBox" Height="120" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,4,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Net.Http;
> using System.Text;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private static readonly HttpClient Http = new HttpClient(); // 复用单例，避免端口耗尽
>
>         public MainWindow() => InitializeComponent();
>
>         // GET：查询类接口，参数拼在 URL 上
>         private async void OnGetClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 StatusText.Text = "请求中...";
>                 var resp = await Http.GetStringAsync(UrlBox.Text);
>                 RespBox.Text = resp;
>                 StatusText.Text = "GET 完成";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "GET 失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>
>         // POST：提交类接口，JSON 放进请求体
>         private async void OnPostClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 StatusText.Text = "请求中...";
>                 var content = new StringContent(BodyBox.Text, Encoding.UTF8, "application/json");
>                 var resp = await Http.PostAsync(UrlBox.Text, content);
>                 RespBox.Text = await resp.Content.ReadAsStringAsync();
>                 StatusText.Text = $"POST 完成，状态码 {(int)resp.StatusCode}";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "POST 失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机数据展示与交互界面开发
> ✅ 工业自动化设备状态监控系统
> ✅ 需要高效数据绑定的实时数据处理场景
> ✅ 多窗口、多页面复杂导航的企业级应用
> ❌ 简单的控制台工具程序（用控制台更省事）
> ❌ 对性能要求极端苛刻的底层驱动开发（用 C++ 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**每次请求 new HttpClient 导致 socket 耗尽** → HttpClient 内部持有连接池，必须复用（静态字段/DI 单例），否则高并发时端口耗尽
>
> 坑 2：**JSON 字段大小写/类型不匹配解析异常** → 服务端字段可能是小写 camelCase；设置 PropertyNameCaseInsensitive，缺字段用可空类型，先读原始 JSON 再排错
>
> 坑 3：**未判状态码直接取内容** → 404/500 也会返回"内容"（错误页）；必须先 EnsureSuccessStatusCode 或判 IsSuccessStatusCode
>
> 坑 4：**UI 线程同步 .Result 卡死** → HttpClient 方法都是异步，同步阻塞 UI 线程会死锁或卡死；必须 await
>
> 坑 5：**超时没设，服务器挂起时界面无限等待** → HttpClient.Timeout 默认 100 秒，联网场景显式设短（如 10s），并支持用户取消

> [!best] 最佳实践
> - HttpClient **全局单例复用**（静态字段或 DI 单例），不要每次请求 new；用 `IHttpClientFactory` 管理生命周期与 DNS 刷新
> - 统一封装 `ApiClientService`：强类型 GET/POST、自动 JSON 序列化、统一状态码处理与错误消息，业务层不接触 HttpClient 细节
> - 超时与取消必配：`Timeout` 设 10s 左右，耗时请求支持 `CancellationToken` 让用户可取消，避免界面无限等待
> - 结构化错误处理：捕获 `HttpRequestException`/`TaskCanceledException`，区分"网络不可达/超时/业务错误"三类并给用户明确提示
> - 生产环境启用**日志与重试**：记录请求 URL、耗时、状态码；对 5xx/超时做有限次重试（指数退避），幂等写接口才可重试
> - 涉及认证的 API 集中处理 Token（获取/刷新/过期重登），不散落各请求；HTTPS 证书在调试环境临时放行时加 TODO 标记，上线前必须收紧

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用公共 API（如 JSONPlaceholder）运行示例，完成 GET 列表与 POST 提交，观察状态码与 JSON 解析
> **Lv.2 小试牛刀**：给示例加"统一错误处理"：404/500 时界面弹出明确错误提示，并把请求 URL 与状态码写入日志
> **Lv.3 融会贯通**：封装 ApiClientService（单例 HttpClient + 强类型 GET/POST + 超时重试），模拟"产量上报 MES"业务：定时上报设备产量到 Web API

> [!related] 相关知识链接
> - ← 前置知识：《网络基础概念（IP、端口、TCP vs UDP）》HTTP 基于 TCP
> - → 后续必学：《WebSocket 全双工通信》实时推送对比
> - ⇄ 关联概念：《异步通信与高并发》（HTTP 请求是典型异步场景）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/fundamentals/networking/http/httpclient-guidelines（HttpClient 使用指南）
