import { configs } from "../configs";

export const roleCentercarrier = {
    run: function (creep) {
        // 移动到中心位置
        if (!creep.memory.arrive && creep.pos.isEqualTo(configs.centerPoint[creep.room.name])) {
            creep.memory.arrive = true;
        }
        if (!creep.memory.arrive) {
            creep.moveTo(configs.centerPoint[creep.room.name], { visualizePathStyle: { stroke: '#ffffff' } });
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        // 自动控制
        if (creep.memory.autoControl && creep.memory.arrive) {
            // 工作状态切换
            if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
                creep.memory.ready = false;
            }
            if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
                creep.memory.ready = true;
            }

            // 身上有货
            if (creep.memory.ready) {
                let target = (creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ? creep.room.storage : null;
                if (target) {
                    creep.transfer(target, RESOURCE_ENERGY);
                }
            }
            // 身上空了
            else {
                let source = (creep.room.centerLink.length && creep.room.centerLink[0].store[RESOURCE_ENERGY] > 0) ?
                    creep.room.centerLink[0] : null;
                if (source) {
                    creep.withdraw(source, RESOURCE_ENERGY);
                }
            }
        }
    }
}