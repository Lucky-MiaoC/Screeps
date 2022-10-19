/**
 * 暂时限制powerCreep在其出生房间，以后会增加powerCreep多房间移动
 */
export const myPowerCreep = {
    run: function (creep) {
        // 如果该powerCreep还没生产则直接返回
        if (!creep.room) { return undefined; }

        // 手动控制
        if (creep.memory.autoControl) {
            // WRITE YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // 快死的时候赶紧renew
        if (creep.ticksToLive < 500) {
            if (creep.renew() == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.powerSpawn, { visualizePathStyle: { stroke: '#ff0000' } });
            }
            return undefined;
        }

        // 在对应房间启用power
        if (!creep.room.controller.isPowerEnabled) {
            if (creep.enableRoom(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ff0000' } });
            }
            return undefined;
        }

        // ops生成
        if (creep.powers[PWR_GENERATE_OPS].cooldown == 0 &&
            creep.store.getFreeCapacity(RESOURCE_OPS) >=
            POWER_INFO[PWR_GENERATE_OPS].effect[creep.powers[PWR_GENERATE_OPS].level - 1]) {
            creep.usePower(PWR_GENERATE_OPS);
            return undefined;
        }

        // ops生成满了就先储存起来
        if (creep.store.getFreeCapacity(RESOURCE_OPS) <
            POWER_INFO[PWR_GENERATE_OPS].effect[creep.powers[PWR_GENERATE_OPS].level]) {
            let traget =
                ((creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ? creep.room.storage : null)
                || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity() > 0) ? creep.room.terminal : null);
            if (traget) {
                if (creep.transfer(traget, RESOURCE_OPS) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(traget, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            }
            return undefined;
        }

        // 空闲的时候待在powerSpawn旁边，避免影响交通
        if (!creep.pos.isNearTo(creep.room.powerSpawn)) {
            creep.moveTo(creep.room.powerSpawn, { visualizePathStyle: { stroke: '#ff0000' } });
            return undefined;
        }
    }
};
