/**
 * 这是添加新角色的模板
 */
export const roleRole = {
    run: function (creep) {
        // 手动控制
        if (!creep.memory.autoControl) {
            // YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // creep状态初始化
        creep.memory.state = 'working' || 'moving' || 'resting';

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() == 0) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < TIME_YOU_WANT && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        if (creep.memory.ready) {
            // YOUR READY CODE
        }
        else {
            // YOUR NOT READY CODE
        }
    }
}
