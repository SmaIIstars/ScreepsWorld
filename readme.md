# Screeps 游戏指南

## Body 组件能量消耗

| Body 组件     | 能量消耗 | 功能描述                   |
| ------------- | -------- | -------------------------- |
| WORK          | 100      | 挖掘、建造、升级控制器     |
| CARRY         | 50       | 携带资源                   |
| MOVE          | 50       | 移动                       |
| ATTACK        | 80       | 攻击                       |
| RANGED_ATTACK | 150      | 远程攻击                   |
| HEAL          | 250      | 治疗                       |
| CLAIM         | 600      | 占领控制器                 |
| TOUGH         | 10       | 增加生命值（但容易被攻击） |

## 建筑通行性规则

| 建筑类型   | 结构常量                | 是否可通行 | 说明                     |
| ---------- | ----------------------- | ---------- | ------------------------ |
| 扩展       | `STRUCTURE_EXTENSION`   | ✅ 是      | Creep 可以穿过和站在上面 |
| 道路       | `STRUCTURE_ROAD`        | ✅ 是      | 移动速度提升             |
| 容器       | `STRUCTURE_CONTAINER`   | ✅ 是      | 可以穿过和站在上面       |
| 城墙       | `STRUCTURE_RAMPART`     | ✅ 是\*    | 需要控制权才能通行       |
| 墙         | `STRUCTURE_WALL`        | ✅ 是\*    | 需要控制权才能通行       |
| 孵化器     | `STRUCTURE_SPAWN`       | ❌ 否      | 阻挡 Creep 移动          |
| 防御塔     | `STRUCTURE_TOWER`       | ❌ 否      | 阻挡 Creep 移动          |
| 仓库       | `STRUCTURE_STORAGE`     | ❌ 否      | 阻挡 Creep 移动          |
| 终端       | `STRUCTURE_TERMINAL`    | ❌ 否      | 阻挡 Creep 移动          |
| 观察者     | `STRUCTURE_OBSERVER`    | ❌ 否      | 阻挡 Creep 移动          |
| 能量孵化器 | `STRUCTURE_POWER_SPAWN` | ❌ 否      | 阻挡 Creep 移动          |
| 核弹发射器 | `STRUCTURE_NUKER`       | ❌ 否      | 阻挡 Creep 移动          |

> - 城墙和墙需要你有控制权才能通行，否则会阻挡移动。
