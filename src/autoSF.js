/**
 * autoSF配置信息
 */
const autoSFConfig = {
    // 可以开启SF的房间等级，只有房间等级大于等于level才会开SF
    level: 4,
    // 不开SF的房间名称，默认无，即考虑所有属于自己的房间，需要请填入排除的房间名称
    excludeRooms: [],
    // 考虑的建筑类型，这些建筑掉血才会开启SF
    structureTypes: [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_TOWER, STRUCTURE_POWER_SPAWN, STRUCTURE_LAB, STRUCTURE_TERMINAL, STRUCTURE_NUKER, STRUCTURE_FACTORY, STRUCTURE_OBSERVER],
    // 是否在开启SF时发送邮件提醒
    ifNotify: true,
    // 建筑受损情况扫描时间间隔，数值过高存在建筑没被扫描就被摧毁导致不开SF的风险
    scanInterval: 10,
    // 开启了SF的tick，此后20000tick都不再需要检测
    activeTick: false,
};

/**
 * autoSF模块工作
 */
export const autoSF = {
    work: function () {
        // 检测是否已经开着SF
        if (autoSFConfig.activeTick) {
            if (Game.time - autoSFConfig.activeTick > 20000) {
                autoSFConfig.activeTick = false;
            }
            return undefined;
        }

        // 获取检测的房间
        watchRooms = _.filter(Object.values(Game.rooms), (room) => {
            return room.controller && room.controller.my && !autoSFConfig.excludeRooms.includes(room.name);
        });

        for (let room of watchRooms) {
            // 检查自卫战争时期标志，只有有room.memory.period才会检查，没有的话也不报错，但cpu消耗变高
            if (room.memory.period && !room.memory.period.warOfSelfDefence) {
                continue;
            }

            // 房间等级不符合条件或者没有可用SF次数或者SF还在冷却或者房间控制器被攻击的房间跳过
            if (room.controller.level < autoSFConfig.level ||
                room.controller.safeModeAvailable ||
                room.controller.safeModeCooldown ||
                room.controller.upgradeBlocked) { continue; }

            // 每隔一段时间间隔扫描一次建筑受损情况，直接摧毁建筑不会触发SF，可以放心自己拆除自己建筑
            if (!(Game.time % autoSFConfig.scanInterval)) {
                // 通用性写法，cpu消耗稍微高一点，不需要其他模块配合
                // let structures = room.find(FIND_MY_STRUCTURES, {
                //     filter: (structure) => {
                //         return autoSFConfig.structureTypes.includes(structure.structureType)
                //     }
                // });

                // 建筑索引写法，cpu消耗稍微低一点，需要建筑索引模块配合
                let structures = autoSFConfig.structureTypes.map((structureType) => {
                    return room[structureType] || [];
                }).flat();

                for (let structure of structures) {
                    // 建筑受损不严重，可视为系统怪误伤，先不开SF，建筑严重受损才开SF
                    if ((structure.hits / structure.hitsMax > 0.7)) { continue; }
                    // 开启SF并记录开启的tick，此后20000tick都不再需要检测
                    let flag = structure.room.controller.activateSafeMode();
                    autoSFConfig.activeTick = Game.time;
                    // 发送通知
                    if (autoSFConfig.ifNotify) {
                        if (flag == OK) {
                            Game.notify(`Room：${structure.room.name} 的 ${structure.structureType} 被攻击！！已开启SF！！`);
                        }
                        else {
                            Game.notify(`Room：${structure.room.name} 的 ${structure.structureType} 被攻击！！但是无法开启SF！！错误代码：${flag}！！`);
                        }
                    }
                    break;
                }
            }

            // 如果controller一格范围内有敌人判断为controller马上被攻击，直接开SF
            // 建议：controller周围一格用rampart围起来，防止敌人靠近（敌人攻击controller将导致无法使用SF）
            if (room.controller.pos.findInRange(FIND_HOSTILE_CREEPS, 1).length) {
                // 开启SF并记录开启的tick，此后20000tick都不再需要检测
                let flag = room.controller.activateSafeMode();
                autoSFConfig.activeTick = Game.time;
                // 发送通知
                if (autoSFConfig.ifNotify) {
                    if (flag == OK) {
                        Game.notify(`Room：${room.name} 的Controller被攻击！！已开启SF！！`);
                    }
                    else {
                        Game.notify(`Room：${room.name} 的Controller被攻击！！但是无法开启SF！！错误代码：${flag}！！`);
                    }
                }
                break;
            }
        }
    }
};
