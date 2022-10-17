export const roleMiner = {
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

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
            creep.memory.targetId = null;
        }
        if (!creep.memory.ready && creep.store.getUsedCapacity() > 0) {
            creep.memory.ready = true;
            // creep.memory.sourceId = null;
        }

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target || target.store.getFreeCapacity() == 0) {
            target = null;
            creep.memory.targetId = null;
        }

        // 获取target
        target = target || _.sample(_.filter(creep.room.mineralContainer, (container) => {
            return container.store.getFreeCapacity() > 0;
        }));

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
            // if (!source || !creep.room.extractor || creep.room.extractor.cooldown || source.mineralAmount == 0) {
            //     source = null;
            //     // creep.memory.sourceId = null;
            // }

            // 获取source
            source = source || ((creep.room.mineral && creep.room.mineral.mineralAmount > 0
                && creep.room.extractor && !creep.room.extractor.cooldown) ? creep.room.mineral : null);

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            if (!creep.memory.sourceId) {
                creep.memory.sourceId = source.id;
            }

            // source交互
            if (creep.room.extractor && !creep.room.extractor.cooldown && source.mineralAmount != 0) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
        else {
            // target交互
            for (let resourceType in creep.store) {
                if (creep.transfer(target, resourceType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                break;
            }
        }
    }
};
