import { configs } from "../../configs";

/**
 * centercarrier 负责Link搬运工作和中央运输工作
 * Link搬运工作指把centerLink里的能量搬到storage或者terminal
 * 中央运输工作指terminal、storage、factory三者之间资源交换
 */
export const roleCentercarrier = {
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

        // 移动到中心位置
        if (!creep.memory.arrive && configs.centerPoint[creep.room.name]) {
            if (creep.pos.isEqualTo(configs.centerPoint[creep.room.name])) {
                creep.memory.arrive = true;
            }
            else {
                creep.moveTo(configs.centerPoint[creep.room.name], { visualizePathStyle: { stroke: '#ffffff' } });
                creep.memory.state = 'moving';
            }

        }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
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
                let task = creep.room.memory.centerCarryTask[0];
                let id = task.id;
                let source = Game.getObjectById(task.sourceId);
                let target = Game.getObjectById(task.targetId);
                let resourceType = task.resourceType;
                let resourceNumber = task.resourceNumber;
                let progress = task.progress;
                let amount = resourceNumber - progress > creep.getActiveBodyparts(CARRY) * 50 ?
                    creep.getActiveBodyparts(CARRY) * 50 : resourceNumber - progress;

                if (creep.memory.ready) {
                    switch (creep.transfer(target, resourceType, amount)) {
                        case OK: {
                            task.progress += amount;
                            if (task.resourceNumber == task.progress) {
                                console.log(`成功完成房间${_room.name}中id为${taskId}的中央搬运任务！`);
                                creep.room.cancelCenterCarryTask(id);
                            }
                            break;
                        }
                        default:
                            creep.memory.state = 'resting';
                            break;
                    }
                }
                else {
                    switch (creep.withdraw(source, resourceType, amount)) {
                        case OK: {
                            break;
                        }
                        default:
                            creep.memory.state = 'resting';
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
                        creep.memory.state = 'resting';
                    }
                }
                else {
                    let source = (creep.room.centerLink.length && creep.room.centerLink[0].store[RESOURCE_ENERGY] > 0) ?
                        creep.room.centerLink[0] : null;
                    if (source) {
                        creep.withdraw(source, RESOURCE_ENERGY);
                    }
                    else {
                        creep.memory.state = 'resting';
                    }
                }
            }
        }
    }
}
