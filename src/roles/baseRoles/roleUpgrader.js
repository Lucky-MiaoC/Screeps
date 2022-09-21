/**
 * upgrader是升级者，它的任务是最简单的
 */
export const roleUpgrader = {
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
        if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 20 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        // 身上能量满了，选择Controller作为目标
        if (creep.memory.ready) {
            if (creep.memory.sourceChoice) {
                creep.memory.sourceChoice = null;
            }

            let target = creep.room.controller;

            if (target) {
                if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.memory.state = 'moving';
                }
            }
        }

        // 身上能量空了，优先选择storage，其次是terminal，再者随机选择一个sourceContainer，最后是根据开采位权重随机选择一个source
        else {
            let source = Game.getObjectById(creep.memory.sourceChoice)
                || ((creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] >
                    creep.getActiveBodyparts(CARRY) * 50) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] >
                    creep.getActiveBodyparts(CARRY) * 50) ? creep.room.terminal : null)
                || _.sample(_.filter(creep.room.sourceContainer, (container) => {
                    return container.store[RESOURCE_ENERGY] > creep.getActiveBodyparts(CARRY) * 50;
                }))
                || ((creep.room.sourceContainer.length || creep.room.sourceLink.length)
                    ? null : creep.room.chooseSourceByFreeSpaceWeight());

            if (source) {
                if ((!(source instanceof Source)) && source.store[RESOURCE_ENERGY] == 0) {
                    creep.memory.sourceChoice = null;
                }
                if (!Game.getObjectById(creep.memory.sourceChoice)) {
                    creep.memory.sourceChoice = source.id;
                }

                if (source instanceof Source) {
                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
                else {
                    if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
            }
            else {
                creep.memory.state = 'resting';
            }
        }
    }
}
