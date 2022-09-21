/**
 * filler负责填充资源，包括能量的填充、power的填充、ghodium的填充
 * filler是后期最重要的角色之一，它的存在用来评估是使用当前可利用能量还是能量上限来生产creep
 */
export const roleFiller = {
    run: function (creep) {
        // 生产中的creep不执行操作
        if (creep.spawning) {
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            return undefined;
        }

        // creep状态初始化
        creep.memory.state = 'working';

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
        }
        if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 30 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        // 切换工作内容
        let target;
        // 如果creep手上拿着能量，就做填充能量工作
        if (creep.store[RESOURCE_ENERGY] > 0) {
            target = Game.getObjectById(creep.memory.targetChoice) ||
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
                    return container.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }));
            creep.memory.fillTask = 'energy';
        }
        // 如果creep手上拿着power，就做填充power工作
        else if (creep.store[RESOURCE_POWER] > 0) {
            target = Game.getObjectById(creep.memory.targetChoice)
                || ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_POWER) > 10) ? creep.room.powerSpawn : null)
                || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_POWER) > 0) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_POWER) > 0) ? creep.room.terminal : null);
            creep.memory.fillTask = 'power';
        }
        // 如果creep手上拿着ghodium，就做填充ghodium工作
        else if (creep.store[RESOURCE_GHODIUM] > 0) {
            target = Game.getObjectById(creep.memory.targetChoice)
                || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.nuker : null)
                || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_GHODIUM) > 0) ? creep.room.terminal : null);
            creep.memory.fillTask = 'ghodium';
        }
        // 如果creep手上啥都没拿
        else {
            target = creep.pos.findClosestByRange(_.filter(creep.room.spawn.concat(creep.room.extension), (i) => {
                return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            })) ||
                creep.pos.findClosestByRange(_.filter(creep.room.tower, (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 200;
                })) ||
                ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 500) ? creep.room.powerSpawn : null)
                || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.nuker : null);
            // 如果有非Storage或Container或terminal的能量型目标，做填充能量工作
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
                // 没有任何填充工作
                else {
                    if (creep.memory.targetChoice) {
                        creep.memory.targetChoice = null;
                    }
                    creep.memory.state = 'resting';
                }
            }
        }

        if (target) {
            if (creep.memory.fillTask == 'energy') {
                fillWork('energy');
            }
            else if (creep.memory.fillTask == 'power') {
                fillWork('power');
            }
            else if (creep.memory.fillTask == 'ghodium') {
                fillWork('ghodium');
            }
            else {
                creep.memory.state = 'resting';
            }
        }

        function fillWork(resourceType) {
            let resource;
            switch (resourceType) {
                case 'energy': {
                    resource = RESOURCE_ENERGY;
                    break;
                }
                case 'power': {
                    resource = RESOURCE_POWER;
                    break;
                }
                case 'ghodium': {
                    resource = RESOURCE_GHODIUM;
                    break;
                }
            }
            // 身上满了
            if (creep.memory.ready) {
                if (!Game.getObjectById(creep.memory.targetChoice)) {
                    creep.memory.targetChoice = target.id;
                }
                if (creep.memory.sourceChoice) {
                    creep.memory.sourceChoice = null;
                }
                if (target instanceof StructurePowerSpawn) {
                    if (target.store.getFreeCapacity(resource) < 10) {
                        creep.memory.targetChoice = null;
                    }
                }
                else {
                    if (target.store.getFreeCapacity(resource) == 0) {
                        creep.memory.targetChoice = null;
                    }
                }

                if (creep.transfer(target, resource) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.memory.state = 'moving';
                }
            }
            // 身上空了
            else {
                if (creep.memory.targetChoice) {
                    creep.memory.targetChoice = null;
                }

                let source;
                if (resource == RESOURCE_ENERGY) {
                    source = Game.getObjectById(creep.memory.sourceChoice)
                        || ((creep.room.storage && creep.room.storage.store[resource] >
                            creep.getActiveBodyparts(CARRY) * 50) ? creep.room.storage : null)
                        || ((creep.room.terminal && creep.room.terminal.store[resource] >
                            creep.getActiveBodyparts(CARRY) * 50) ? creep.room.terminal : null)
                        || _.sample(_.filter(creep.room.sourceContainer, (container) => {
                            return container.store[resource] > creep.getActiveBodyparts(CARRY) * 50
                        }))
                }
                // Power和G有就拿去送，毕竟稀有可能经常拿不满身体（但都是能拿多少拿多少，反正多的会送回来）
                else {
                    source = Game.getObjectById(creep.memory.sourceChoice)
                        || ((creep.room.storage && creep.room.storage.store[resource] > 0) ? creep.room.storage : null)
                        || ((creep.room.terminal && creep.room.terminal.store[resource] > 0) ? creep.room.terminal : null);
                }

                if (source) {
                    if (!Game.getObjectById(creep.memory.sourceChoice)) {
                        creep.memory.sourceChoice = source.id;
                    }
                    if (source.store[resource] == 0) {
                        creep.memory.sourceChoice = null;
                    }

                    if (creep.withdraw(source, resource) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
                else {
                    creep.memory.state = 'resting';
                }
            }
        }
    }
}
