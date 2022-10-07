export const roleHarvester = {
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
        if (!creep.memory.ready && creep.store.getFreeCapacity() <= 2) {
            creep.memory.ready = true;
            // creep.memory.sourceId = null;
        }

        // harvester特殊，需要先获取creep.memory.sourceId，从而定位target，并且不清除creep.memory.sourceId
        // 这段代码先这样写着，以后可能会改来让风格统一
        if (!creep.memory.sourceId) {
            creep.memory.sourceId = creep.pos.findClosestByRange(_.filter(creep.room.source, (source) => {
                return creep.room.memory.sourceInfo[source.id] == 'unreserved';
            })).id;
            creep.room.memory.sourceInfo[creep.memory.sourceId] = 'reserved';
        }

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            target = null;
            creep.memory.targetId = null;
        }

        // 获取target
        target = target || _.filter(Game.getObjectById(creep.memory.sourceId).pos.findInRange(creep.room.sourceLink, 2), (link) => {
            return link.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        })[0]
            || _.filter(Game.getObjectById(creep.memory.sourceId).pos.findInRange(creep.room.sourceContainer, 2), (container) => {
                return container.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            })[0]
            || ((Game.getObjectById(creep.memory.sourceId).pos.findInRange(creep.room.sourceLink, 2).length ||
                Game.getObjectById(creep.memory.sourceId).pos.findInRange(creep.room.sourceContainer, 2).length) ? null :
                creep.pos.findClosestByPath(_.filter(creep.room.spawn.concat(creep.room.extension), (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                })));

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
            // Harvester的source属于必定存在、条件不足也不会更换的对象，因此可以省略验证缓存部分，将条件判断放到source交互去
            // if (!source) {
            //     source = null;
            //     // creep.memory.sourceId = null;
            // }

            // 获取source
            // source = source || creep.pos.findClosestByRange(_.filter(creep.room.source, (source) => {
            //     return creep.room.memory.sourceInfo[source.id] == 'unreserved';
            // }));

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            // if (!creep.memory.sourceId) {
            //     creep.memory.sourceId = source.id;
            //     creep.room.memory.sourceInfo[source.id] = 'reserved';
            // }

            // source交互
            if (source.energy != 0) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
        else {
            // target交互
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
}
