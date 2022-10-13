import { configs } from "./configs";

/**
 * 扫描房间是否有敌人，有敌人则进入自卫战争状态，没有则退出自卫战争状态
 */
Room.prototype.scanHostiles = function () {
    let hostiles = this.find(FIND_HOSTILE_CREEPS, {
        filter: (hostile) => {
            return !configs.whiteList['global'].concat(configs.whiteList[this.name] || []).includes(hostile.owner.username);
        }
    });
    if (hostiles.length) {
        this.memory.period.warOfSelfDefence = true;
    }
    else {
        this.memory.period.warOfSelfDefence = false;
    }
};

/**
 * 更新creep内存（清理死亡creep内存）
 */
Room.prototype.updateCreepMemory = function () {
    for (let name in Memory.creeps) {
        // 跳过活着的creep和非本房间的creep
        if (Game.creeps[name] || Memory.creeps[name].originalRoomName != this.name) { continue; }

        let deadCreepRole = Memory.creeps[name].role;

        // 如果死亡creep为harvester则解除对矿绑定，同时需要检测是否已更新Container、Link的建筑缓存
        if (deadCreepRole == 'harvester') {
            // 解除对矿绑定
            if (Memory.creeps[name].sourceId) {
                _.remove(this.memory.sourceInfo[Memory.creeps[name].sourceId], (i) => { return i == name; });
            }
            // 更新建筑缓存
            if (Memory.creeps[name].targetPos) {
                let pos = new RoomPosition(Memory.creeps[name].targetPos.x, Memory.creeps[name].targetPos.y, Memory.creeps[name].targetPos.roomName);
                let newStructure = _.filter(pos.lookFor(LOOK_STRUCTURES), (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_LINK;
                })[0];
                if (newStructure && !this[newStructure.structureType].includes(newStructure)) {
                    creep.room.updateStructureIndex(newStructure.structureType);
                }
            }
        }
        // 如果死亡creep为builder需要检测是否已更新建筑缓存
        else if (deadCreepRole == 'builder') {
            // 更新建筑缓存
            if (Memory.creeps[name].targetPos) {
                let pos = new RoomPosition(Memory.creeps[name].targetPos.x, Memory.creeps[name].targetPos.y, Memory.creeps[name].targetPos.roomName);
                let newStructure = pos.lookFor(LOOK_STRUCTURES);
                if (newStructure.length) {
                    newStructure.forEach((i) => {
                        if (!this[i.structureType] ||
                            (this[i.structureType] instanceof Array && !this[i.structureType].includes(i))) {
                            this.updateStructureIndex(i.structureType);
                        }
                    })
                }
            }
        }

        // 更新Memory中的creep数量
        if (configs.creepRoleSetting.includes(deadCreepRole)) {
            --this.memory.creepNumber[deadCreepRole];
        }

        // 清理死亡creep内存
        delete Memory.creeps[name];
    }
};

/**
 * 分发生产任务到Spawn
 *
 * @param {StructureSpawn} Spawn 空闲Spawn
 * @param {string} creepRole 需要生产的角色
 */
Room.prototype.distributeSpawnTasks = function (Spawn, creepRole) {
    // creep身体构造
    let assessRCLResult = assessRCL(this);
    let creepBodyMetadata = configs.creepBodyConfigs[assessRCLResult][creepRole];
    let creepBody = [];
    Object.keys(creepBodyMetadata).forEach((i) => {
        let j = creepBodyMetadata[i];
        while (j--) {
            creepBody.push(i);
        }
    });
    // creep名字构造
    let creepName = (creepRole + ' | ' + this.name + ' | ' + assessRCLResult + ' | ' + Game.time).toUpperCase();

    // 注意：testIfCanSpawn在canSpawn时返回0（表示ok）
    let testIfCanSpawn = Spawn.spawnCreep(creepBody, creepName, { dryRun: true });
    if (!testIfCanSpawn) {
        // Memory构造
        let creepMemory = { 'role': creepRole, 'autoControl': true, 'originalRoomName': this.name, 'ready': false, };
        // 生产
        if (Spawn.spawnCreep(creepBody, creepName,
            { memory: creepMemory }) == OK) {
            // 更新数量
            ++this.memory.creepNumber[creepRole];
        }
    }
};

/**
 * 更新生产任务
 */
Room.prototype.updateSpawnTasks = function () {
    // 获取空闲spawn
    let availableSpawns = _.filter(this.spawn, (spawn) => {
        return !spawn.spawning;
    });

    // 无空闲spawn时直接返回
    if (!availableSpawns.length) { return undefined; }

    // 收集当前tick需要生产的creepRole，为防止命名冲突，同一tick只分发一个相同角色的creep的生产，故采用Set
    let creepRoleSet = new Set();
    for (let creepRole of configs.creepRoleSetting) {
        let creepNumberSetting = configs.creepNumberSetting[this.name][creepRole];
        let creepNumber = this.memory.creepNumber[creepRole];

        // 判断数量
        if (creepNumberSetting > creepNumber) {
            // 判断生产条件
            if (this.judgeIfCreepNeedSpawn(creepRole)) {
                creepRoleSet.add(creepRole);
                if (creepRoleSet.size == availableSpawns.length) {
                    break;
                }
            }
        }
    }

    // 分发生产任务
    if (creepRoleSet.size) {
        let creepRoleList = [...creepRoleSet];
        for (let i = 0; i < creepRoleList.length; i++) {
            this.distributeSpawnTasks(availableSpawns[i], creepRoleList[i]);
        }
    }
};
