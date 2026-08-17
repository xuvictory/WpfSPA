---
title: 数据访问（Repository 模式）
section: 07-mvvm
parent: 7.2 Model 层
---

# 数据访问（Repository 模式）

> [!plain] 白话理解
> 设备数据存哪里？可能先在内存假数据里跑，上线后换 SQLite，再后来接 MySQL——如果 ViewModel 直接写"查数据库的代码"，每换一次数据源，所有用到的地方都要改。
> Repository（仓储）模式就是在"数据源"和"业务"之间加一层接口：ViewModel 只认 `IDeviceRepository.GetAll()` 这个约定，不关心背后是内存、数据库还是 API。**换数据源时只换实现类，业务代码一行不动；测试时传一个假仓储，不连数据库也能测。** 就像订餐只认"外卖平台"，不管今天是哪家店在送。

> [!def] 官方定义
> Repository 模式是 Martin Fowler 在《企业应用架构模式》中定义的一种**数据访问抽象模式**（非控件、非 WPF 专属）：它介于领域层与数据映射层之间，以接口形式暴露"集合式"的存取操作（`GetAll`、`GetById`、`Add`、`Update`、`Delete`），屏蔽底层存储细节（数据库、文件、PLC、HTTP API）。
> 核心特征：
> - **面向接口**：业务/ViewModel 只依赖 `IDeviceRepository`，实现类可替换（内存/EF Core/Dapper/API）；
> - **集合语义**：调用方感觉自己在操作集合，不感知 SQL、连接、事务；
> - **与 IoC 搭配**：配合依赖注入容器，运行时自动装配具体实现（见 7.6「di-在-mvvm-中的应用」）。
> 参考：https://martinfowler.com/eaaCatalog/repository.html

> [!origin] 由来背景
> 数据访问代码有个通病：SQL、连接字符串、表结构散落在各个窗口的后台代码里，数据库一改结构、一换类型，全项目跟着遭殃。领域驱动设计（DDD）在 2000 年代初强调"领域层不该被持久化细节污染"，Martin Fowler 于是把 Repository 写进《企业应用架构模式》：把存取动作收敛为接口，领域层只谈"设备、订单"这些业务概念，不谈"SELECT、Connection"。EF Core、NHibernate 等 ORM 的仓储实现让这套模式落地成本大幅降低，如今"接口 + 实现 + 依赖注入"已成为 .NET 桌面与 Web 项目数据层的标配结构。

> [!essentials] 核心要点
> - **接口即契约**：`IDeviceRepository` 定义领域语义的存取方法，不暴露 `Connection`、`DbCommand` 等实现细节
> - **集合式返回**：查询返回 `List<T>`/`IReadOnlyList<T>`，具体存储由实现决定，调用方无需关心
> - **构造注入**：ViewModel 通过构造函数接收仓储接口，测试时传入 Mock（见示例 `MainViewModel(IDeviceRepository)`）
> - **异步友好**：耗时存取用 `Task<List<T>>`（如 `GetAllAsync`），配合 `async/await` 避免界面卡顿
> - **职责边界**：仓储管"存取"，ViewModel 管"加工展示"，验证/业务规则不放仓储里

