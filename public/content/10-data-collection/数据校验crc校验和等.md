---
title: 数据校验（CRC、校验和等）
section: 10-data-collection
parent: 10.2 实时数据处理
---

# 数据校验（CRC、校验和等）

> [!plain] 白话理解
> 把校验比作**快递的"重量核对"**：发件方把包裹称重并写在面单上，收件方再称一次——重量对得上，说明中途没被拆包调包；对不上，立即拒收。
>
> - **校验和（Checksum）**：像"数个数"——把所有字节加起来取低 8 位。实现极简，但**漏检率高**：数据里两位同时出错恰好抵消（如 +3 又 -3），重量又对上了。
> - **CRC（循环冗余校验）**：像"指纹"——把数据当成一个大数做多项式除法，余数就是 CRC。任何一位翻转都会让指纹大变，检错能力远强于校验和，是工业通信的事实标准。
>
> 一句话：**CRC 不是加密，而是"数据的指纹"——发方算好指纹附在帧尾，收方按同样规则重算，对不上就说明帧被干扰了，宁可丢弃也不能采信**。

> [!def] 官方定义
> - **校验和（Checksum）**：把数据块的所有字节按位累加后取模（如低 8 位/16 位），接收端重算比对。API 直接用手写循环即可，无框架封装。
> - **CRC（Cyclic Redundancy Check，循环冗余校验）**：基于**多项式除法**的检错码——把数据看作二进制多项式，除以约定生成多项式，余数即为校验值。不同协议参数不同（多项式、初值、输入/输出是否反转），如 **CRC16-Modbus**（多项式 `0x8005`、初值 `0xFFFF`、输出反转，常见于 Modbus 协议）、**CRC32**（IEEE 802.3，以太网/PNG 等）。.NET 6+ 官方封装位于 `System.IO.Hashing`（`Crc32`、`Crc64`）。
> - **哈希（Hash）**：如 `System.Security.Cryptography.SHA256`，用于完整性/防篡改，但工业帧校验一般用 CRC 而非哈希（CRC 更轻、快、专为检错设计）。
> - 📖 官方文档：[System.IO.Hashing.Crc32](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.hashing.crc32)、[SHA256 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.sha256)

> [!origin] 由来背景
> 早期串口通信只有简单的"和校验"，但现场电磁干扰、电缆老化导致的**突发性误码**很常见，校验和漏检会直接酿成错误动作。1961 年，电气工程师 **W. Wesley Peterson** 发表论文提出循环冗余校验（CRC）——用多项式除法替代简单累加，能以极小计算成本检测出几乎所有单位错、双位错、奇数个错和突发错。随后 CRC 被标准化进各领域：**Modbus 用 CRC16**、以太网帧尾用 **CRC32**、PNG 图片、ZIP 压缩包无一例外。它成为"传输层防误码"的默认答案，直到今天仍是上位机通信帧校验的首选。

> [!essentials] 核心要点
> - **CRC 是"参数模型"而不是一个函数**：多项式、初值、输入/输出反转缺一不可——"CRC16" 至少有 Modbus、CCITT、IBM 三种不兼容版本，参数错 = 永远对不上
> - **Modbus CRC16 算法要点**：初值 `0xFFFF`，逐位右移，末位为 1 时异或 `0xA001`（对应多项式 `0x8005` 的反转），**输出要低字节在前**（Modbus 帧 CRC 先发低位）
> - **校验范围不含校验字节**：CRC 只覆盖"数据部分"；接收端若把收到的完整帧（含 CRC）整体重算，结果应为 `0x0000`——两种写法都行，但混用必错
> - **校验失败的处理策略**：丢弃该帧并计数，连续失败触发重发请求或报警，而不是静默跳过
> - **大数据块用 CRC32/哈希**：文件、固件包的完整性用 CRC32 或 SHA256；通信帧用 CRC16 足够且更快
> - **校验和只适合低要求场景**：校验和简单但漏检率高，凡涉及控制命令、安全相关点位，请用 CRC

