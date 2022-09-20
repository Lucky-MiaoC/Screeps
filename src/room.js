import { configs } from "./configs";

/**
 * 根据房间内矿的开采位权重来随机选择矿
 *
 * @returns {Resource} 返回Resource对象
 */
Room.prototype.chooseSourceByFreeSpaceWeight = function () {
    let randomList = [];
    this.source.forEach((i) => {
        let j = i.getFreeSpaceNumber();
        while (j--) {
            randomList.push(i.id);
        }
    })
    return Game.getObjectById(_.sample(randomList));
};

/**
 * 更新需要塔修复的建筑，在main.js里每50tick被调用一次
 */
Room.prototype.updateStructuresNeedTowerFix = function () {
    let structuresNeedTowerFix = [];
    this.find(FIND_STRUCTURES).forEach((structure) => {
        if (global.judgeIfStructureNeedTowerFix(structure)) {
            structuresNeedTowerFix.push(structure.id);
        }
    })
    this.memory.structuresNeedTowerFix = structuresNeedTowerFix;
}

/**
 * 扫描房间是否有建筑工地或者墙、门是否要修，在main.js里每100tick调用一次
 */
Room.prototype.updateIfNeedBuilderWork = function () {
    // 当同时有storage和terminal时说明是稳定的后期，后期保留至少100k能量，防止刷墙、刷门把能量花光
    // 没有storage或terminal说明是前期或被打了的紧急时期，前期靠sourceContainer和Source直接挖，紧急时期也不需要保留能量
    if (this.storage && this.terminal &&
        this.storage.store[RESOURCE_ENERGY] + this.terminal.store[RESOURCE_ENERGY] < 100000) {
        this.memory.ifNeedBuilderWork = false;
        return undefined;
    }

    let targets;
    // 自卫战争时期紧急修墙，停止工地建设，找是否有符合的建筑
    if (this.memory.code.warOfSelfDefence) {
        targets = this.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return judgeIfNeedBuilderFix(structure);
            }
        });
    }
    // 非自卫战争时期先找建筑工地，再找是否有符合的建筑
    else {
        targets = this.find(FIND_CONSTRUCTION_SITES) ||
            this.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return judgeIfNeedBuilderFix(structure);
                }
            });
    }

    // 存在工地或者有符合的建筑（血量低于设定的墙、门）
    if (targets.length) {
        this.memory.ifNeedBuilderWork = true;
    }
    else {
        this.memory.ifNeedBuilderWork = false;
    }
}

/**
 * 扫描房间是否有敌人，有敌人则进入自卫战争状态，没有则退出，在main.js里每20tick调用一次
 */
Room.prototype.updateHostiles = function () {
    if (!this.memory.code.forceNotToAttack) {
        let hostiles = this.find(FIND_HOSTILE_CREEPS, {
            filter: (hostile) => {
                return !configs.whiteList['global'].concat(configs.whiteList[this.name] || []).includes(hostile.owner.username);
            }
        });
        if (hostiles.length) {
            this.memory.code.warOfSelfDefence = true;
        }
        else {
            this.memory.code.warOfSelfDefence = false;
            this.memory.hostileNeedToAttcak = null;
        }
    }
}

/**
 * 根据优先级添加room的生产队列
 *
 * @param {Array} creepRoleList 需要生产的角色名称列表
 */
Room.prototype.addSpawnTasks = function (creepRoleList) {
    this.memory.spawnQueue = this.memory.spawnQueue.concat(creepRoleList);
    this.memory.spawnQueue.sort((i, j) => {
        return configs.creepRoleSetting.indexOf(i) - configs.creepRoleSetting.indexOf(j);
    })
    creepRoleList.forEach((i) => {
        ++this.memory.spawnQueueCreepNumber[i];
    });
};

/**
 * 分发生产任务到空闲Spawn
 */
