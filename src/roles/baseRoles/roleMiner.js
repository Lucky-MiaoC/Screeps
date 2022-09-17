/**
 * miner是矿工，采取挖运分离，它的任务很简单，生产它的条件却很复杂
 */
export const roleMiner = {
    run: function (creep) {
        // 手动控制
        if (!creep.memory.autoControl) {
            return undefined;
        }

        // creep状态初始化
        creep.memory.busy = true;
        creep.memory.moving = false;

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
        }
        if (!creep.memory.ready && creep.store.getUsedCapacity() >= creep.getActiveBodyparts(WORK)) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        // 身上矿满了，选择mineralContainer作为目标
        if (creep.memory.ready) {
            let target = Game.getObjectById(creep.memory.targetChoice) || _.sample(_.filter(creep.room.mineralContainer, (container) => {
                return container.store.getFreeCapacity() > 0;
            }));

            if (target) {
                if (!Game.getObjectById(creep.memory.targetChoice)) {
                    creep.memory.targetChoice = target.id;
                }
                if (target.store.getFreeCapacity() == 0) {
                    creep.memory.targetChoice = null;
                }

                for (let resourceType in creep.store) {
                    if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.moving = true;
                    }
                }
            }
            else {
                // Game.time % 5 ? null : creep.say('没地方放矿了', true);
                creep.memory.busy = false;
            }
        }
        // 身上矿空了，选择矿藏作为来源
        else {
            let source = Game.getObjectById(creep.memory.sourceId) || creep.room.mineral;
            if (!creep.memory.sourceId) {
                creep.memory.sourceId = source.id;
            }
            if (creep.memory.targetChoice) {
                creep.memory.targetChoice = null;
            }

            if (source && (source.mineralAmount > 0) && creep.room.extractor && !creep.room.extractor.cooldown) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.memory.moving = true;
                }
            }
            else {
                // Game.time % 5 ? null : creep.say('矿干了，等吧', true);
                creep.memory.busy = false;
            }
        }
    }
}
