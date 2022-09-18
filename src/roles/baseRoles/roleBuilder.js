/**
 * builder负责建造工地、维修墙和门，main.js里每100tick扫描一次是否需要生产builder
 * builder只要进入ifNeedBuilderWork状态就需要不停的建造或修理，哪怕墙、门都修到设定血量都不会停
 * 当下个100tick到来的时候会选择继续或者退出ifNeedBuilderWork状态，退出之后就不会再拿能量修理了
 */
export const roleBuilder = {
    run: function (creep) {
        // 手动控制
        if (!creep.memory.autoControl) {
            return undefined;
        }

        // creep状态初始化
        creep.memory.state = 'working';

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
            // 自卫战争时期紧急修墙，停止工地建设，找血量最低的需要维修的墙、门，最后再找随机的rampart，防止能量浪费
            if (creep.room.memory.code.warOfSelfDefence) {
                target = Game.getObjectById(creep.memory.targetChoice) ||
                    creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return judgeIfNeedBuilderWork(structure);
                        }
                    }).sort((i, j) => {
                        return i.hits - j.hits;
                    })[0] || _.sample(creep.room.rampart);
            }
            // 非自卫战争时期先找建筑工地，再找血量最低的需要维修的墙、门，最后再找随机的rampart，防止能量浪费
            else {
                target = Game.getObjectById(creep.memory.targetChoice) ||
                    creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES) ||
                    creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return judgeIfNeedBuilderWork(structure);
                        }
                    }).sort((i, j) => {
                        return i.hits - j.hits;
                    })[0] || _.sample(creep.room.rampart);
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
                        creep.memory.state = 'moving';
                    }
                }
                else {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
            }
            else {
                creep.room.memory.code.ifNeedBuilderWork = false;
                // Game.time % 5 ? null : creep.say('有能量没地方花', true);
                creep.memory.state = 'resting';
            }
        }

        // 身上能量空了，进入ifNeedBuilderWork状态时才去取能量，否则浪费
        else {
            if (creep.memory.targetChoice) {
                creep.memory.targetChoice = null;
            }

            if (creep.room.memory.code.ifNeedBuilderWork) {
                // 优先选择storage，其次选择terminal，其次随机选择一个sourceContainer，最后是根据开采位权重随机选择一个source
                let source = Game.getObjectById(creep.memory.sourceChoice) ||
                    ((creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] >
                        creep.getActiveBodyparts(CARRY) * 50) ? creep.room.storage : null) ||
                    ((creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] >
                        creep.getActiveBodyparts(CARRY) * 50) ? creep.room.terminal : null) ||
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
                    // Game.time % 5 ? null : creep.say('卧槽没能量了', true);
                    creep.memory.state = 'resting';
                }
            }
            else {
                // Game.time % 5 ? null : creep.say('100t内不干活', true);
                creep.memory.state = 'resting';
            }
        }
    }
}
