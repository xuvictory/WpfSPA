---
title: ObservableCollection（上位机必用）
section: 00-prelude
parent: 数组与集合
---

# ObservableCollection（上位机必用）

> [!plain] 白话理解
> `ObservableCollection<T>` 是一个"会通知别人的 List"。普通的 `List` 你往里加东西删东西，它一声不吭——WPF 界面上的列表控件（如 `DataGrid`、`ListView`）根本不知道数据变了。`ObservableCollection` 不同：你每调用一次 `Add` 或 `Remove`，它就自动大喊"我变了！"，然后 WPF 的绑定系统就会自动刷新界面。这就是 MVVM 模式中"数据驱动UI"的核心——你永远不需要手动操作 UI 控件来刷新列表。

> [!def] 官方定义
> `ObservableCollection<T>` 是 `System.Collections.ObjectModel` 命名空间下的泛型集合类，继承自 `Collection<T>`，并实现了 `INotifyCollectionChanged` 接口。当集合中发生增/删/改/移动操作时，自动引发 `CollectionChanged` 事件。WPF 的 `ItemsControl`（包括 `ListBox`、`DataGrid`、`ComboBox` 等）会自动监听此事件来同步 UI。

> [!origin] 由来背景
> 在 WPF 诞生之前（WinForms 时代），更新列表数据需要两步：改数据源 + 调 `listBox.Refresh()`。一旦忘了调用 Refresh，数据和界面就对不上了。WPF 引入数据绑定（Data Binding）作为核心架构，`ObservableCollection` 就是这块拼图中最关键的一环——它让集合的变化"自动传播"到 UI，彻底消灭了手动刷新。上位机开发中，告警列表、设备列表、实时数据表格——几乎每一个 WPF 列表控件背后都是 `ObservableCollection`。

> [!essentials] 核心要点
> - 继承自 `Collection<T>`，所以拥有所有集合基本操作
> - 实现了 `INotifyCollectionChanged`：增删改移会自动通知 WPF 绑定
> - `Add`/`Remove`/`Insert`/`Move`/`Clear` 都会触发 `CollectionChanged` 事件
> - 替换索引器 `[index] = newItem` 也会触发事件
> - **重要**：元素的属性变化不会自动通知（如 `item.Name = "new"`），需要 `INotifyPropertyChanged`
> - 不是线程安全的：跨线程操作需要封送回 UI 线程（`Dispatcher.Invoke`）
> - 和 `List<T>` 的关键区别：多了自动通知，少了 `AddRange`（批量加会触发 N 次事件）

> [!example] 完整示例
> ```csharp
> using System.Collections.ObjectModel;
> using System.ComponentModel;
> using System.Runtime.CompilerServices;

> // ========== 可通知的模型类 ==========
> public class DeviceItem : INotifyPropertyChanged
> {
>     private string _name = "";
>     private double _temperature;
>     private bool _isOnline;
    
>     public string Name
>     {
>         get => _name;
>         set { _name = value; OnPropertyChanged(); }
>     }
    
>     public double Temperature
>     {
>         get => _temperature;
>         set { _temperature = value; OnPropertyChanged(); }
>     }
    
>     public bool IsOnline
>     {
>         get => _isOnline;
>         set { _isOnline = value; OnPropertyChanged(); }
>     }
    
>     public event PropertyChangedEventHandler? PropertyChanged;
>     protected void OnPropertyChanged([CallerMemberName] string? name = null)
>         => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
> }

> // ========== 上位机 ViewModel 示例 ==========
> public class DeviceMonitorViewModel
> {
>     // 这个集合绑定到 WPF 的 DataGrid.ItemsSource
>     public ObservableCollection<DeviceItem> Devices { get; } = new();
    
>     // 模拟添加设备
>     public void AddDevice(string name, double temp)
>     {
>         Devices.Add(new DeviceItem 
>         { 
>             Name = name, 
>             Temperature = temp, 
>             IsOnline = true 
>         });
>         // 不需要手动刷新 UI！WPF 自动更新
>     }
    
>     // 模拟更新温度（修改已有元素）
>     public void UpdateTemperature(string name, double newTemp)
>     {
>         var device = Devices.FirstOrDefault(d => d.Name == name);
>         if (device != null)
>             device.Temperature = newTemp;  // INotifyPropertyChanged 通知 WPF
>     }
    
>     // 移除离线设备
>     public void RemoveOfflineDevices()
>     {
>         for (int i = Devices.Count - 1; i >= 0; i--)
>         {
>             if (!Devices[i].IsOnline)
>                 Devices.RemoveAt(i);
>         }
>     }
> }

> // ========== 模拟使用 ==========
> var vm = new DeviceMonitorViewModel();

> // 添加设备——ObservableCollection 自动通知
> vm.AddDevice("PLC-001", 85.5);
> vm.AddDevice("压力传感器", 62.0);
> vm.AddDevice("温度变送器", 78.3);

> Console.WriteLine($"设备列表 ({vm.Devices.Count}):");
> foreach (var device in vm.Devices)
>     Console.WriteLine($"  {device.Name}: {device.Temperature}℃ [{(device.IsOnline ? "在线" : "离线")}]");

> // 更新温度——INotifyPropertyChanged 自动通知
> vm.UpdateTemperature("PLC-001", 82.0);
> Console.WriteLine($"\n更新后: {vm.Devices[0].Name} = {vm.Devices[0].Temperature}℃");
> ```

