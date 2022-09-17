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
    let targets;
    // 自卫战争时期紧急修墙，停止工地建设，找是否有符合的建筑
    if (this.memory.code.warOfSelfDefence) {
        targets = this.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return judgeIfNeedBuilderWork(structure);
            }
        });
    }
    // 非自卫战争时期先找建筑工地，再找是否有符合的建筑
    else {
        targets = this.find(FIND_CONSTRUCTION_SITES) ||
            this.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return judgeIfNeedBuilderWork(structure);
                }
            });
    }

    // 存在工地或者有符合的建筑（血量低于设定的墙、门）
    if (targets.length) {
        this.memory.code.ifNeedBuilderWork = true;
    }
    else {
        this.memory.code.ifNeedBuilderWork = false;
    }
}

/**
 * 扫描房间是否有敌人，有敌人则进入自卫战争状态，没有则退出，在main.js里每20tick调用一次
 */
Room.prototype.updateHostiles = function () {
    if (!this.memory.code.forceNotToAttack) {
        let hostiles = this.find(FIND_HOSTILE_CREEPS, {
            filter: (hostile) => {
                return !configs.whiteList['global'].concat(configs.whiteList[this.name]).includes(hostile.owner.username);
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
 * 判断某一角色类型是否达到生产条件
 *
 * @param {string} creepRole 角色类型
 * @returns {boolean} 返回true或者false
 */
Room.prototype.judgeIfCreepNeedSpawn = function (creepRole) {
    switch (creepRole) {
        // harvester一直都需要生产
        case "harvester": { return true; }
        // filler只有在有storage或者sourceContainer时才需要生产
        case "filler": { return (this.storage || this.sourceContainer.length) ? true : false; }
        // collecter只有在有storage和sourceContainer、mineralContainer任意一种
        // 同时storage有空余、mineralContainer快满了时才需要生产
        case "collecter": {
            return (this.storage && this.storage.store.getFreeCapacity() > 100000 &&
                (this.sourceContainer.length ||
                    (this.mineralContainer.length && this.mineralContainer[0].store.getFreeCapacity() < 200))) ? true : false;
        }
        // centercarrier只有在有storage和centerLink时才需要生产
        case "centercarrier": { return (this.storage && this.centerLink.length) ? true : false; }
        // upgrader一直都需要生产
        case "upgrader": { return true; }
        // builder只有在需要builder工作时才需要生产
        case "builder": { return this.memory.code.ifNeedBuilderWork; }
        // miner只有在有extractor和mineralContainer且storage有空余且矿余量不为0时才会生产
        case "miner": {
            return (this.extractor && this.mineralContainer.length &&
                this.storage && this.storage.store.getFreeCapacity() > 100000 &&
                this.mineral.mineralAmount > 0) ? true : false;
        }
        // outsideharvester只有有storage且有外矿房间设定时才会生产
        case "outsideharvester": { return (this.storage && configs.outsideSoucreRoomSetting[this.name].length) ? true : false; }
        // 战争角色只有在革命战争时才生产
        case 'warcarrier':
        case 'controllerattacker':
        case 'dismantler': { return this.memory.code.warOfRevolution; }
        // 其他角色一律放行
        default: { return true; }
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
        return configs.creepRolePrioritySetting[i] - configs.creepRolePrioritySetting[j];
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
        if (configs.creepNumberSetting[this.name][creepRole]) {
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
                let j = configs.creepNumberSetting[this.name][creepRole] -
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

/**
 * 创建中央搬运任务
 *
 * @param {StructureTerminal | StructureStorage | StructureFactory} source 源对象，应该是Terminal或者Storage或者Factory之一
 * @param {StructureTerminal | StructureStorage | StructureFactory} target 目标对象，应该是Terminal或者Storage或者Factory之一
 * @param {string} resourceType RESOURCE_*系列
 * @param {number} resourceNumber 需要搬运的资源
 */
Room.prototype.creatCenterCarryTask = function (source, target, resourceType, resourceNumber) {
    if (!([STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_FACTORY].includes(source.structureType)) ||
        !([STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_FACTORY].includes(target.structureType)) ||
        !(RESOURCES_ALL.includes(resourceType)) || !(typeof resourceNumber == 'number') ||
        !(source.store[resourceType]) || (source.store[resourceType] < resourceNumber) ||
        (target.store.getFreeCapacity(resourceType) < resourceNumber)) {
        console.log("创建中央搬运任务失败，请检查：");
        console.log("1、source、target、resourceType、resourceNumber类型是否错误");
        console.log("2、source是否有足够的对应资源的数量");
        console.log("3、target是否有足够的剩余空间");
        return undefined;
    }

    if (this.memory.centerCarryTask.some((task) => {
        return task.id == Game.time;
    })) {
        console.log("同一tick只能创建一份中央搬运任务，请下一tick之后重试");
        return undefined;
    }

    let centerCarryTask = {};
    centerCarryTask.id = Game.time;
    centerCarryTask.sourceId = source.id;
    centerCarryTask.targetId = target.id;
    centerCarryTask.resourceType = resourceType;
    centerCarryTask.resourceNumber = resourceNumber;
    this.memory.centerCarryTask.push(centerCarryTask);
    console.log("成功创建以下中央搬运任务：");
    console.log(`id：${centerCarryTask.id} | sourceType：${source.structureType} | targetType：${target.structureType} | resourceType：${resourceType} | resourceNumber：${resourceNumber}`);
}

/**
 * 取消已存在的中央搬运任务
 *
 * @param {number} taskId 需要取消的中央搬运任务的id
 */
Room.prototype.cancelCenterCarryTask = function (taskId) {
    if (this.memory.centerCarryTask.some((task) => {
        return task.id == taskId;
    })) {
        _.remove(this.memory.centerCarryTask, (task) => {
            return task.id == taskId;
        });
        console.log(`成功移除id为${taskId}的中央搬运任务`);
    }
    else {
        console.log(`不存在id为${taskId}的中央搬运任务`);
    }
}

/**
 * 在控制台显示当前存在的中央搬运任务
 *
 * @param {number | null} taskId 当提供id时只显示对应中央搬运任务，当不提供参数时，显示所有中央搬运任务
 */
Room.prototype.showCenterCarryTask = function (taskId = null) {
    if (taskId) {
        let task = this.memory.centerCarryTask.find((t) => {
            return t.id == taskId;
        })
        if (task) {
            console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber}`);
        }
        else {
            console.log(`不存在id为${taskId}的中央搬运任务`);
        }
    }
    else {
        this.memory.centerCarryTask.forEach((task) => {
            console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber}`);
        });
    }
}
