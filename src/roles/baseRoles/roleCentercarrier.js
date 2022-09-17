import { configs } from "../../configs";

/**
 * centercarrier 负责Link搬运工作和中央运输工作
 * Link搬运工作指把centerLink里的能量搬到storage或者terminal
 * 中央运输工作指terminal、storage、factory三者之间资源交换
 */
export const roleCentercarrier = {
    run: function (creep) {
        // 手动控制
        if (!creep.memory.autoControl) {
            return undefined;
        }

        // creep状态初始化
        creep.memory.busy = true;
        creep.memory.moving = false;

        // 移动到中心位置
        if (!creep.memory.arrive && creep.pos.isEqualTo(configs.centerPoint[creep.room.name])) {
            creep.memory.arrive = true;
        }
        if (!creep.memory.arrive) {
            creep.moveTo(configs.centerPoint[creep.room.name], { visualizePathStyle: { stroke: '#ffffff' } });
            creep.memory.moving = true;
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        // 到达中心位置
        if (creep.memory.arrive) {
            // 工作状态切换
            if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
                creep.memory.ready = false;
            }
            if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
                creep.memory.ready = true;
            }

            // 切换工作内容
            if ((creep.room.centerLink.length && creep.room.centerLink[0].store[RESOURCE_ENERGY] > 0 &&
                creep.store.getUsedCapacity() == 0) || !creep.room.memory.centerCarryTask.length) {
                creep.memory.doTask = false;
            }
            if ((!creep.room.centerLink.length || creep.room.centerLink[0].store[RESOURCE_ENERGY] == 0) &&
                creep.store.getUsedCapacity() == 0 && creep.room.memory.centerCarryTask.length) {
                creep.memory.doTask = true;
            }

            // 执行中央搬运任务
            if (creep.memory.doTask) {
                let id = creep.room.memory.centerCarryTask[0].id;
                let source = Game.getObjectById(creep.room.memory.centerCarryTask[0].sourceId);
                let target = Game.getObjectById(creep.room.memory.centerCarryTask[0].targetId);
                let resourceType = creep.room.memory.centerCarryTask[0].resourceType;
                let resourceNumber = (creep.room.memory.centerCarryTask[0].resourceNumber >
                    creep.getActiveBodyparts(CARRY) * 50) ? creep.getActiveBodyparts(CARRY) * 50 :
                    creep.room.memory.centerCarryTask[0].resourceNumber;

                if (creep.memory.ready) {
                    switch (creep.transfer(target, resourceType, resourceNumber)) {
                        case OK: {
                            creep.room.memory.centerCarryTask[0].resourceNumber =
                                creep.room.memory.centerCarryTask[0].resourceNumber - resourceNumber;
                            if (creep.room.memory.centerCarryTask[0].resourceNumber == 0) {
                                creep.room.cancelCenterCarryTask(id);
                            }
                            break;
                        }
                        default:
                            // Game.time % 5 ? null : creep.say('transfer不了', true);
                            creep.memory.busy = false;
                            break;
                    }
                }
                else {
                    switch (creep.withdraw(source, resourceType, resourceNumber)) {
                        case OK: {
                            break;
                        }
                        default:
                            // Game.time % 5 ? null : creep.say('withdraw不了', true);
                            creep.memory.busy = false;
                            break;
                    }
                }
            }
            // centerLink来能量了则搬运Link能量
            else {
                if (creep.memory.ready) {
                    let target = ((creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ?
                        creep.room.storage : null) ||
                        ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity() > 0) ?
                            creep.room.terminal : null);
                    if (target) {
                        creep.transfer(target, RESOURCE_ENERGY);
                    }
                    else {
                        // Game.time % 5 ? null : creep.say('卧槽能量没地方放了', true);
                        creep.memory.busy = false;
                    }
                }
                else {
                    let source = (creep.room.centerLink.length && creep.room.centerLink[0].store[RESOURCE_ENERGY] > 0) ?
                        creep.room.centerLink[0] : null;
                    if (source) {
                        creep.withdraw(source, RESOURCE_ENERGY);
                    }
                    else {
                        // Game.time % 5 ? null : creep.say('无聊啊不用搬能量', true);
                        creep.memory.busy = false;
                    }
                }
            }
        }
    }
}