> [!scene] 适用场景
> ✅ WPF 中绑定到 `DataGrid`、`ListBox`、`ListView`、`ComboBox` 等 ItemsControl
> ✅ MVVM 架构中的集合属性（ViewModel 暴露给 View 的数据源）
> ✅ 实时更新的告警列表、设备列表、日志列表
> ✅ 动态菜单项、工具栏项
> ❌ 纯内存计算不需要 UI 同步的集合 → `List<T>` 性能更好
> ❌ 不需要增删通知的数据 → 普通 `List<T>` 就够了

> [!pitfall] 常见踩坑
> 坑 1：**修改元素属性不刷新界面** → `device[index].Name = "new"` 界面不更新！因为 `CollectionChanged` 只在集合增删时触发。解决：元素类**必须实现 `INotifyPropertyChanged`**。
> 坑 2：**子线程操作 `ObservableCollection` 会崩** → 串口接收线程直接 `Devices.Add(...)` → `InvalidOperationException`（跨线程访问 UI 元素）。解决：`Application.Current.Dispatcher.Invoke(() => Devices.Add(...))`。
> 坑 3：**`AddRange` 不存在，批量添加触发 N 次 UI 刷新** → 一次 Add 100 个元素就刷新 100 次界面，性能灾难。可以暂时解除绑定→批量加→恢复绑定，或用自定义扩展方法。

> [!best] 最佳实践
> - 元素类（Model）永远实现 `INotifyPropertyChanged`，配合 `ObservableCollection` 使用
> - 后端线程更新集合时，用 `Dispatcher.Invoke` 封送回 UI 线程
> - 批量添加用 `foreach` + `Add` 前先检查是否需要暂停通知
> - 删除用倒序 `for` 循环，避免索引漂移
> - MVVM 中永远把 `ObservableCollection` 放在 ViewModel 里，View 只通过 Binding 访问

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建一个实现 `INotifyPropertyChanged` 的 `SensorData` 类，放入 `ObservableCollection<SensorData>`
> **Lv.2 小试牛刀**：模拟数据刷新——定时器每秒随机更新某个传感器的温度，如果界面跟着变就说明通知链正确
> **Lv.3 融会贯通**：实现一个"日志缓冲窗口"：用 `ObservableCollection<string>` 存储最近 100 条日志，新日志 `Insert(0, ...)` ，超出 100 条自动 `RemoveAt` 尾部，绑定到 ListBox

> [!related] 相关知识链接
> - ← 前置知识：List 泛型集合
> - → 后续必学：INotifyPropertyChanged、MVVM 模式
> - ⇄ 关联概念：`BindingList<T>`（WinForms 的对应物）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.objectmodel.observablecollection-1
