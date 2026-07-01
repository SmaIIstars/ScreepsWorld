# ScreepsWorld — 事件驱动 AI

基于**事件驱动架构**的 [Screeps](https://screeps.com/) 游戏 AI，使用 TypeScript 编写。

## 架构

系统只有两个原语：**事件**和**消费者**。Creep 和 Structure 统一为执行者，通过资质标签匹配来接任务。

`
Monitor ──publish──→ Event Bus ←── query/claim ── Workers
                          │                   ├── Creep
                          │                   └── Structure
                     cleanup/release
                          │
                     Lifecycle (死亡/摧毁)
`

### 核心模块

| 模块 | 职责 |
|---|---|
| core/EventBus.ts | 事件生命周期管理（publish / query / claim / complete / release / expire） |
| core/tagSystem.ts | 标签 + 能力阈值匹配（canWorkerTakeEvent / computeTags / computeCapacities） |
| ehavior/ | 可组装的行为模块（harvestEnergy / fillSpawn / upgradeController…） |
| worker/runtime.ts | Creep 运行时循环（查事件 → 领事件 → 执行 → 完成） |
| monitor/ | 房间状态感知 → 发布事件 |
| lifecycle/index.ts | 死亡检测 + 事件释放 + 持久化 |
| strategy/index.ts | 等级对应的孵化策略配置 |

### 设计原则

- **事件是唯一通信方式** — Monitor 不直接调 Creep，Creep 不直接访问 Monitor
- **标签决定能力，不绑定身份** — 任何有 ["work", "move"] 的 worker 都可以建造或升级
- **不追求完美分配，追求系统自愈** — Fallback 接活 → Monitor 发现缺口 → 补人
- **Lifecycle 不决策** — 只释放、清理、通知
- **空间换性能** — 利用 2M Memory 做事件缓存

## 快速开始

### 1. 安装依赖

`ash
pnpm install
`

### 2. 类型检查

`ash
npx tsc --noEmit
`

### 3. 构建

`ash
pnpm run build
`

构建产物输出到 output/main.js，可直接上传到 Screeps 服务器。

### 4. 发布

`ash
pnpm run release
`

## 事件系统

### 事件生命周期

`
publish → pending
            │
            ├── claim(worker) → claimed
            │                     ├── complete() → completed → 归档
            │                     ├── release()  → pending (超时/死亡)
            │                     └── expire()   → expired → 清理
            │
            └── expire() → expired（TTL 到了没人领）
`

### 事件类型

| type | requiredTags | 说明 |
|---|---|---|
| harvest_energy | ["harvest", "move"] | 采集能量 |
| fill_spawn | ["transport", "move"] | 填 Spawn |
| upgrade_controller | ["work", "move"] | 升级控制器 |
| build | ["work", "move"] | 建造 |
| repair | ["work", "move"] | 维修 |
| attack | ["attack", "move"] | 攻击 |
| defend | ["tower"] | 塔防御 |
| spawn_req | ["spawner"] | 孵化需求 |

### 标签匹配

`
事件: requiredTags = ["harvest", "move"]
     requiredCapacities = { harvest: 5 }

Worker: tags = ["harvest", "move"]
        capacities = { harvest: 6, carry: 50 }

匹配(两步):
  1. ["harvest", "move"] ⊆ ["harvest", "move"] ✓  (标签)
  2. harvest=6 ≥ 5 ✓                              (能力)
  → 完美匹配
`

## 源代码结构

`
src/
├── main.ts                   ← 游戏主循环
├── core/
│   ├── Event.ts              ← 事件类型常量
│   ├── EventBus.ts           ← 事件总线
│   └── tagSystem.ts          ← 标签/能力系统
├── behavior/                 ← 可组装的行为
├── worker/
│   └── runtime.ts            ← Creep 运行时
├── monitor/                  ← 房间状态感知
├── lifecycle/
│   └── index.ts              ← 死亡/清理
├── strategy/
│   └── index.ts              ← 策略配置
├── extension/                ← Screeps 原型扩展
└── types/                    ← 类型声明
`

## 新增行为

在 src/behavior/ 下创建新文件，实现 Behavior 接口：

`	ypescript
import { registerBehavior, Behavior } from './index';

const myBehavior: Behavior = {
  type: 'my_event_type',
  validate(event) { /* 事件是否有效 */ },
  execute(creep, event) { /* 每 tick 执行 */ },
  isComplete(creep, event) { /* 是否完成 */ },
};

registerBehavior(myBehavior);
`

然后在 monitor 中 publish 对应事件即可。

## 技术栈

- TypeScript
- [Vite](https://vitejs.dev/)（构建）
- [@types/screeps](https://github.com/screepers/typed-screeps)（类型）

