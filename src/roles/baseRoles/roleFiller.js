export const roleFiller = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 30 && creep.store.getUsedCapacity() == 0) {
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
            creep.memory.fillTask = null;
        }
        if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
            creep.memory.ready = true;
            creep.memory.sourceId = null;
        }

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target
            || (creep.memory.fillTask == 'power' && target.store.getFreeCapacity(RESOURCE_POWER) <= 10)
            || (creep.memory.fillTask == 'ghodium' && target.store.getFreeCapacity(RESOURCE_GHODIUM) == 0)
            || (creep.memory.fillTask == 'energy' &&
                target instanceof StructurePowerSpawn && target.store.getFreeCapacity(RESOURCE_ENERGY) <= 500)
            || (creep.memory.fillTask == 'energy' && !(target instanceof StructurePowerSpawn)
                && target.store.getFreeCapacity(RESOURCE_ENERGY) == 0)) {
            target = null;
            creep.memory.targetId = null;
            creep.memory.fillTask = null;
        }

        // 获取target
        // 如果creep手上拿着能量，就做填充能量工作
        if (creep.store[RESOURCE_ENERGY] > 0) {
            target = target ||
                creep.pos.findClosestByRange(_.filter(creep.room.spawn.concat(creep.room.extension), (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                })) ||
                creep.pos.findClosestByRange(_.filter(creep.room.tower, (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 200;
                })) ||
                ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 500) ? creep.room.powerSpawn : null)
                || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.nuker : null)
                || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.terminal : null)
                || _.sample(_.filter(creep.room.sourceContainer, (container) => {
                    return container.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }));
            creep.memory.fillTask = 'energy';
        }
        // 如果creep手上拿着power，就做填充power工作
        else if (creep.store[RESOURCE_POWER] > 0) {
            target = target
                || ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 10) ? creep.room.powerSpawn : null)
                || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_POWER) > 0) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_POWER) > 0) ? creep.room.terminal : null);
            creep.memory.fillTask = 'power';
        }
        // 如果creep手上拿着ghodium，就做填充ghodium工作
        else if (creep.store[RESOURCE_GHODIUM] > 0) {
            target = target
                || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.nuker : null)
                || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.terminal : null);
            creep.memory.fillTask = 'ghodium';
        }
        // 如果creep手上啥都没拿
        else {
            // 如果creep手上啥都没拿，需要时刻留意是否有energy类型的工作
            if (creep.memory.fillTask != 'energy') {
                target = null;
            }
            // 如果有非Storage或Container或terminal的能量型目标，做填充能量工作
            target = target ||
                creep.pos.findClosestByRange(_.filter(creep.room.spawn.concat(creep.room.extension), (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                })) ||
                creep.pos.findClosestByRange(_.filter(creep.room.tower, (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 200;
                })) ||
                ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 500) ? creep.room.powerSpawn : null)
                || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.nuker : null);

            if (target) {
                creep.memory.fillTask = 'energy';
            }
            else {
                target = ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 10) ? creep.room.powerSpawn : null)
                    || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.nuker : null);
                if (target) {
                    // 如果有power型目标，做填充power工作
                    if (target instanceof StructurePowerSpawn) {
                        creep.memory.fillTask = 'power';
                    }
                    // 如果有ghodium型目标，做填充ghodium工作
                    else if (target instanceof StructureNuker) {
                        creep.memory.fillTask = 'ghodium';
                    }
                }
            }
        }

        // 验证target
        if (!target) { return undefined; }

        // 缓存target
        if (!creep.memory.targetId) {
            creep.memory.targetId = target.id;
        }

        // 工作逻辑代码
        if (creep.memory.fillTask == 'energy') {
            fillWork(RESOURCE_ENERGY);
        }
        else if (creep.memory.fillTask == 'power') {
            fillWork(RESOURCE_POWER);
        }
        else if (creep.memory.fillTask == 'ghodium') {
            fillWork(RESOURCE_GHODIUM);
        }
        else {
            return undefined;
        }

        // 工作逻辑代码
        function fillWork(resourceType) {
            if (!creep.memory.ready) {
                // 获取source缓存
                let source = Game.getObjectById(creep.memory.sourceId);

                // 验证source缓存
                if (!source || source.store[resourceType] == 0) {
                    source = null;
                    creep.memory.sourceId = null;
                }

                // 获取source
                if (resourceType == RESOURCE_ENERGY) {
                    source = source
                        || ((creep.room.storage && creep.room.storage.store[resourceType] >
                            creep.getActiveBodyparts(CARRY) * 50) ? creep.room.storage : null)
                        || ((creep.room.terminal && creep.room.terminal.store[resourceType] >
                            creep.getActiveBodyparts(CARRY) * 50) ? creep.room.terminal : null)
                        || _.sample(_.filter(creep.room.sourceContainer, (container) => {
                            return container.store[resourceType] > 0;
                        }));
                }
                // Power和G有就拿去送，毕竟稀有可能经常拿不满身体（但都是能拿多少拿多少，反正多的会送回来）
                else {
                    source = source
                        || ((creep.room.storage && creep.room.storage.store[resourceType] > 0) ? creep.room.storage : null)
                        || ((creep.room.terminal && creep.room.terminal.store[resourceType] > 0) ? creep.room.terminal : null);
                }

                // 验证source
                if (!source) { return undefined; }

                // 缓存source
                if (!creep.memory.sourceId) {
                    creep.memory.sourceId = source.id;
                }

                // source交互
                if (creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                // target交互
                if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
}