Room.prototype.distributeSpawnTasks = function () {
    let availableSpawn = _.sample(this.find(FIND_MY_SPAWNS, {
        filter: (structure) => {
            return !structure.spawning;
        }
    }));
    if (availableSpawn) {
        let RCLAssessmentResult = global.assessRCL(this);
        let creepRole = this.memory.spawnQueue[0];
        let creepBodyMetadata = configs.creepBodyConfigs[RCLAssessmentResult][creepRole];
        let creepBody = [];
        Object.keys(creepBodyMetadata).forEach((i) => {
            let j = creepBodyMetadata[i];
            while (j--) {
                creepBody.push(i);
            }
        })
        let creepName = ('[' + creepRole + '][' + this.name + '][' + RCLAssessmentResult + '][' + Game.time + ']').toLowerCase();
        // testIfCanSpawn在canSpawn时返回0（表示ok）
        let testIfCanSpawn = availableSpawn.spawnCreep(creepBody, creepName, { dryRun: true });

        if (!testIfCanSpawn) {
            let creepMemory = { role: creepRole, autoControl: true, originalRoomName: this.name };

            availableSpawn.spawnCreep(creepBody, creepName,
                { memory: creepMemory });
            --this.memory.spawnQueueCreepNumber[creepRole];
            ++this.memory.creepNumber[creepRole];
            this.memory.spawnQueue.shift();
        }
    }
};

/**
 * 更新creep内存
 */
Room.prototype.updateCreepMemory = function () {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            let deadCreepRoomName = Memory.creeps[name].originalRoomName;
            if (deadCreepRoomName == this.name) {
                let deadCreepRole = Memory.creeps[name].role;
                // 如果死亡creep为harvester则需要删除与source的绑定关系
                if (deadCreepRole == 'harvester') {
                    this.memory.sourceCreepBindingRelationship.forEach((i) => {
                        if (i.creepNames.includes(name)) {
                            _.remove(i.creepNames, (j) => {
                                return j == name;
                            })
                        }
                    })
                };

                // 只记录设定里的creep种类的数量
                if (configs.creepRoleSetting.includes(deadCreepRole)) {
                    --this.memory.creepNumber[deadCreepRole];
                }
                delete Memory.creeps[name];
            }
        }
    }
};

/**
 * 更新生产队列
 */
Room.prototype.updateSpawnQueue = function () {
    configs.creepRoleSetting.forEach((creepRole) => {
        // 设定数量不为0时
        if (Object.assign(...Object.values(configs.creepNumberSetting[this.name]))[creepRole]) {
            // 先判断是否达到生产条件
            if (!this.judgeIfCreepNeedSpawn(creepRole)) {
                if (this.memory.spawnQueueCreepNumber[creepRole]) {
                    _.remove(this.memory.spawnQueue, (i) => {
                        return i == creepRole;
                    });
                    this.memory.spawnQueueCreepNumber[creepRole] = 0;
                }
            }
            // 达到生产条件再判断数量是否不足或过多
            // creep数量不足时添加相应角色到房间spawn队列
            // creep数量过多时删除房间spawn队列里的相应角色（如果有的话，如果是已经生产出来的就算了）
            else {
                let j = Object.assign(...Object.values(configs.creepNumberSetting[this.name]))[creepRole] -
                    (this.memory.creepNumber[creepRole] + this.memory.spawnQueueCreepNumber[creepRole]);
                if (j > 0) {
                    let creepRoleList = [];
                    for (let i = 0; i < j; i++) {
                        creepRoleList.push(creepRole);
                    }
                    this.addSpawnTasks(creepRoleList);
                }
                if (j < 0) {
                    if (this.memory.spawnQueueCreepNumber[creepRole]) {
                        if (-j >= this.memory.spawnQueueCreepNumber[creepRole]) {
                            _.remove(this.memory.spawnQueue, (k) => { return k == creepRole })
                            this.memory.spawnQueueCreepNumber[creepRole] = 0;
                        }
                        else {
                            for (let k = 0; k < -j; k++) {
                                this.memory.spawnQueue.splice(this.memory.spawnQueue.indexOf(creepRole), 1);
                                --this.memory.spawnQueueCreepNumber[creepRole];
                            }
                        }
                    }
                }
            }
        }
    });
};
