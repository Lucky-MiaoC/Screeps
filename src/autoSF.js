/**
 * autoSF信息配置
 */
const _config = {
    // 可以开启SF的房间等级，只有房间等级大于等于level才会开SF
    level: 4,
    // 考虑开启SF的房间，默认所有属于自己的房间
    roomNames: _.filter(Object.values(Game.rooms), (room) => {
        return room.controller && room.controller.my;
    }).map((room) => { return room.name }),
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
        // 每10tick检查一次建筑受损情况，直接摧毁建筑不会触发SF，可以放心自己拆除自己建筑
        if (!(Game.time % 10)) {
            let structures = _.filter(Game.structures, (structure) => {
                return _config.structureTypes.includes(structure.structureType) &&
                    _config.roomNames.includes(structure.room.name) &&
                    structure.room.controller.level >= _config.level;
            });

            for (let structure of structures) {
                if ((structure.hits / structure.hitsMax < 0.7) && !(structure.room.controller.safeMode)) {
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
        for (let roomName of _config.roomNames) {
            let room = Game.rooms[roomName];
            if (room.controller.level >= _config.level && !(room.controller.safeMode)) {
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
}
