# 任务驱动系统 (Task-Driven System)

## 概述

任务驱动系统是一个模块化的 Screeps 代码架构，将房间管理和 creep 行为分解为独立的任务模块。系统通过任务队列来协调各种操作，提高代码的可维护性和扩展性。

## 系统总结

### 🏗️ 系统架构

1. **TaskQueue** - 任务队列管理器
2. **TaskSystem** - 任务系统主入口
3. **TaskPublisher** - 任务发布器
4. **TaskExecutor** - 任务执行器
5. **TaskMonitor** - 任务监控器
6. **TaskDrivenCreep** - 任务驱动的 creep 角色系统

### 🔧 核心功能

1. **自动任务发布**: 根据房间状态自动发布采集、升级、建造、维修、传输等任务
2. **智能任务分配**: 将任务分配给合适的 creep 角色
3. **任务执行管理**: 监控任务执行状态，处理完成和失败情况
4. **性能监控**: 提供详细的系统状态和性能指标
5. **过期清理**: 自动清理过期任务，防止内存泄漏

### 📁 文件结构

```
src/lib/
├── taskSystem/
│   ├── index.ts          # 任务系统主入口
│   ├── publisher.ts      # 任务发布器
│   ├── executor.ts       # 任务执行器
│   └── monitor.ts        # 任务监控器
├── roles/
│   └── taskDrivenCreep.ts # 任务驱动creep系统
├── utils/
│   └── taskQueue.ts      # 任务队列管理器
└── README.md             # 详细文档
```

### 🎯 主要优势

1. **模块化设计**: 每个组件职责明确，便于维护和扩展
2. **自动化管理**: 系统自动发布、分配和执行任务
3. **智能调度**: 根据 creep 角色和能力分配任务
4. **实时监控**: 提供详细的系统状态和性能指标
5. **错误处理**: 完善的错误处理和任务重试机制

## 系统架构

### 核心组件

1. **TaskQueue** (`src/lib/utils/taskQueue.ts`)

   - 任务队列管理器
   - 负责任务的存储、检索和状态管理

2. **TaskSystem** (`src/lib/taskSystem/index.ts`)

   - 任务系统主入口
   - 协调任务的发布、分配和执行

3. **TaskPublisher** (`src/lib/taskSystem/publisher.ts`)

   - 任务发布器
   - 根据房间状态自动发布各种任务

4. **TaskExecutor** (`src/lib/taskSystem/executor.ts`)

   - 任务执行器
   - 将任务分配给合适的 creep 并执行

5. **TaskMonitor** (`src/lib/taskSystem/monitor.ts`)

   - 任务监控器
   - 监控系统状态和性能指标

6. **TaskDrivenCreep** (`src/lib/roles/taskDrivenCreep.ts`)
   - 任务驱动的 creep 角色系统
   - 让 creep 能够执行任务系统分配的任务

## 任务类型

系统支持以下任务类型：

- **harvest**: 采集能量
- **upgrade**: 升级控制器
- **build**: 建造建筑
- **repair**: 维修建筑
- **transfer**: 传输资源

## 使用方法

### 1. 基本使用

```typescript
// 在 main loop 中调用
import { runTaskSystem } from './lib/taskSystem';

const loop = () => {
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (room.controller?.my) {
      runTaskSystem(room);
    }
  }
};
```

### 2. 任务驱动 Creep

```typescript
import { TaskDrivenCreep } from './lib/roles/taskDrivenCreep';
import { taskSystem } from './lib/taskSystem';

const taskDrivenCreep = new TaskDrivenCreep(taskSystem['taskQueue']);

// 在 creep 循环中调用
for (const name in Game.creeps) {
  const creep = Game.creeps[name];
  taskDrivenCreep.run(creep);
}
```

### 3. 监控系统状态

```typescript
import { taskSystem } from './lib/taskSystem';

// 获取任务队列状态
const status = taskSystem.getStatus();
console.log(`总任务数: ${status.totalTasks}`);
console.log(`待分配: ${status.publishedTasks}`);
console.log(`执行中: ${status.assignedTasks}`);
console.log(`已完成: ${status.completedTasks}`);
```

