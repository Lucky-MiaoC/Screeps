import { configs } from "../configs";

export const roleBuilder = {
    run: function (creep) {
        // 工作状态切换
        if (creep.memory.ready && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.ready = false;
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 30 && creep.store[RESOURCE_ENERGY] == 0) {
            creep.suicide();
        }

        // 身上能量满了，选择建筑工地或者血量最低的墙、门
        if (creep.memory.ready) {
            let target;
            // 自卫战争时期紧急修墙，停止工地建设，找血量最低的墙、门
            if (creep.room.memory.code.warOfSelfDefence) {
                target = Game.getObjectById(creep.memory.targetChoice) ||
                    creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return judgeIfNeedBuilderWork(structure);
                        }
                    }).sort((i, j) => {
                        return i.hits - j.hits;
                    })[0];
            }
            // 非自卫战争时期先找建筑工地，再找血量最低的墙、门
            else {
                target = Game.getObjectById(creep.memory.targetChoice) ||
                    creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES) ||
                    creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return judgeIfNeedBuilderWork(structure);
                        }
                    }).sort((i, j) => {
                        return i.hits - j.hits;
                    })[0];
            }

            if (!Game.getObjectById(creep.memory.targetChoice)) {
                creep.memory.targetChoice = target.id;
            }
            if (creep.memory.sourceChoice) {
                creep.memory.sourceChoice = null;
            }

            if (target) {
                if (target instanceof ConstructionSite) {
                    if (creep.build(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
            else {
                creep.room.memory.code.ifNeedBuilderWork = false;
            }
        }

        // 身上能量空了，target是工地或者target是墙、门的同时最低血量低于一定值才去取能量，否则浪费
        else {
            if (creep.memory.targetChoice) {
                creep.memory.targetChoice = null;
            }

            if (creep.room.memory.code.ifNeedBuilderWork) {
                // 优先选择storage，其次随机选择一个sourceContainer，最后是根据开采位权重随机选择一个source
                let source = Game.getObjectById(creep.memory.sourceChoice) ||
                    (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] >
                        creep.getActiveBodyparts(CARRY) * 50) ? creep.room.storage :
                    _.sample(_.filter(creep.room.sourceContainer, (container) => {
                        return container.store[RESOURCE_ENERGY] > creep.getActiveBodyparts(CARRY) * 50
                    })) || ((creep.room.sourceContainer.length || creep.room.sourceLink.length)
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
                        }
                    }
                    else {
                        if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                }
                else {
                    Game.time % 5 ? null : creep.say('偷懒咯', true);
                }
            }
            else {
                Game.time % 5 ? null : creep.say('偷懒咯', true);
            }
        }
    }
}
