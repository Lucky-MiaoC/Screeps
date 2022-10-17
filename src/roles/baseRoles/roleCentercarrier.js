import { configs } from "../../configs";

export const roleCentercarrier = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            // WRITE YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // 验证中心位置
        if (!configs.centerPoint[creep.room.name]) { return undefined; }

        // 移动到中心位置
        if (!creep.memory.arrive) {
            if (creep.pos.isEqualTo(configs.centerPoint[creep.room.name])) {
                creep.memory.arrive = true;
            }
            else {
                // 如果中心位置有人，对穿
                if (creep.pos.isNearTo(configs.centerPoint[creep.room.name])) {
                    let otherCreep = configs.centerPoint[creep.room.name].lookFor(LOOK_CREEPS)[0];
                    if (otherCreep) {
                        otherCreep.moveTo(creep, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                creep.moveTo(configs.centerPoint[creep.room.name], { visualizePathStyle: { stroke: '#ffffff' } });
                creep.memory.arrive = false;
            }
        }

        // 到达中心位置
        if (creep.memory.arrive) {
            // 工作状态切换
            if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
                creep.memory.ready = false;
                creep.memory.targetId = null;
            }
            if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
                creep.memory.ready = true;
                creep.memory.sourceId = null;
            }

            // 切换工作内容
            if ((creep.room.centerLink.length && creep.room.centerLink[0].store[RESOURCE_ENERGY] > 0 &&
                creep.store.getUsedCapacity() == 0) || !creep.room.memory.centerCarryTask) {
                creep.memory.doTask = false;
            }
            if ((!creep.room.centerLink.length || creep.room.centerLink[0].store[RESOURCE_ENERGY] == 0) &&
                creep.store.getUsedCapacity() == 0 && creep.room.memory.centerCarryTask) {
                creep.memory.doTask = true;
            }

            // 执行中央搬运任务
            if (creep.memory.doTask) {
                let task = creep.room.memory.centerCarryTask;
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
                                console.log(`成功完成房间${creep.room.name}的中央搬运任务！`);
                                creep.room.cancelCenterCarryTask();
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }
                else {
                    switch (creep.withdraw(source, resourceType, amount)) {
                        case OK: {
                            break;
                        }
                        default:
                            break;
                    }
                }
            }
            // centerLink来能量了则搬运Link能量
            else {
                // 获取target缓存
                let target = Game.getObjectById(creep.memory.targetId);

                // 验证target缓存
                if (!target || target.store.getFreeCapacity() == 0) {
                    target = null;
                    creep.memory.targetId = null;
                }
                // 获取target
                target = target
                    || ((creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ?
                        creep.room.storage : null)
                    || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity() > 0) ?
                        creep.room.terminal : null);

                // 验证target
                if (!target) { return undefined; }

                // 缓存target
                if (!creep.memory.targetId) {
                    creep.memory.targetId = target.id;
                }

                // 工作逻辑代码
                if (!creep.memory.ready) {
                    // 获取source缓存
                    let source = Game.getObjectById(creep.memory.sourceId);

                    // 验证source缓存
                    if (!source || source.store[RESOURCE_ENERGY] == 0) {
                        source = null;
                        creep.memory.sourceId = null;
                    }

                    // 获取source
                    source = source ||
                        ((creep.room.centerLink.length && creep.room.centerLink[0].store[RESOURCE_ENERGY] > 0) ?
                            creep.room.centerLink[0] : null);

                    // 验证source
                    if (!source) { return undefined; }

                    // 缓存source
                    if (!creep.memory.sourceId) {
                        creep.memory.sourceId = source.id;
                    }

                    // source交互
                    creep.withdraw(source, RESOURCE_ENERGY);
                }
                else {
                    // target交互
                    creep.transfer(target, RESOURCE_ENERGY);
                }
            }
        }
    }
};
