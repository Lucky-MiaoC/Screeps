import { configs } from "./configs";

/**
 * 获取矿的开采位数量，理论上这个不属于global，不过因为Source原型的修改只有这一处，懒得再开一个source的文件了
 *
 * @returns {number} 返回矿的开采位数量
 */
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

/**
 * 从能量角度评估当前RCL所处等级，用于指导creepBody的选择
 *
 * rcl四级及以下时，缺少filler或harvester均使用当前可用能量来评估RCL等级
 * rcl四级以上时，缺失filler才使用当前可用能量来评估RCL等级
 * 其余时候使用当前能量上限来评估
 *
 * @param {Room} room 房间对象
 * @returns {string} 返回"RCL_*"字符串
 */
global.assessRCL = function (room) {
    let energyForRCLAssessment = 0;

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

/**
 * 判断建筑是否需要塔维修
 *
 * @param {Structure} structure 需要判断的建筑对象
 * @returns {boolean} 返回true或者false
 */
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
            // RAMPART血量低于5k或者低于设定血量且高于设定血量-5k则修
            case STRUCTURE_RAMPART: {
                let rampartType = undefined;
                if (structure.room.centerRampart.includes(structure)) {
                    rampartType = 'centerRampart';
                }
                else if (structure.room.surroundingRampart.includes(structure)) {
                    rampartType = 'surroundingRampart';
                }
                else {
                    structure.room.updateStructureIndex(STRUCTURE_RAMPART);
                    return global.judgeIfStructureNeedTowerFix(structure);
                }
                let hitsSetting = configs.maxHitsRepairingWallOrRampart[rampartType][structure.room.name];
                return (structure.hits < 5000 || (structure.hits > hitsSetting - 5000 &&
                    structure.hits < hitsSetting)) ? true : false;
            }
            // 其他建筑掉血了就修
            default:
                return structure.hits < structure.hitsMax ? true : false;
        }
    }
    else {
        return false;
    }
}

/**
 * 判断建筑是否需要builder维修
 *
 * @param {Structure} structure 需要判断的建筑对象
 * @returns {boolean} 返回true或者false
 */
global.judgeIfNeedBuilderWork = function (structure) {
    if (structure instanceof Structure) {
        switch (structure.structureType) {
            // WALL血量少于设定血量就要维修
            case STRUCTURE_WALL:
                return structure.hits <
                    configs.maxHitsRepairingWallOrRampart[STRUCTURE_WALL][structure.room.name] ? true : false;
            // RAMPART血量少于设定血量就要维修
            case STRUCTURE_RAMPART: {
                let rampartType = undefined;
                if (structure.room.centerRampart.includes(structure)) {
                    rampartType = 'centerRampart';
                }
                else if (structure.room.surroundingRampart.includes(structure)) {
                    rampartType = 'surroundingRampart';
                }
                else {
                    structure.room.updateStructureIndex(STRUCTURE_RAMPART);
                    return global.judgeIfNeedBuilderWork(structure);
                }
                let hitsSetting = configs.maxHitsRepairingWallOrRampart[rampartType][structure.room.name];
                return structure.hits < hitsSetting - 5000 ? true : false;
            }
            // 其他建筑不需要builder维修
            default:
                return false;
        }
    }
    else {
        return false;
    }
}

/**
 * 在内存中更新 RCL、GCL、GPL 使用情况和当前 CPU、bucket 使用情况
 */