## 任务生命周期

1. **发布 (Published)**: 任务被创建并添加到队列
2. **分配 (Assigned)**: 任务被分配给特定的 creep
3. **执行 (In Progress)**: creep 正在执行任务
4. **完成 (Completed)**: 任务成功完成
5. **失败 (Failed)**: 任务执行失败，重新发布
6. **过期 (Expired)**: 任务超时，被系统清理

## 配置和扩展

### 添加新的任务类型

1. 在 `TaskPublisher` 中添加发布逻辑
2. 在 `TaskExecutor` 中添加执行逻辑
3. 在 `TaskDrivenCreep` 中添加 creep 行为逻辑

### 自定义任务优先级

可以通过修改任务分配逻辑来实现优先级系统：

```typescript
// 在 TaskExecutor.assignTasks 中
const suitableTask = tasks
  .filter((task) => task.allowedCreepRoles.includes(creep.memory.role || ''))
  .sort((a, b) => getTaskPriority(b) - getTaskPriority(a))[0];
```

## 性能优化

### 1. 任务缓存

系统会自动缓存任务，避免重复创建相同的任务。

### 2. 过期清理

系统会定期清理过期的任务，防止内存泄漏。

### 3. 批量处理

任务分配和执行采用批量处理，提高效率。

## 调试和监控

### 控制台输出

系统会在控制台输出详细的状态信息：

```
[任务监控][E49S54] 任务队列状态:
  - 总任务数: 15
  - 待分配: 5
  - 执行中: 8
  - 已完成: 2

[任务驱动] Harvester1 获取任务: harvest_5e9e8b8c1234567890abcdef_12345
[任务驱动] Upgrader1 完成任务: upgrade_5e9e8b8c1234567890abcdef_12346
```

### 性能指标

可以通过 `TaskMonitor` 获取性能指标：

```typescript
const metrics = taskMonitor.getPerformanceMetrics();
console.log(`任务完成率: ${metrics.taskCompletionRate * 100}%`);
console.log(`平均任务时长: ${metrics.averageTaskDuration} ticks`);
console.log(`空闲 creep 率: ${metrics.idleCreepRate * 100}%`);
```

## 最佳实践

1. **任务粒度**: 将任务分解为合适的粒度，避免过于复杂
2. **错误处理**: 在任务执行中添加适当的错误处理
3. **资源管理**: 合理分配资源，避免资源竞争
4. **监控**: 定期监控系统状态，及时发现问题
5. **扩展性**: 设计时考虑系统的扩展性，便于添加新功能

## 故障排除

### 常见问题

1. **任务不分配**: 检查 creep 角色是否在 `allowedCreepRoles` 中
2. **任务不执行**: 检查目标对象是否存在且有效
3. **性能问题**: 检查任务数量是否过多，考虑增加清理频率

### 调试技巧

1. 使用 `console.log` 输出任务状态
2. 检查 creep 的 `currentTask` 内存
3. 监控任务队列的长度和状态分布

## 快速开始

### 1. 启用任务驱动系统

在 `src/index2.ts` 中已经集成了任务系统：

```typescript
// 任务系统会自动运行
runTaskSystem(room);

// creep会自动执行任务
taskDrivenCreep.run(creep);
```

### 2. 监控系统运行

系统会在控制台输出详细的状态信息，包括：

- 任务队列状态
- Creep 任务分配情况
- 房间资源状态
- 任务完成情况

### 3. 扩展系统功能

可以通过以下方式扩展系统：

- 添加新的任务类型
- 自定义任务优先级
- 实现更复杂的分配算法
- 添加更多的监控指标

## 系统状态

当前系统已实现的功能：

- ✅ 任务队列管理
- ✅ 自动任务发布
- ✅ 智能任务分配
- ✅ 任务执行监控
- ✅ 性能指标统计
- ✅ 过期任务清理
- ✅ 错误处理机制