> [!example] 完整示例
> **Repository 模式演示：定义 IDeviceRepository 接口，用内存实现类模拟数据库，ViewModel 只面向接口编程，切换数据源（数据库/API）不用改界面代码：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Repository 模式" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="15">
>         <TextBlock DockPanel.Dock="Top" Text="设备列表（通过 Repository 读取）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel DockPanel.Dock="Bottom" Orientation="Horizontal" Margin="0,10,0,0">
>             <Button Content="刷新列表" Command="{Binding LoadCommand}" Padding="8"
>                     Background="#21262D" Foreground="White"/>
>             <TextBlock Text="{Binding LoadInfo}" Foreground="#238636" VerticalAlignment="Center"
>                        Margin="12,0,0,0"/>
>         </StackPanel>
>         <DataGrid ItemsSource="{Binding Devices}" AutoGenerateColumns="False"
>                   Background="#161B22" Foreground="White" BorderBrush="#21262D"
>                   HeadersVisibility="Column" GridLinesVisibility="None">
>             <DataGrid.Columns>
>                 <DataGridTextColumn Header="编号" Binding="{Binding Id}" Width="80"/>
>                 <DataGridTextColumn Header="名称" Binding="{Binding Name}" Width="*"/>
>                 <DataGridTextColumn Header="区域" Binding="{Binding Area}" Width="120"/>
>                 <DataGridTextColumn Header="状态" Binding="{Binding Status}" Width="80"/>
>             </DataGrid.Columns>
>         </DataGrid>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— Repository 接口与实现：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Collections.ObjectModel;
> using System.ComponentModel;
> using System.Linq;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     public class DeviceEntity
>     {
>         public int Id { get; set; }
>         public string Name { get; set; }
>         public string Area { get; set; }
>         public string Status { get; set; }
>     }
>
>     // ── 仓储接口：定义数据访问契约，与具体存储无关 ──
>     public interface IDeviceRepository
>     {
>         List<DeviceEntity> GetAll();
>         DeviceEntity GetById(int id);
>     }
>
>     // ── 内存实现：模拟数据库（生产环境换成 EF Core / SqlSugar / Dapper 实现）──
>     public class MemoryDeviceRepository : IDeviceRepository
>     {
>         private readonly List<DeviceEntity> _data = new List<DeviceEntity>
>         {
>             new DeviceEntity { Id = 1, Name = "空压机", Area = "动力车间", Status = "运行" },
>             new DeviceEntity { Id = 2, Name = "冷水机", Area = "动力车间", Status = "运行" },
>             new DeviceEntity { Id = 3, Name = "贴片机", Area = "SMT车间", Status = "停机" }
>         };
>
>         public List<DeviceEntity> GetAll() => _data;
>         public DeviceEntity GetById(int id) => _data.FirstOrDefault(d => d.Id == id);
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private readonly IDeviceRepository _repository; // 只依赖接口
>         private string _loadInfo;
>
>         public ObservableCollection<DeviceEntity> Devices { get; } =
>             new ObservableCollection<DeviceEntity>();
>         public string LoadInfo { get; private set; }
>         public ICommand LoadCommand { get; }
>
>         // 构造注入仓储，便于单元测试时替换为 Mock
>         public MainViewModel(IDeviceRepository repository)
>         {
>             _repository = repository;
>             LoadCommand = new RelayCommand(Load);
>             Load();
>         }
>
>         private void Load()
>         {
>             Devices.Clear();
>             foreach (var d in _repository.GetAll()) Devices.Add(d);
>             LoadInfo = "共加载 " + Devices.Count + " 台设备";
>             OnPropertyChanged(nameof(LoadInfo));
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
>             DataContext = new MainViewModel(new MemoryDeviceRepository());
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备台账/历史报警从数据库查询展示：仓储隔离 SQL，换数据库零改动
> ✅ 上位机数据来源多变：开发期用内存假数据，现场接 SQLite/MySQL，只需替换实现
> ✅ 多窗口共用同一数据源：多个 ViewModel 注入同一仓储实例，数据一致性有保障
> ✅ 需要单元测试的模块：测试传假仓储（固定返回 3 台设备），断言列表加载逻辑
> ❌ 单次读取的极简场景（如读一个配置项）：直接 `AppConfig.Load()` 静态方法更省事，不必上仓储
> ❌ 高频实时采集（PLC 寄存器轮询）：那是设备驱动层的职责，仓储面向"业务数据"，两者勿混

> [!pitfall] 常见踩坑
> 坑 1：**接口跟着 SQL 走** → 仓储接口里有 `GetDevicesByAreaAndStatus(string sql)` 这类方法，等于把实现细节暴露给调用方。接口方法应该是业务语义（`GetByArea(string area)`），实现内部才写 SQL
>
> 坑 2：**仓储里掺业务规则** → 在仓储里判断"温度超限要报警"。仓储职责是存取，规则应放 ViewModel/服务层，否则换数据源时规则跟着丢
>
> 坑 3：**同步接口做耗时查询** → `GetAll()` 阻塞 UI 线程 3 秒，界面假死。用异步接口 + `async/await`，配合加载状态提示
>
> 坑 4：**测试时依赖真实数据库** → 单元测试连 MySQL，CI 环境没库就全红。测试必须注入假实现（返回写死数据），集成测试才碰真库

> [!best] 最佳实践
> - 接口方法命名用业务词汇：`GetAll`、`GetById`、`FindByKeyword`，别叫 `QueryData`、`Exec` 这类泛名
> - 小项目别过度设计：一个实体一个仓储接口即可；界面只读展示时，仓储只放 `GetAll`/`GetById` 也完全够用
> - 结合依赖注入注册单例/作用域：`services.AddSingleton<IDeviceRepository, MemoryDeviceRepository>()`，运行时换实现只改注册行
> - 复杂查询（多条件+排序+分页）返回专用查询对象（如 `DeviceQuery`）而非堆参数，避免接口签名爆炸
> - 批量写入（如导出报表）在仓储实现里用事务（`DbTransaction`），失败整体回滚，别逐条提交

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，把 `MemoryDeviceRepository` 构造里的数据改成 5 台，点"刷新列表"观察数据源切换对界面零影响
> **Lv.2 小试牛刀**：给接口加 `GetByArea(string area)`，内存实现按区域过滤，ViewModel 加"区域筛选"TextBox
> **Lv.3 融会贯通**：把接口方法改为 `Task<List<DeviceEntity>> GetAllAsync()`，用 `await Task.Run` 模拟慢查询，加载期间按钮禁用（`IsLoading`）
> **Lv.4 挑战**：写一个 `FakeDeviceRepository` 在单元测试中返回固定 3 台设备，断言 `Load()` 后 `Devices.Count == 3`——验证 ViewModel 不依赖任何真实存储

> [!related] 相关知识链接
> - ← 前置知识：「数据实体定义」理解仓储存取的实体；「mvvm-各层职责」确认仓储在 Model 层
> - → 后续必学：「dto-vs-entity」看仓储返回实体后如何映射给界面；7.6「di-在-mvvm-中的应用」看如何自动装配实现
> - ⇄ 关联概念：「什么是依赖注入」「常用-di-容器」是本模式落地的基础设施
> - 📖 参考：Martin Fowler《Repository》https://martinfowler.com/eaaCatalog/repository.html