> [!example] 完整示例
> **数据校验演示：CRC16-Modbus 与简单校验和计算，翻转 1 位模拟误码验证校验能力：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="数据校验(CRC)" Height="440" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Background="#161B22" Margin="10">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>
>         <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="5">
>             <TextBlock Text="数据(十六进制):" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="HexBox" Width="270" Height="26" VerticalContentAlignment="Center"
>                      Background="#0D1117" Foreground="#8B949E" BorderBrush="#21262D"
>                      Text="01 03 00 00 00 02"/>
>         </StackPanel>
>
>         <StackPanel Grid.Row="1" Orientation="Horizontal" Margin="5">
>             <Button x:Name="CrcBtn" Content="计算 CRC16" Click="OnCrcClick" Padding="10,6"
>                     Background="#238636" Foreground="White"/>
>             <Button x:Name="TaintBtn" Content="模拟数据损坏(翻转1位)" Click="OnTaintClick" Padding="10,6"
>                     Background="#DA3633" Foreground="White" Margin="8,0,0,0"/>
>         </StackPanel>
>
>         <TextBlock x:Name="CrcResult" Grid.Row="2" Margin="5" Foreground="#58A6FF" Text="CRC16：--"/>
>         <ListBox x:Name="VerifyList" Grid.Row="3" Margin="5" Background="#0D1117"
>                  Foreground="#8B949E" BorderBrush="#21262D" BorderThickness="1" FontFamily="Consolas"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Linq;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnCrcClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 byte[] data = ParseHex(HexBox.Text.Trim());
>                 ushort crc = Crc16(data);
>                 byte sum = Checksum(data);
>                 CrcResult.Text = $"CRC16(Modbus)：0x{crc:X4} | 校验和：0x{sum:X2}";
>                 VerifyList.Items.Insert(0,
>                     $"数据 {BitConverter.ToString(data)} → CRC=0x{crc:X4} 校验和=0x{sum:X2}");
>             }
>             catch (Exception ex)
>             {
>                 VerifyList.Items.Insert(0, "解析失败：" + ex.Message);
>             }
>         }
>
>         // 翻转数据第 2 字节的最低位，模拟传输过程中的位误码
>         private void OnTaintClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 byte[] data = ParseHex(HexBox.Text.Trim());
>                 data[1] ^= 0x01;
>                 ushort crc = Crc16(data);
>                 VerifyList.Items.Insert(0,
>                     $"!!! 数据被篡改 {BitConverter.ToString(data)} → CRC=0x{crc:X4}（与原始不一致，校验失败）");
>             }
>             catch (Exception ex)
>             {
>                 VerifyList.Items.Insert(0, "解析失败：" + ex.Message);
>             }
>         }
>
>         // 简单校验和：所有字节累加后取低 8 位(实现简单，检错能力弱)
>         private byte Checksum(byte[] data)
>         {
>             byte sum = 0;
>             foreach (byte b in data) sum += b;
>             return sum;
>         }
>
>         // CRC16-Modbus：逐位法实现，检错能力强，Modbus 协议标准校验
>         private ushort Crc16(byte[] data)
>         {
>             ushort crc = 0xFFFF;
>             foreach (byte b in data)
>             {
>                 crc ^= b;
>                 for (int i = 0; i < 8; i++)
>                     crc = (crc & 1) != 0 ? (ushort)((crc >> 1) ^ 0xA001) : (ushort)(crc >> 1);
>             }
>             return crc;
>         }
>
>         // 将 "01 03 00" 形式的十六进制文本解析为字节数组
>         private byte[] ParseHex(string text)
>             => text.Split(new[] { ' ', ',' }, StringSplitOptions.RemoveEmptyEntries)
>                    .Select(s => Convert.ToByte(s, 16)).ToArray();
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **串口/Modbus 通信帧**：每帧必须带 CRC16，收帧验帧、失败丢弃重发——这是 Modbus 协议强制的
> ✅ **网络传输的命令帧**：写寄存器、下发参数这类"错了会出大事"的帧，必须校验
> ✅ **文件/固件完整性校验**：配置文件、固件升级包用 CRC32 或 SHA256 验证
> ✅ **历史数据回读**：存储/回放数据做 CRC 校验，确认归档没被篡改或损坏
> ❌ **安全防篡改场景**：CRC 不是密码学算法，恶意篡改可被重新计算伪造成合法，必须用 HMAC/数字签名
> ❌ **对性能极敏感的超高频链路**：每帧都算 CRC 有开销，但通常可忽略；如需极致性能可查表法优化

