---
title: 库存管理与 RFID 集成
section: 14-projects
parent: 14.4 项目四：智能仓储管理系统 WMS（中高级）
---

# 库存管理与 RFID 集成

> [!plain] 白话理解
> 仓库管理员最怕两件事：货放在哪找不到、账上数量和实物对不上。RFID 给每个货品贴一张"电子标签"（相当于会说话的条码），读卡器一照，"标签 TAG-6204"就自动识别出是"轴承 6204"。上位机的库存管理就是围绕这张标签记账：扫码 → 识别货品 → 录入数量 → 库存自动增减。
> 示例里内置了三张"电子标签"对应的库存账本（轴承 6204 有 120 件、电机 750W 有 30 件、螺栓 M8 有 1000 件）。入库就加库存，出库先查账——"出 50 件但账上只有 30 件"会被当场拦截并红字提示。扫码、识别、记账、拦截，这一串动作就是 WMS 里最基本的出入库闭环；真实系统中账本换成「需求与数据库设计」里的数据库表，读卡器换成串口/USB 读卡器即可。

> [!def] 官方定义
> **RFID**（Radio Frequency Identification，射频识别）是一种利用无线电波**非接触式**自动识别物体的技术，由标签（Tag，含唯一编码 EPC/UID）、读写器（Reader）与应用系统组成。与条码相比，RFID 可批量读取、无需对准、可重写、抗污染，常用于仓储出入库、资产盘点、生产线追踪。
> **库存管理**（Inventory Management）指对库存数量、库位、批次的记录与控制，核心操作是入库（Inbound）、出库（Outbound）、移位与盘点；工程上要求出入库操作**原子性**与**库存非负约束**（出库量不得超过当前库存）。RFID 在仓储的应用规范可参考 EPCglobal 的 EPC 标签数据标准（https://www.gs1.org/standards/epc-rfid）。

> [!origin] 由来背景
> 库存管理的历史几乎与商业一样古老：从手工账本到 1974 年条形码（UPC）商用，再到 1990 年代 RFID 走向产业化——1999 年麻省理工 Auto-ID Center 提出"物联网"雏形（EPC 网络），沃尔玛 2005 年要求前 100 大供应商在托盘/箱体上使用 RFID 标签，极大推动了仓储应用。RFID 解决了条码的痛点：整托盘货品过门式通道即可批量识别，无需逐件扫码。
> 上位机在 WMS 中的角色，是把 RFID 读写器读到的事件变成"出入库业务"：读到标签 → 查货品 → 扣/加库存 → 落数据库 → 刷新台账。本篇示例用内存字典模拟了这张"电子标签台账"，把 RFID 的识别结果与库存增减、不足拦截的完整业务闭环跑通——这既是 WMS 的核心模块，也是「库位可视化展示」展示数据的数据源。

> [!essentials] 核心要点
> - **标签即身份**：RFID 标签（如 `TAG-6204`）是货品的唯一标识，扫码结果直接定位库存记录
> - **库存账本**：用 `Dictionary<string, (string Name, int Qty)>` 模拟"标签 → 货品 + 数量"，真实系统对应数据库库存表
> - **入库/出库**：入库加数量、出库减数量，操作成功后状态栏绿/橙提示并刷新台账
> - **非负约束**：出库前检查 `item.Qty < qty`，库存不足当场拦截（红字"库存不足"），杜绝负数库存
> - **统一校验**：`TryResolve` 集中校验"标签是否存在 + 数量是否合法"，入口统一、错误提示一致

