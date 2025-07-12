# CPU 优化指南

## 概述

在 Screeps 中，CPU 开销是限制代码性能的关键因素。本指南提供了详细的 CPU 优化策略和最佳实践。

## CPU 限制

### 账户类型

- **免费账户**: 每 tick 20 CPU
- **付费账户**: 每 tick 100+ CPU（根据订阅等级）
- **CPU 超限**: 超过限制时代码停止执行

### 常见操作 CPU 开销

| 操作                        | CPU 开销 | 说明                       |
| --------------------------- | -------- | -------------------------- |
| `Game.rooms[roomName]`      | 0.2      | 访问房间对象               |
| `room.find()`               | 0.5-2.0  | 查找对象，范围越大开销越高 |
| `creep.moveTo()`            | 0.5-1.0  | 路径查找                   |
| `creep.harvest()`           | 0.2      | 采集操作                   |
| `creep.upgradeController()` | 0.2      | 升级操作                   |
| `console.log()`             | 0.1      | 日志输出                   |
| `JSON.stringify()`          | 0.5-2.0  | 序列化操作                 |
| `Math.random()`             | 0.1      | 随机数生成                 |

## 优化策略

### 1. 缓存优化

#### 问题代码

```typescript
// 每 tick 都重复查找
for (const name in Game.creeps) {
  const creep = Game.creeps[name];
  const room = Game.rooms[creep.memory.roomName]; // 重复访问
}
```

#### 优化代码

```typescript
// 缓存房间对象
for (const roomName in Game.rooms) {
  const room = Game.rooms[roomName];
  const creepsInRoom = Object.values(Game.creeps).filter((c) => c.room.name === roomName);
  // 使用缓存的 room 对象
}
```

### 2. 减少查找范围

#### 问题代码

```typescript
// 全局查找
const allCreeps = Object.values(Game.creeps);
```

#### 优化代码

```typescript
// 按房间查找
const creepsInRoom = room.find(FIND_MY_CREEPS);
```

### 3. 批量处理

#### 问题代码

```typescript
// 逐个处理
for (const creep of creeps) {
  if (creep.memory.role === 'harvester') {
    // 处理逻辑
  }
}
```

#### 优化代码

```typescript
// 批量处理
const harvesters = creeps.filter((c) => c.memory.role === 'harvester');
// 批量处理 harvesters
```

### 4. 条件执行

#### 问题代码

```typescript
// 总是执行
if (Game.time % 10 === 0) {
  console.log('Status update');
}
```

#### 优化代码

```typescript
// 条件执行
if (Game.time % 100 === 0 && DEBUG_MODE) {
  console.log('Status update');
}
```

## CPU 优化器使用

### 基本使用

```typescript
import { CPUOptimizer } from './cpuOptimizer';

// 开始计时
CPUOptimizer.startTimer();

// 执行代码
// ... 你的代码 ...

// 结束计时
CPUOptimizer.endTimer('My Function');
```

### 缓存使用

```typescript
// 缓存查找结果
const sources = CPUOptimizer.getCached(
  `sources_${room.name}`,
  () => room.find(FIND_SOURCES),
  50 // 缓存 50 tick
);
```

### 批量处理

```typescript
// 批量处理项目
CPUOptimizer.batchProcess(
  items,
  (item) => {
    // 处理单个项目
  },
  10
); // 每 tick 处理 10 个
```

### 条件执行

```typescript
// 条件执行
CPUOptimizer.conditionalExecute(
  condition,
  () => {
    // 执行逻辑
  },
  20 // 每 20 tick 执行一次
);
```

## 任务系统优化

### 优化后的任务发布

```typescript
import { OptimizedTaskSystem } from './optimizedTaskSystem';

const optimizedSystem = new OptimizedTaskSystem(taskQueue);

// 优化后的任务发布
optimizedSystem.publishTasksOptimized(room);

// 优化后的任务分配
optimizedSystem.assignTasksOptimized(room);

// 优化后的任务执行
optimizedSystem.executeTasksOptimized(room);
```

### 性能监控

```typescript
// 获取性能报告
optimizedSystem.getPerformanceReport();

// 输出示例：
// [性能报告] CPU使用: 12.34/20 (61.7%)
// [性能报告] CPU桶: 45
// [性能报告] 任务状态: { published: 5, assigned: 8, completed: 2 }
```

## 最佳实践

### 1. 避免重复计算

- 缓存频繁访问的对象
- 使用内存存储计算结果
- 避免在循环中重复查找

### 2. 减少查找范围

- 使用房间级别的查找而不是全局查找
- 使用过滤器减少结果集
- 批量处理而不是逐个处理

### 3. 条件执行

- 只在需要时执行昂贵的操作
- 使用频率控制减少执行次数
- 根据游戏状态调整执行频率

### 4. 内存管理

- 定期清理过期缓存
- 避免内存泄漏
- 使用适当的数据结构

### 5. 监控和调试

- 使用 CPU 计时器监控性能
- 定期输出性能报告
- 根据性能数据调整优化策略

## 性能目标

### 免费账户 (< 20 CPU)

- 基础功能：采集、升级、建造
- 简单的任务分配
- 基本的监控功能

### 付费账户 (< 80 CPU)

- 完整的任务系统
- 智能路径查找
- 详细的性能监控
- 多房间管理

### 高级优化 (< 50 CPU)

- 缓存所有频繁访问的对象
- 批量处理所有操作
- 智能的条件执行
- 内存优化

## 调试技巧

### 1. CPU 监控

```typescript
// 在代码开始处
const startCPU = Game.cpu.getUsed();

// 在代码结束处
const usedCPU = Game.cpu.getUsed() - startCPU;
console.log(`Function used ${usedCPU.toFixed(2)} CPU`);
```

### 2. 性能分析

```typescript
// 分析不同操作的 CPU 开销
const operations = {
  'room.find': () => room.find(FIND_MY_CREEPS),
  'creep.moveTo': () => creep.moveTo(target),
  'cache.lookup': () => getCachedValue(key),
};

for (const [name, operation] of Object.entries(operations)) {
  const start = Game.cpu.getUsed();
  operation();
  const used = Game.cpu.getUsed() - start;
  console.log(`${name}: ${used.toFixed(2)} CPU`);
}
```

### 3. 内存使用监控

```typescript
// 监控内存使用
const memorySize = JSON.stringify(Memory).length;
console.log(`Memory size: ${memorySize} bytes`);
```

## 常见问题

### Q: 为什么我的代码 CPU 使用率很高？

A: 检查是否有重复的对象查找、不必要的循环、或频繁的日志输出。

### Q: 如何优化路径查找？

A: 使用缓存存储路径结果，减少 `moveTo` 调用频率。

### Q: 批量处理的最佳批次大小是多少？

A: 根据你的 CPU 限制调整，通常 5-10 个是一个好的起点。

### Q: 什么时候应该清理缓存？

A: 定期清理（每 100-1000 tick），或当缓存大小超过阈值时。

## 总结

CPU 优化是 Screeps 开发中的关键技能。通过合理使用缓存、批量处理、条件执行和性能监控，可以显著提高代码效率。记住：

1. **测量** - 总是监控 CPU 使用情况
2. **缓存** - 避免重复计算
3. **批量** - 批量处理而不是逐个处理
4. **条件** - 只在需要时执行
5. **监控** - 持续监控和优化
