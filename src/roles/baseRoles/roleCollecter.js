export const roleCollecter = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 30 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            // WRITE YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
            creep.memory.targetId = null;
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
            creep.memory.ready = true;
            creep.memory.sourceId = null;
        }

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target || target.store.getFreeCapacity() == 0) {
            target = null;
            creep.memory.targetId = null;
        }

        // 获取target
        target = target
            || ((creep.room.storage && creep.room.storage.store.getFreeCapacity() > 0) ? creep.room.storage : null)
            || ((creep.room.terminal && creep.room.terminal.store.getFreeCapacity() > 0) ? creep.room.terminal : null)
            || ((creep.room.factory && creep.room.factory.store.getFreeCapacity() > 0) ? creep.room.factory : null);

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
            source = source || _.sample(_.filter(creep.room.sourceContainer, (container) => {
                return container.store.getUsedCapacity() > creep.getActiveBodyparts(CARRY) * 50;
            }))
                || _.sample(_.filter(creep.room.mineralContainer, (container) => {
                    return container.store.getUsedCapacity() > creep.getActiveBodyparts(CARRY) * 50;
                }));

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            if (!creep.memory.sourceId) {
                creep.memory.sourceId = source.id;
            }

            // source交互
            for (let resourceType in source.store) {
                if (creep.withdraw(source, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                    break;
                }
            }
        }
        else {
            // target交互
            for (let resourceType in creep.store) {
                if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    break;
                }
            }
        }
    }
}
