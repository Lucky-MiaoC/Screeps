/**
 * autoSF配置信息
 */
const _config = {
    // 可以开启SF的房间等级，只有房间等级大于等于level才会开SF
    level: 4,
    // 考虑开启SF的房间，默认所有属于自己的房间
    rooms: _.filter(Object.values(Game.rooms), (room) => {
        return room.controller && room.controller.my;
    }),
    // 考虑的建筑类型，这些建筑掉血才会开启SF
    structureTypes: [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_TOWER, STRUCTURE_POWER_SPAWN, STRUCTURE_LAB, STRUCTURE_TERMINAL, STRUCTURE_NUKER, STRUCTURE_FACTORY],
    // 是否在开启SF时发送邮件提醒
    ifNotify: true,
}

/**
 * autoSF模块工作
 */
export const autoSF = {
    work: function () {
        for (let room of _config.rooms) {
            // 检查自卫战争时期标志，只有有room.memory.period才会检查，没有的话也不报错，但cpu消耗变高
            if (room.memory.period && !room.memory.period.warOfSelfDefence) {
                continue;
            }

            // 不符合条件的房间跳过
            if (room.controller.level < _config.level || room.controller.safeMode) { continue; }

            // 每10tick检查一次建筑受损情况，直接摧毁建筑不会触发SF，可以放心自己拆除自己建筑
            if (!(Game.time % 10)) {
                let structures = room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return _config.structureTypes.includes(structure.structureType)
                    }
                });

                for (let structure of structures) {
                    if ((structure.hits / structure.hitsMax < 0.9)) {
                        structure.room.controller.activateSafeMode();
                        if (_config.ifNotify) {
                            Game.notify(`Room：${structure.room.name} 的 ${structure.structureType} 被攻击！！已开启SF！！`);
                        }
                        break;
                    }
                }
            }

            // 如果controller一格范围内有敌人判断为controller马上被攻击，直接开SF
            // 建议：controller周围一格用rampart围起来，防止敌人靠近（敌人攻击controller将导致无法使用SF）
            if (room.controller.pos.findInRange(FIND_HOSTILE_CREEPS, 1).length) {
                room.controller.activateSafeMode();
                if (_config.ifNotify) {
                    Game.notify(`Room：${room.name} 的Controller被攻击！！已开启SF！！`);
                }
                break;
            }
        }
    }
}