> [!pitfall] 常见踩坑
> 坑 1：**CRC 参数模型搞错** → 现象：自己算的 CRC 与设备返回的永远对不上 → 原因：同叫"CRC16"，Modbus（多项式 0x8005、初值 0xFFFF）与 CCITT（多项式 0x1021）完全不同 → 解决：对照协议文档逐项核对"多项式/初值/反转/输出顺序"，再用已知样本数据验证一遍（如协议文档常给"01 03 00 00 00 02 → CRC 0x..."的示例）
>
> 坑 2：**把 CRC 字节也算进校验范围** → 现象：接收端重算永远不等于发送端算的 → 原因：校验范围与"含 CRC 重算为 0"两种约定混用 → 解决：统一采用"发送端只对数据部分计算，接收端对数据部分重算比对"，并写注释说明
>
> 坑 3：**CRC 失败后静默丢弃** → 现象：现场偶发丢数没人发现，直到追溯才发现少了一段数据 → 原因：校验失败无记录 → 解决：失败计数 + 日志（记录帧内容与失败时间），连续失败触发报警或自动重发
>
> 坑 4：**安全场景误用 CRC** → 现象：认为 CRC 能防篡改 → 原因：CRC 只防"随机误码"，不防"恶意修改" → 解决：防篡改用 HMAC-SHA256（密钥参与计算）

> [!best] 最佳实践
> - **把 CRC 封装成独立类**：`Crc16Modbus.Compute(byte[])` 静态方法 + 单元测试用例（含协议官方示例向量），全项目复用
> - **收帧流程固定三步**：长度校验 → CRC 校验 → 才允许解析；校验失败不进入解析（见 `数据解析字节序类型转换`）
> - **保留失败样本日志**：记录校验失败帧的十六进制内容，方便与设备厂商联调排查是干扰还是协议不一致
> - **大数据块用官方库**：.NET 6+ 直接用 `System.IO.Hashing.Crc32`/`Crc64`，别自己造轮子
> - **帧头帧尾 + 长度 + CRC 组合使用**：单一校验不够，与长度字段、超时机制叠加构成可靠收帧（见 `采集系统总体设计`）

> [!practice] 上手练习
> **Lv.1 运行改参数**：运行示例输入不同十六进制数据点"计算 CRC16"，再点"模拟数据损坏(翻转1位)"，观察 CRC 如何因 1 位翻转而大变——体会 CRC 的检错能力
> **Lv.2 加属性**：把 HexBox 里输入的数据改成"00 00 00 00"再试，同时对比校验和与 CRC 的行为差异
> **Lv.3 改造**：实现"完整收帧验证"：自己拼一个 Modbus 读保持寄存器请求帧（地址+功能码+起始地址+寄存器数+CRC），写一个 `VerifyFrame(byte[] frame)` 对数据部分重算 CRC 并与帧尾比对，返回校验是否通过
> **Lv.4 挑战**：实现 CRC32（多项式 `0xEDB88320`、初值 `0xFFFFFFFF`、输出反转），与 `System.IO.Hashing.Crc32` 的结果对照；再把它接到 `本地文件存储jsonxmlcsv二进制` 的文件完整性校验里

> [!related] 相关知识链接
> - ← 前置知识：`数据解析字节序类型转换`（先拿到帧，才能算校验；CRC 也有字节序）
> - → 后续必学：`数据过滤与清洗`（校验通过的数据才进入清洗流程）、`数据转换与工程值计算`（清洗后再换算工程量）
> - ⇄ 关联概念：`存储策略与数据保留`（文件完整性校验）、`采集策略轮询事件驱动订阅`（校验失败触发重发/事件）
> - 📖 官方文档：[System.IO.Hashing.Crc32](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.hashing.crc32)、[System.Security.Cryptography.SHA256](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.cryptography.sha256)、[CRC 校验（Wikipedia）](https://zh.wikipedia.org/wiki/%E5%BE%AA%E7%8E%AF%E5%86%97%E4%BD%99%E6%A0%A1%E9%AA%8C)
