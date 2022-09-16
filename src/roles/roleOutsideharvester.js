import { configs } from "../configs";

export const roleOutsideharvester = {
    run: function (creep) {
        // 工作状态切换
        if (creep.memory.ready && creep.store[RESOURCE_ENERGY] == 0) {
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
            if (creep.memory.outsideSoucreRoomName) {
                creep.memory.outsideSoucreRoomName = null;
            }
            if (creep.memory.outsideSoucreId) {
                creep.memory.outsideSoucreId = null;
            }

            if (creep.room.name != creep.memory.originalRoomName) {
                creep.moveTo(new RoomPosition(19, 12, creep.memory.originalRoomName), {
                    reusePath: 50, visualizePathStyle: { stroke: '#ffffff' }
                });
            }
            else {
                let target = creep.room.storage;
                if (target && target.store.getFreeCapacity() > 0) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    Game.time % 5 ? null : creep.say('停工咯', true);
                }
            }
        }
        // 身上能量空了，先移动到随机外矿房间，再挖能量矿（暂时先这样写着），并记住该矿Id（由于可能切换外矿房间所以只记住一次）
        else {
            if (!creep.memory.outsideSoucreRoomName) {
                creep.memory.outsideSoucreRoomName =
                    _.sample(configs.outsideSoucreRoomSetting[creep.memory.originalRoomName]);
            }
            if (creep.room.name != creep.memory.outsideSoucreRoomName) {
                creep.moveTo(new RoomPosition(15, 5, creep.memory.outsideSoucreRoomName), {
                    reusePath: 50, visualizePathStyle: { stroke: '#ffffff' }
                });
            }
            else {
                let source = Game.getObjectById(creep.memory.outsideSoucreId) || _.sample(creep.room.find(FIND_SOURCES_ACTIVE));
                if (source) {
                    if (!(creep.memory.outsideSoucreId)) {
                        creep.memory.outsideSoucreId = source.id;
                    }

                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    Game.time % 5 ? null : creep.say('停工咯', true);
                }
            }
        }
    }
}