> [!example] 完整示例
> **库存管理与 RFID 集成演示：模拟 RFID 读卡器扫码货品标签，输入数量后执行入库 / 出库，库存台账实时刷新；库存不足时出库会被拦截并提示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="库存管理与 RFID 集成" Height="460" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="RFID 扫码出入库" Foreground="#58A6FF" FontSize="14"
>                    FontWeight="Bold" Margin="0,0,0,10"/>
>         <Border Grid.Row="1" Background="#161B22" CornerRadius="6" Padding="10">
>             <StackPanel>
>                 <TextBlock Text="RFID 扫码结果" Foreground="#8B949E"/>
>                 <TextBlock x:Name="RfidText" Text="请扫描货品 RFID…" Foreground="#58A6FF"
>                            FontFamily="Consolas" Margin="0,4,0,0"/>
>                 <StackPanel Orientation="Horizontal" Margin="0,10,0,0">
>                     <TextBox x:Name="CodeBox" Text="TAG-6204" Width="120" Background="#21262D"
>                              Foreground="#58A6FF" Padding="4"/>
>                     <TextBox x:Name="QtyBox" Text="10" Width="60" Background="#21262D"
>                              Foreground="#58A6FF" Padding="4" Margin="8,0,0,0"/>
>                     <Button Content="入库" Click="OnIn" Margin="8,0,0,0" Padding="10"
>                             Background="#238636" Foreground="White"/>
>                     <Button Content="出库" Click="OnOut" Margin="8,0,0,0" Padding="10"
>                             Background="#DA3633" Foreground="White"/>
>                 </StackPanel>
>             </StackPanel>
>         </Border>
>         <Border Grid.Row="2" Background="#161B22" CornerRadius="6" Padding="10" Margin="0,10">
>             <StackPanel>
>                 <TextBlock Text="库存台账" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,6"/>
>                 <ListBox x:Name="StockList" Background="#21262D" Foreground="#8B949E"
>                          BorderThickness="0" FontFamily="Consolas" Height="180"/>
>             </StackPanel>
>         </Border>
>         <TextBlock Grid.Row="3" x:Name="StatusText" Text="就绪" Foreground="#8B949E" Margin="0,6,0,0"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 库存字典：标签 → (货品名, 数量)。真实项目存储于数据库
>         private readonly Dictionary<string, (string Name, int Qty)> _stock =
>             new Dictionary<string, (string, int)>
>             {
>                 { "TAG-6204", ("轴承 6204", 120) },
>                 { "TAG-750W", ("电机 750W", 30) },
>                 { "TAG-M8",   ("螺栓 M8", 1000) }
>             };
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             RefreshStock();
>         }
>
>         // 模拟 RFID 扫码：实际为读卡器触发读码事件后查表
>         private void SimulateScan(string tag)
>         {
>             RfidText.Text = $"标签 {tag}  →  货品：{_stock[tag].Name}";
>         }
>
>         private void OnIn(object sender, RoutedEventArgs e)
>         {
>             if (!TryResolve(out string tag, out int qty)) return;
>             var item = _stock[tag];
>             _stock[tag] = (item.Name, item.Qty + qty);
>             StatusText.Text = $"入库成功：{item.Name} +{qty}";
>             StatusText.Foreground = Brushes.LimeGreen;
>             RefreshStock();
>         }
>
>         private void OnOut(object sender, RoutedEventArgs e)
>         {
>             if (!TryResolve(out string tag, out int qty)) return;
>             var item = _stock[tag];
>             if (item.Qty < qty) // 库存不足拦截出库
>             {
>                 StatusText.Text = $"出库失败：{item.Name} 库存不足（当前 {item.Qty}）";
>                 StatusText.Foreground = Brushes.OrangeRed;
>                 return;
>             }
>             _stock[tag] = (item.Name, item.Qty - qty);
>             StatusText.Text = $"出库成功：{item.Name} -{qty}";
>             StatusText.Foreground = Brushes.Orange;
>             RefreshStock();
>         }
>
>         // 统一校验：标签是否存在 + 数量是否合法
>         private bool TryResolve(out string tag, out int qty)
>         {
>             tag = CodeBox.Text.Trim();
>             qty = 0;
>             if (!_stock.ContainsKey(tag))
>             {
>                 StatusText.Text = "未识别的 RFID 标签！";
>                 StatusText.Foreground = Brushes.OrangeRed;
>                 return false;
>             }
>             if (!int.TryParse(QtyBox.Text, out qty) || qty <= 0)
>             {
>                 StatusText.Text = "数量不合法！";
>                 StatusText.Foreground = Brushes.OrangeRed;
>                 return false;
>             }
>             SimulateScan(tag);
>             return true;
>         }
>
>         private void RefreshStock()
>         {
>             StockList.Items.Clear();
>             foreach (var kv in _stock)
>                 StockList.Items.Add($"{kv.Key,-10} {kv.Value.Name,-8} 库存 {kv.Value.Qty}");
>         }
>     }
> }
> ```
> 
> 

> [!scene] 适用场景
> ✅ 仓储出入库登记：扫码/读 RFID 后自动记账，替代手工录入，速度快、错漏少
> ✅ 库存非负管控：出库自动拦截超卖，避免"账上负数、实物没有"的库存漏洞
> ✅ 批量识别场景：托盘过通道式读卡器一次读多张标签，批量入库/盘点（条码做不到）
> ✅ 资产与工具管理：工具柜、仪器借还同样用"标签 + 台账"模型，复用本模块逻辑
> ❌ 单件扫码且无防错需求的极简登记：普通条码扫描枪足够，不必上 RFID
> ❌ 库存全靠人工盘点、无自动识别设备的环境：先建立盘点流程再谈 RFID 集成

> [!pitfall] 常见踩坑
> 坑 1：**出库不检查库存，出现负数** → 账上 -20 件，审计时根本对不上 → 出库前必须校验 `库存 ≥ 出库量`，不足即拦截并提示当前可用量
>
> 坑 2：**标签编码用肉眼字符串，不校验** → 手输 `TAG-6204 `（带空格）或小写 `tag-6204`，查无此货 → 标签统一规范（大写 + 去除空白 + Trim），未知标签明确提示"未识别"，不静默忽略
>
> 坑 3：**数量输入不合法就入库**（0、负数、字母）→ 库存被 0/负数污染 → `int.TryParse` + `qty > 0` 双重校验，非法输入提示"数量不合法"
>
> 坑 4：**只做内存操作不落库** → 程序重启库存全丢，账实两套 → 出入库写入数据库（见「需求与数据库设计」），内存操作只是演示

> [!best] 最佳实践
> - 出入库操作建议包成"一个事务"：扣库存 + 写流水记录要么都成功、要么都失败（真实库用 `BeginTransaction`）
> - 库存校验用"乐观锁/条件更新"防并发：多终端同时出库时用 `UPDATE ... WHERE qty >= x` 保证原子性
> - 标签映射（TAG → 货品）建唯一索引，入库前先查询货品是否存在，防脏数据
> - 操作反馈明确：成功（绿/橙）+ 失败（红）+ 原因，操作工一眼知道结果与原因
> - RFID 读卡器数据源抽成接口（`IRfidReader`），模拟读卡器与真实读卡器可无缝切换（见「modbus-通信层封装」的封装思路）
> - 演示数据标注"模拟"，真实对接按读卡器厂商 SDK（串口/网络协议）接入

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，分别对 `TAG-6204` 入库 10、出库 50（库存 120 足够）、出库 200（不足拦截）三种操作，观察台账与状态栏
> **Lv.2 小试牛刀**：在 `_stock` 中新增货品 `TAG-PLC`（"PLC S7-1200"，库存 5），并测试它的入库/出库/不足拦截
> **Lv.3 融会贯通**：把 `_stock` 换成 SQLite 库存表：建表（`Tag/Name/Qty`）、入库出库执行 `UPDATE` 并校验受影响行数，实现真实持久化
> **Lv.4 挑战**：为出入库增加"流水记录"（时间/标签/类型/数量，写入 `T_Record` 表），出库用事务保证"扣库存 + 写流水"原子性；再把读卡器抽成 `IRfidReader` 接口，实现模拟版与串口版两种实现

> [!related] 相关知识链接
> - ← 前置知识：数据落库与表设计见「需求与数据库设计」；标签数据的持久化技术见第 10 章「轻量级数据库-sqlite」；设备接入的封装思路见「modbus-通信层封装」
> - → 后续必学：库存数据如何画成仓库地图，见「库位可视化展示」
> - ⇄ 关联概念：同章「prism-模块划分」把出入库做成独立模块；「报警功能与历史数据」可为低库存加报警；14.7「历史趋势与报表」统计出入库流水
> - 📖 官方文档：https://www.gs1.org/standards/epc-rfid
