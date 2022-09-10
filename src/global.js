import { configs } from "./configs";

// 获取矿的开采位数量
Source.prototype.getFreeSpaceNumber = function () {
    const terrain = new Room.Terrain(this.room.name);
    const xs = [this.pos.x - 1, this.pos.x, this.pos.x + 1];
    const ys = [this.pos.y - 1, this.pos.y, this.pos.y + 1];
    let freeSpaceNumber = 0;
    xs.forEach((x) => {
        ys.forEach((y) => {
            if (terrain.get(x, y) != TERRAIN_MASK_WALL) {
                freeSpaceNumber++;
            }
        })
    });
    return freeSpaceNumber;
};

// 从能量角度评估当前RCL所处等级，用于指导creepBody的选择
global.assessRCL = function (room) {
    let energyForRCLAssessment = 0;

    // rcl四级及以下时，缺少filler或harvester均使用当前可用能量来评估RCL等级
    // rcl四级以上时，缺失filler才使用当前可用能量来评估RCL等级
    // 其余时候使用当前能量上限来评估
    let state = room.controller.level <= 4 ?
        (room.memory.creepNumber['filler'] == 0 || room.memory.creepNumber['harvester'] == 0) : room.memory.creepNumber['filler'] == 0;
    if (state) {
        energyForRCLAssessment = room.energyAvailable;
    }
    else {
        energyForRCLAssessment = room.energyCapacityAvailable;
    }

    switch (true) {
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_8']['maxcost']:
            return "RCL_8";
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_7']['maxcost']:
            return "RCL_7";
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_6']['maxcost']:
            return "RCL_6";
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_5']['maxcost']:
            return "RCL_5";
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_4']['maxcost']:
            return "RCL_4";
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_3']['maxcost']:
            return "RCL_3";
        case energyForRCLAssessment >= configs.creepBodyConfigs['RCL_2']['maxcost']:
            return "RCL_2";
        default:
            return "RCL_1";
    }
};

// 判断建筑是否需要塔维修
global.judgeIfStructureNeedTowerFix = function (structure) {
    if (structure instanceof Structure) {
        switch (structure.structureType) {
            // 不需要修墙，修墙是builder的活
            case STRUCTURE_WALL:
                return false;
            // ROAD和CONTAINER血量低于90%再修，防止血量溢出浪费
            case STRUCTURE_ROAD:
            case STRUCTURE_CONTAINER:
                return structure.hits / structure.hitsMax < 0.9 ? true : false;
            // RAMPART血量低于设定血量则修
            case STRUCTURE_RAMPART:
                return structure.hits < configs.maxHitsRepairingWallOrRampart[structure.room.name] ? true : false;
            // 其他建筑掉血了就修
            default:
                return structure.hits < structure.hitsMax ? true : false;
        }
    }
    else {
        return false;
    }
}

// 在内存中更新 RCL、GCL、GPL 使用情况和当前 CPU、bucket 使用情况
global.stateScanner = function () {
    // 每 30 tick 运行一次
    if (!(Game.time % 30)) {
        // 统计每个房间的 RCL 的等级、升级百分比、剩余进度
        Object.keys(Game.rooms).forEach((roomName) => {
            let room = Game.rooms[roomName];
            if (room.controller && room.controller.my) {
                let RCLLevel = room.controller.level;
                let RCLPercentage = room.controller.progressTotal ?
                    ((room.controller.progress / room.controller.progressTotal) * 100).toFixed(2) + '%' : '100.00%';
                let progressrLeft = room.controller.progressTotal ? room.controller.progressTotal - room.controller.progress : 0;
                Memory.stats[roomName] = `RCLLevel：${RCLLevel} RCLPercentage：${RCLPercentage} progressrLeft：${progressrLeft}`;
            }
        })

        // 统计 GCL、GPL 的等级和升级百分比
        Memory.stats.GCLLevel = Game.gcl.level;
        Memory.stats.GCLPercentage = ((Game.gcl.progress / Game.gcl.progressTotal) * 100).toFixed(2) + '%';
        Memory.stats.GPLLevel = Game.gpl.level;
        Memory.stats.GPLPercentage = ((Game.gpl.progress / Game.gpl.progressTotal) * 100).toFixed(2) + '%';

        // 统计 CPU 的当前使用量
        Memory.stats.CPUUsage = Game.cpu.getUsed();
        // 统计 bucket 的当前剩余量
        Memory.stats.bucket = Game.cpu.bucket;
    }
};

