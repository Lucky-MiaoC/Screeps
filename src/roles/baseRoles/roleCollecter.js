/**
 * collecter负责收集资源，资源流向为sourceContainer和mineralContainer --> storage或者terminal
 * 以后可能会让他收集掉落的资源和墓碑资源，现阶段考虑到cpu开销不捡资源
 */
export const roleCollecter = {
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

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 30 && creep.getUsedCapacity() == 0) {
            creep.suicide();
        }

        let target = Game.getObjectById(creep.memory.targetChoice) ||
            ((creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ? creep.room.storage : null) ||
            ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity() > 0) ? creep.room.terminal : null);

        if (target) {
            // 身上满货，选择storage或者terminal
            if (creep.memory.ready) {
                if (!Game.getObjectById(creep.memory.targetChoice)) {
                    creep.memory.targetChoice = target.id;
                }
                if (creep.memory.sourceChoice) {
                    creep.memory.sourceChoice = null;
                }

                for (let resourceType in creep.store) {
                    if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
            }
            // 身上空了，随机选择sourceContainer和mineralContainer
            else {
                if (creep.memory.targetChoice) {
                    creep.memory.targetChoice = null;
                }

                let source = Game.getObjectById(creep.memory.sourceChoice) ||
                    _.sample(_.filter(creep.room.sourceContainer, (container) => {
                        return container.store.getUsedCapacity() > creep.getActiveBodyparts(CARRY) * 50;
                    })) ||
                    _.sample(_.filter(creep.room.mineralContainer, (container) => {
                        return container.store.getUsedCapacity() > creep.getActiveBodyparts(CARRY) * 50;
                    }));

                if (source) {
                    if (!Game.getObjectById(creep.memory.sourceChoice)) {
                        creep.memory.sourceChoice = source.id;
                    }
                    if (source.store.getUsedCapacity() == 0) {
                        creep.memory.sourceChoice = null;
                    }

                    for (let resourceType in source.store) {
                        if (creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE) {
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
        else {
            creep.memory.state = 'resting';
        }
    }
}
