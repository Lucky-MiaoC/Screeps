import { configs } from "./configs";

/**
 * 根据房间内矿的开采位权重来随机选择矿
 *
 * @param {boolean} flag 随机选择矿的时候是否考虑矿能量的剩余容量，默认为true
 * @returns {Resource} 返回Resource对象
 */
Room.prototype.chooseSourceByFreeSpaceWeight = function (flag = true) {
    let randomList = [];
    this.source.forEach((i) => {
        if (!(flag && i.energy == 0)) {
            let j = i.getFreeSpaceNumber();
            while (j--) {
                randomList.push(i.id);
            }
        }
    })
    return Game.getObjectById(_.sample(randomList));
};

/**
 * 扫描房间是否有敌人，有敌人则进入自卫战争状态，没有则退出
 */
Room.prototype.scanHostiles = function () {
    if (!this.memory.period.forceNotToAttack) {
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
    }
}

/**
 * 更新creep内存（清理死亡creep内存）
 */
Room.prototype.updateCreepMemory = function () {
    for (let name in Memory.creeps) {
        if (Game.creeps[name] || Memory.creeps[name].originalRoomName != this.name) { continue; }

        let deadCreepRole = Memory.creeps[name].role;

        // 如果死亡creep为harvester则解除对矿的预定
        if (deadCreepRole == 'harvester') {
            if (Memory.creeps[name].sourceId) {
                this.memory.sourceInfo[Memory.creeps[name].sourceId] = 'unreserved';
            }
        };

        // 更新Memory的creep数量
        if (configs.creepRoleSetting.includes(deadCreepRole)) {
            --this.memory.creepNumber[deadCreepRole];
        }

        // 清理死亡creep内存
        delete Memory.creeps[name];
    }
}

/**
 * 分发生产任务到Spawn
 *
 * @param {StructureSpawn} Spawn 空闲Spawn
 * @param {string} creepRole 需要生产的角色
 */
Room.prototype.distributeSpawnTasks = function (Spawn, creepRole) {
    // 预构造
    let availableSpawn = Spawn;
    let assessRCLResult = assessRCL(this);
    let creepBodyMetadata = configs.creepBodyConfigs[assessRCLResult][creepRole];
    let creepBody = [];
    Object.keys(creepBodyMetadata).forEach((i) => {
        let j = creepBodyMetadata[i];
        while (j--) {
            creepBody.push(i);
        }
    });
    let creepName = (creepRole + ' | ' + this.name + ' | ' + assessRCLResult + ' | ' + Game.time).toUpperCase();

    // testIfCanSpawn在canSpawn时返回0（表示ok）
    let testIfCanSpawn = availableSpawn.spawnCreep(creepBody, creepName, { dryRun: true });

    if (!testIfCanSpawn) {
        // Memory构造
        let creepMemory = { 'role': creepRole, 'autoControl': true, 'originalRoomName': this.name, 'ready': false, };
        // 生产
        availableSpawn.spawnCreep(creepBody, creepName,
            { memory: creepMemory });
        // 更新数量
        ++this.memory.creepNumber[creepRole];
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