// 内存初始化函数
global.memoryInitialization = function () {
    // Memory = {};
    Object.keys(Game.rooms).forEach((roomName) => {
        let room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            console.log("Room：" + roomName + " 内存初始化开始...");
            // 初始化内存标志位
            room.memory.code = {};

            // 初始化战争时期标志，分为自卫战争和革命战争，自卫战争被动触发，革命战争主动发起，另外还有一个强制不进入自卫战争的标志位
            room.memory.code.warOfSelfDefence = false;
            room.memory.code.warOfRevolution = false;
            room.memory.code.forceNotToAttack = false;

            // 是否需要builder工作标志
            room.memory.code.ifNeedBuilderWork = false;

            // 需要塔修理的建筑名单
            room.memory.structuresNeedTowerFix = [];
            // 需要攻击的敌对creep名单
            room.memory.hostileNeedToAttcak = null;

            // 需要observer观测的房间名
            room.memory.roomNameNeedObserver = null;

            // creep数量内存初始化构造
            let creepNumberInitialization = {};
            let spawnQueueCreepNumberInitialization = {};
            configs.creepRoleSetting.forEach((i) => {
                creepNumberInitialization[i] = _.filter(Game.creeps, (creep) => {
                    // 外矿creep根据creep.memory.originalRoomName来判定归属房间
                    // 房间运营creep没有creep.memory.originalRoomName，根据所处房间判断
                    // 如果后续添加不属于任何一个房间的一次性creep就把creep.memory.originalRoomName设为FREE
                    return (creep.memory.originalRoomName ? creep.memory.originalRoomName == room.name :
                        creep.room == room) && creep.memory.role == i
                }).length;
                spawnQueueCreepNumberInitialization[i] = 0;
            });

            // creep数量内存初始化
            room.memory.creepNumber = creepNumberInitialization;
            room.memory.spawnQueue = [];
            room.memory.spawnQueueCreepNumber = spawnQueueCreepNumberInitialization;

            // 初始化矿-harvester绑定关系
            room.memory.sourceCreepBindingRelationship = [];
            room[LOOK_SOURCES].forEach((i) => {
                let bindingRelationship = { 'sourceId': i.id, 'creepNames': [] }
                room.memory.sourceCreepBindingRelationship.push(bindingRelationship);
            })

            // 清除harvester的矿绑定
            for (let name in Game.creeps) {
                let creep = Game.creeps[name];
                if (creep.memory.role == 'harvester') {
                    delete creep.memory.sourceId;
                }
            }

            // 初始化游戏状态扫描相关内存
            Memory.stats = {};

            // 重新设置内存初始化标志位
            Memory.doNotInitializeMyMemory = !(Memory.doNotInitializeMyMemory);
            console.log("Room：" + roomName + " 内存初始化完成！");
        }
    });
};

// 给房间签名
global.signRoom = function (idOrName, roomSign = null) {
    let creep = Game.getObjectById(idOrName) || Game.creeps[idOrName];
    if (creep) {
        let text = roomSign || configs.roomSign[creep.room.name];
        if (sign) {
            creep.memory.autoControl = false;
            switch (creep.signController(creep.room.controller, text)) {
                case OK: {
                    creep.memory.autoControl = true;
                    return 'OK';
                }
                case ERR_NOT_IN_RANGE: {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
}