global.stateScanner = function () {
    // 每 50 tick 运行一次
    if (!(Game.time % 50)) {
        // 统计每个房间的 RCL 的等级、升级百分比、剩余进度
        Object.keys(Game.rooms).forEach((roomName) => {
            let room = Game.rooms[roomName];
            if (room.controller && room.controller.my) {
                let RCLLevel = room.controller.level;
                let RCLPercentage = room.controller.progressTotal ?
                    ((room.controller.progress / room.controller.progressTotal) * 100).toFixed(2) + '%' : '100.00%';
                let progressrLeft = room.controller.progressTotal ? room.controller.progressTotal - room.controller.progress : 0;
                Memory.stats[roomName] =
                    `RCLLevel：${RCLLevel} | RCLPercentage：${RCLPercentage} | progressrLeft：${progressrLeft}`;
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
        Memory.stats.Bucket = Game.cpu.bucket;

        // 输出至控制台
        // Object.keys(Memory.stats).forEach((key) => {
        //     console.log(JSON.stringify(key + '：' + Memory.stats[key]));
        // });
    }
};

/**
 * 内存初始化函数
 */
global.memoryInitialization = function () {
    // 杀死所有creep，警告：只有当该项目应用于一个非重头开始的环境时使用
    /*
    Object.keys(Game.creeps).forEach((creepName) => {
        let creep = Game.creeps[creepName];
        creep.suicide();
    })
    */

    // 对已存在的creep进行内存初始化，依赖已存在creep的名称
    Object.keys(Game.creeps).forEach((creepName) => {
        let creepInfo = creepName.slice(1, -1).split('][');
        let creepMemory = { 'role': creepInfo[0], 'autoControl': true, 'originalRoomName': creepInfo[1].toUpperCase() };
        Game.creeps[creepName].memory = creepMemory;
    })

    // 针对每个房间执行内存初始化
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
            // 需要攻击的敌对creep的id
            room.memory.hostileNeedToAttcak = null;
            // 需要observer观测的房间名
            room.memory.roomNameNeedObserver = null;

            // 初始化当前房间的中央搬运任务队列
            room.memory.centerCarryTask = [];

            // creep数量内存初始化构造
            let creepNumberInitialization = {};
            let spawnQueueCreepNumberInitialization = {};
            configs.creepRoleSetting.forEach((i) => {
                creepNumberInitialization[i] = _.filter(Game.creeps, (creep) => {
                    // 根据creep.memory.originalRoomName来判定归属房间
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

            console.log("Room：" + roomName + " 内存初始化完成！");
        }
    });

    // 初始化游戏状态扫描相关内存
    Memory.stats = {};
    // 重新设置内存初始化标志位
    Memory.doNotInitializeMyMemory = !Memory.doNotInitializeMyMemory;
};

/**
 * 使用observer观测房间
 *
 * @param {string} targetRoomName 目标房间名称
 * @param {string | null} sourceRoomName observer所在房间名称，为空时随机选择合适的房间的observer进行观测
 */
global.observeRoom = function (targetRoomName, sourceRoomName = null) {
    if (sourceRoomName) {
        Game.rooms[sourceRoomName].memory.roomNameNeedObserver = targetRoomName;
        console.log(sourceRoomName + " 的observer 开始观测房间 " + targetRoomName);
    }
    else {
        let roomNamesCanObserve = _.filter(Object.keys(Game.rooms), (roomName) => {
            return Game.rooms[roomName].controller.my && Game.rooms[roomName].observer &&
                !Game.rooms[roomName].memory.roomNameNeedObserver;
        })
        if (roomNamesCanObserve.length) {
            let i = Game.rooms[_.sample(roomNamesCanObserve)];
            i.memory.roomNameNeedObserver = targetRoomName;
            console.log(i.name + " 的observer 开始观测房间 " + targetRoomName);
        }
        else {
            console.log("不好意思，无任何房间可以观测目标房间！可能是无观测者或者全部观测者已被占用或者房间太远导致！请检查")
        }
    }
}

/**
 * 停止对一个房间的观测
 *
 * @param {string} targetRoomName 需要停止观测的房间
 */
global.stopObserveRoom = function (targetRoomName) {
    let code = 0;
    Object.keys(Game.rooms).forEach((roonName) => {
        if (Game.rooms[roonName].memory.roomNameNeedObserver == targetRoomName) {
            Game.rooms[roonName].memory.roomNameNeedObserver = null;
            code = 1;
            console.log("已停止对房间 " + targetRoomName + " 的观测！");
        }
    })
    if (!code) {
        console.log("并没有任何房间的observer在对 " + targetRoomName + " 进行观测！");
    }
}
