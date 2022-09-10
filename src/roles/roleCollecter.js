export const roleCollecter = {
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

        let target = Game.getObjectById(creep.memory.targetChoice) ||
            (creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ? creep.room.storage : null;

        if (target) {
            // 身上满货，选择storage
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
                    }
                }
            }
            // 身上空了，选择sourceContainer和mineralContainer
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
                        }
                    }
                }
                else {
                    Game.time % 5 ? null : creep.say('玩去咯', true);
                }
            }
        }
        else {
            Game.time % 5 ? null : creep.say('玩去咯', true);
        }
    }
}
