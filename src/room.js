import { configs } from "./configs";

/**
 * 扫描房间是否有敌人，有敌人则进入自卫战争状态，没有则退出自卫战争状态
 */
Room.prototype.scanHostiles = function () {
    let hostiles = this.find(FIND_HOSTILE_CREEPS, {
        filter: (hostile) => {
            return !(configs?.whiteList?.['global'] || []).concat(configs?.whiteList?.[this.name] || []).includes(hostile.owner.username);
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
 * 清理死亡creep内存
 * 优化：所有房间统一处理死亡creep内存更节约cpu，但考虑代码结构和谐性暂时不予优化
 */
Room.prototype.clearDeadCreepMemory = function () {
    for (let name in Memory.creeps) {
        // 跳过活着的creep和非本房间的creep
        if (Game.creeps[name] || Memory.creeps[name].originalRoomName != this.name) { continue; }

        let deadCreepRole = Memory.creeps[name].role;

        // 如果死亡creep为harvester则解除对矿绑定
        if (deadCreepRole == 'harvester') {
            // 解除对矿绑定
            if (Memory.creeps[name].sourceId) {
                _.remove(this.memory.sourceInfo[Memory.creeps[name].sourceId], (i) => {
                    return i == name;
                });
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
 * 分发生产任务到空闲spawn
 *
 * @param {StructureSpawn} spawn 空闲spawn
 * @param {string} creepRole 需要生产的角色
 */
Room.prototype.distributeSpawnTasks = function (spawn, creepRole) {
    // 获取creep身体数据
    let creepBody = [];
    let assessRCLResult = assessRCL(this);
    let creepBodyMetadata = configs.creepBodyConfigs[assessRCLResult][creepRole];

    // creep身体构造
    Object.keys(creepBodyMetadata).forEach((i) => {
        let j = creepBodyMetadata[i];
        while (j--) {
            creepBody.push(i);
        }
    });

    // creep名字构造
    let creepName = (creepRole + ' | ' + this.name + ' | ' + assessRCLResult + ' | ' + Game.time).toUpperCase();

    // 测试是否能够生产
    // 注意：testIfCanSpawn在canSpawn时返回0（表示ok）
    let testIfCanSpawn = spawn.spawnCreep(creepBody, creepName, { dryRun: true });

    if (!testIfCanSpawn) {
        // Memory构造
        let creepMemory = { 'role': creepRole, 'autoControl': true, 'originalRoomName': this.name, 'ready': false, };
        // 生产
        if (spawn.spawnCreep(creepBody, creepName, { memory: creepMemory }) == OK) {
            // 更新数量
            ++this.memory.creepNumber[creepRole];
        }
    }
};

/**
 * 更新生产任务，采取同一tick只孵化一个creep方案
 * 同一tick孵化多个creep缺点：
 * 1. 需要额外排除同角色同名情况 2. assessRCL判断不准确 3. 能量不足时生产优先级会被打乱 4. 代码复杂度上升
 * 同一tick只孵化一个creep缺点：
 * 1. 能量不足时生产优先级高的角色卡死生产队列（可能是好事） 2. 效率变慢（前期只有1个spawn无差异，后期差异仅几个tick不明显）
 */
Room.prototype.updateSpawnTasks = function () {
    // 获取空闲spawn
    let availableSpawns = _.filter(this.spawn, (spawn) => {
        return !spawn.spawning;
    });

    // 无空闲spawn时直接返回
    if (!availableSpawns.length) { return undefined; }

    for (let creepRole of configs.creepRoleSetting) {
        // 获取角色对应数量以及数量设置
        let creepNumber = this.memory.creepNumber[creepRole];
        let creepNumberSetting = configs.creepNumberSetting[this.name][creepRole];

        // 数量足够时跳过该角色
        if (creepNumber >= creepNumberSetting) { continue; }

        // 判断生产条件
        if (this.judgeIfCreepNeedSpawn(creepRole)) {
            this.distributeSpawnTasks(_.sample(availableSpawns), creepRole);
            break;
        }
    }
};
