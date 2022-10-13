/**
 * 这是添加新角色的模板（简单版）
 */
export const roleRole_0 = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < TIME_YOU_WANT && creep.store.getUsedCapacity() == 0) {
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
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
            creep.memory.ready = true;
        }

        // 工作逻辑代码
        if (!creep.memory.ready) {
            // WRITE YOUR CODE WHEN CREEP IS NOT READY
        }
        else {
            // WRITE YOUR CODE WHEN CREEP IS READY
        }
    }
};


/**
 * 这是添加新角色的模板（target导向）
 */
export const roleRole_1 = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < TIME_YOU_WANT && creep.store.getUsedCapacity() == 0) {
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
        if (!target || YOUR_JUDGEMENT) {
            target = null;
            creep.memory.targetId = null;
        }

        // 获取target
        target = target || TARGET_YOU_WANT;

        // 验证target
        if (!target) { return undefined; }

        // 缓存target
        if (!creep.memory.targetId) {
            creep.memory.targetId = target.id;
        }

        // 工作逻辑代码
        if (!creep.memory.ready) {
            /*WRITE YOUR CODE WHEN CREEP IS NOT READY*/

            // 获取source缓存
            let source = Game.getObjectById(creep.memory.sourceId);

            // 验证source缓存
            if (!source || YOUR_JUDGEMENT) {
                source = null;
                creep.memory.sourceId = null;
            }

            // 获取source
            source = source || SOURCE_YOU_WANT;

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            if (!creep.memory.sourceId) {
                creep.memory.sourceId = source.id;
            }

            // source交互
            if (creep.ACTION(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
        else {
            /*WRITE YOUR CODE WHEN CREEP IS READY*/

            // target交互
            if (creep.ACTION(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};
