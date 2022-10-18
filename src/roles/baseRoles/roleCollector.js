export const roleCollector = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 25 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            // WRITE YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
            creep.memory.targetId = null;
        }
        if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
            creep.memory.ready = true;
            creep.memory.sourceId = null;
        }

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target || target.store.getFreeCapacity() == 0) {
            target = null;
            creep.memory.targetId = null;
        }

        // 获取target
        target = target
            || ((creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ? creep.room.storage : null)
            || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity() > 0) ? creep.room.terminal : null)

        // 验证target
        if (!target) { return undefined; }

        // 缓存target
        if (!creep.memory.targetId) {
            creep.memory.targetId = target.id;
        }

        // 工作逻辑代码
        if (!creep.memory.ready) {
            // 获取source缓存
            let source = Game.getObjectById(creep.memory.sourceId);

            // 验证source缓存
            if (!source || source.store.getUsedCapacity() == 0) {
                source = null;
                creep.memory.sourceId = null;
            }

            // 获取source
            source = source
                || creep.chooseSourceContainer(500)
                || _.sample(_.filter(creep.room.mineralContainer, (container) => {
                    return container.store.getUsedCapacity() >= 500;
                }));

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            if (!creep.memory.sourceId) {
                creep.memory.sourceId = source.id;
            }

            // source交互
            for (let resourceType in source.store) {
                if (creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                    break;
                }
            }
        }
        else {
            // target交互
            for (let resourceType in creep.store) {
                if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    break;
                }
            }
        }
    }
};


/*
import { roleFiller } from "./roleFiller";

export const roleCollector = {
    run: function (creep) {
        // 当filler数量为0并且自己身上为空或者只有能量时，代替filler工作，否则做自己的工作
        if ((!creep.room.memory.creepNumber['filler']
            || _.filter(creep.room.spawn, (spawn) => {
                return spawn.spawning && /filler/i.test(spawn.spawning.name);
            }).length == creep.room.memory.creepNumber['filler'])
            && creep.store.getUsedCapacity() == creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
            creep.memory.targetId = null;
            creep.memory.sourceId = null;
            creep.memory.changeRole = true;
            roleFiller.run(creep);
            return undefined;
        }

        // 不再代替filler工作时，将targetId和sourceId重置
        if (creep.memory.changeRole) {
            creep.memory.targetId = null;
            creep.memory.sourceId = null;
            creep.memory.changeRole = false;
        }

        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 25 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            // WRITE YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
            creep.memory.targetId = null;
        }
        if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
            creep.memory.ready = true;
            creep.memory.sourceId = null;
        }

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target
            || (target instanceof StructurePowerSpawn && target.store.getFreeCapacity(RESOURCE_POWER) <= 10)
            || (target instanceof StructureNuker && target.store.getFreeCapacity(RESOURCE_GHODIUM) == 0)
            || ((target instanceof StructureStorage || target instanceof StructureTerminal)
                && target.store.getFreeCapacity() == 0)) {
            target = null;
            creep.memory.targetId = null;
        }

        // nuker和powerSpawn在有GHODIUM和POWER时才会被选中
        let GHODIUM_Number = 0;
        let POWER_Number = 0;
        if (!target) {
            GHODIUM_Number = (creep.room.storage ? creep.room.storage.store[RESOURCE_GHODIUM] : 0) +
                (creep.room.terminal ? creep.room.terminal.store[RESOURCE_GHODIUM] : 0);
            POWER_Number = (creep.room.storage ? creep.room.storage.store[RESOURCE_POWER] : 0) +
                (creep.room.terminal ? creep.room.terminal.store[RESOURCE_POWER] : 0);
        }

        // 获取target
        target = target
            || ((GHODIUM_Number > 0 && !creep.store[RESOURCE_ENERGY] && creep.room.nuker
                && creep.room.nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ?
                creep.room.nuker : null)
            || ((POWER_Number > 0 && !creep.store[RESOURCE_ENERGY] && creep.room.powerSpawn
                && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 10) ?
                creep.room.powerSpawn : null)
            || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ?
                creep.room.storage : null)
            || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ?
                creep.room.terminal : null);

        // 验证target
        if (!target) { return undefined; }

        // 缓存target
        if (!creep.memory.targetId) {
            creep.memory.targetId = target.id;
        }

        // 工作逻辑代码
        if (!creep.memory.ready) {
            // 获取source缓存
            let source = Game.getObjectById(creep.memory.sourceId);

            // 验证source缓存
            if (!source
                || (target instanceof StructurePowerSpawn && source.store.getUsedCapacity(RESOURCE_POWER) == 0)
                || (target instanceof StructureNuker && source.store.getUsedCapacity(RESOURCE_GHODIUM) == 0)
                || (target instanceof StructureContainer && source.store.getUsedCapacity() == 0)) {
                source = null;
                creep.memory.sourceId = null;
            }

            // 获取source
            if (target instanceof StructurePowerSpawn) {
                source = source
                    || ((creep.room.storage && creep.room.storage.store[RESOURCE_POWER] > 0) ?
                        creep.room.storage : null)
                    || ((creep.room.terminal && creep.room.terminal.store[RESOURCE_POWER] > 0) ?
                        creep.room.terminal : null);
            }
            else if (target instanceof StructureNuker) {
                source = source
                    || ((creep.room.storage && creep.room.storage.store[RESOURCE_GHODIUM] > 0) ?
                        creep.room.storage : null)
                    || ((creep.room.terminal && creep.room.terminal.store[RESOURCE_GHODIUM] > 0) ?
                        creep.room.terminal : null);
            }
            else {
                source = source
                    || this.chooseSourceContainer(500)
                    || _.sample(_.filter(creep.room.mineralContainer, (container) => {
                        return container.store.getUsedCapacity() > 1000;
                    }));
            }

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            if (!creep.memory.sourceId) {
                creep.memory.sourceId = source.id;
            }

            // source交互
            if (target instanceof StructurePowerSpawn) {
                if (creep.withdraw(source, RESOURCE_POWER) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else if (target instanceof StructureNuker) {
                if (creep.withdraw(source, RESOURCE_GHODIUM) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                for (let resourceType in source.store) {
                    if (creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        break;
                    }
                }
            }
        }
        else {
            // target交互
            for (let resourceType in creep.store) {
                if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    break;
                }
            }
        }
    }
};
*/
