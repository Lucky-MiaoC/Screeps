export const roleFiller = {
    run: function (creep) {
        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 30 && creep.store[RESOURCE_ENERGY] == 0) {
            creep.suicide();
        }

        // 优先选择spawn或者extesion，其次选择tower，最后找powerSpawn，最后找nuker，最后有多的送回storage或者sourceContainer
        let target = Game.getObjectById(creep.memory.targetChoice) ||
            creep.pos.findClosestByRange(_.filter(creep.room.spawn.concat(creep.room.extension), (i) => {
                return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            })) ||
            creep.pos.findClosestByRange(_.filter(creep.room.tower, (i) => {
                return i.store.getFreeCapacity(RESOURCE_ENERGY) > 100;
            })) ||
            ((creep.room.powerSpawn && creep.room.powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.powerSpawn : null)
            || ((creep.room.nuker && creep.room.nuker.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.nuker : null)
            || ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ? creep.room.storage : null)
            || _.sample(_.filter(creep.room.sourceContainer, (container) => {
                return container.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }));

        if (target) {
            // 身上满了
            if (creep.memory.ready) {
                if (!Game.getObjectById(creep.memory.targetChoice)) {
                    creep.memory.targetChoice = target.id;
                }
                if (creep.memory.sourceChoice) {
                    creep.memory.sourceChoice = null;
                }
                if (target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    creep.memory.targetChoice = null;
                }

                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            // 身上空了，优先随机选择storage，其次选择sourceContainer
            else {
                if (creep.memory.targetChoice) {
                    creep.memory.targetChoice = null;
                }

                let source = Game.getObjectById(creep.memory.sourceChoice) ||
                    ((creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] >
                        creep.getActiveBodyparts(CARRY) * 50) ? creep.room.storage : null) ||
                    _.sample(_.filter(creep.room.sourceContainer, (container) => {
                        return container.store[RESOURCE_ENERGY] > creep.getActiveBodyparts(CARRY) * 50
                    }));

                // 防止从Storage或container里拿出放进
                if (source) {
                    if (target.structureType != source.structureType) {
                        if (!Game.getObjectById(creep.memory.sourceChoice)) {
                            creep.memory.sourceChoice = source.id;
                        }
                        if (source.store[RESOURCE_ENERGY] == 0) {
                            creep.memory.sourceChoice = null;
                        }

                        if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                    else {
                        Game.time % 5 ? null : creep.say('解放咯', true);
                    }
                }
                else {
                    Game.time % 5 ? null : creep.say('解放咯', true);
                }
            }
        }
        else {
            Game.time % 5 ? null : creep.say('解放咯', true);
        }
    }
}