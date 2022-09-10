export const roleWarcarrier = {
    run: function (creep) {
        if (Game.rooms['W59N37'].memory.code.warOfRevolution) {
            // 工作状态切换
            if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
                creep.memory.ready = false;
            }
            if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
                creep.memory.ready = true;
            }

            // 快死的时候趁着身上没能量赶紧死，否则增加寻路消耗
            if (creep.ticksToLive < 30 && creep.store[RESOURCE_ENERGY] == 0) {
                creep.suicide();
            }

            // 身上能量满了，先移动到原房间，再放到Storage里
            if (creep.memory.ready) {
                if (creep.memory.soucreChoice) {
                    creep.memory.soucreChoice = null;
                }

                if (creep.room.name != 'W59N37') {
                    creep.moveTo(new RoomPosition(47, 11, 'W59N37'), {
                        reusePath: 50, visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
                else {
                    let target = creep.room.storage;
                    if (target && target.store.getFreeCapacity() > 0) {
                        for (let resourceType in creep.store) {
                            if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                            }
                        }
                    }
                    else {
                        Game.time % 5 ? null : creep.say('休整咯', true);
                    }
                }
            }
            // 身上能量空了，先移动到随机外矿房间，再挖能量矿（暂时先这样写着），并记住该矿Id（由于可能切换外矿房间所以只记住一次）
            else {
                if (creep.room.name != 'W57N39') {
                    creep.moveTo(new RoomPosition(18, 46, 'W57N39'), {
                        reusePath: 50, visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
                else {
                    // 先去搬Terminal再去搬Storage最后搬Extension
                    let terminal = Game.getObjectById('62b188c5def5465c5396243e');
                    let storage = Game.getObjectById('62ad421e5ae7b035235dfcec');
                    let source = Game.getObjectById(creep.memory.soucreChoice) || (terminal.store.getUsedCapacity() > 0 ? terminal : null) ||
                        (storage.store.getUsedCapacity() > 0 ? storage : null) || creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_EXTENSION ||
                                    structure.structureType == STRUCTURE_LINK) && structure.store[RESOURCE_ENERGY] > 0;
                            }
                        });

                    if (source) {
                        if (!Game.getObjectById(creep.memory.soucreChoice)) {
                            creep.memory.soucreChoice = source.id;
                        }

                        if (source.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                            creep.memory.soucreChoice = null;
                        }

                        for (let resourceType in source.store) {
                            if (creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                            }
                        }
                    }
                    else {
                        Game.time % 5 ? null : creep.say('停工咯', true);
                    }
                }
            }
        }
        else {
            if (creep.store[RESOURCE_ENERGY] == 0) {
                creep.suicide();
            }
        }
    }
}