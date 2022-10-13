import { configs } from "../configs";

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
        // upgrader只有在有[storage或者terminal或者sourceContainer]时才需要生产
        case "upgrader": { return (this.storage || this.terminal || this.sourceContainer.length) ? true : false; }
        // filler只有在有[storage或者terminal或者sourceContainer]时才需要生产
        case "filler": { return (this.storage || this.terminal || this.sourceContainer.length) ? true : false; }
        // centercarrier只有在有[storage或者terminal]和[centerLink]和[集群中心时]才需要生产
        case "centercarrier": {
            return ((this.storage || this.terminal) &&
                this.centerLink.length && configs.centerPoint[this.name]) ? true : false;
        }
        // miner只有在有[Extractor和mineralContainer]同时[storage或者terminal]有空余且[矿余量不为0]时才会生产
        case "miner": {
            let freeCapacity = (this.storage ? this.storage.store.getFreeCapacity() : 0) +
                (this.terminal ? this.terminal.store.getFreeCapacity() : 0);
            return (this.extractor && this.mineralContainer.length && freeCapacity > 200000 &&
                this.mineral.mineralAmount > 0) ? true : false;
        }
        // builder只有在需要builder工作时才需要生产，并且为了节约cpu50tick扫描一次
        case "builder": { return !(Game.time % 50) ? this.ifNeedBuilderWork() : false; }
        // 其他角色一律放行
        default: { return true; }
    }
};

/**
 * 扫描房间是否需要builder工作
 *
 * @returns {boolean} 返回true或者false
 */
Room.prototype.ifNeedBuilderWork = function () {
    // 不存在任何能量来源时不出builder
    if (!this.storage && !this.terminal && !this.container.length) {
        return false;
    }

    // 当同时有storage和terminal时保留至少50k能量，防止刷墙、刷门把能量花光
    if (this.storage && this.terminal &&
        this.storage.store[RESOURCE_ENERGY] + this.terminal.store[RESOURCE_ENERGY] < 50000) {
        return false;
    }

    let targetFlag;
    // 自卫战争时期停止工地建设，找是否有符合的建筑
    if (this.memory.period.warOfSelfDefence) {
        targetFlag = this.find(FIND_STRUCTURES).some((structure) => {
            return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART
                || structure.structureType == STRUCTURE_CONTAINER)
                && judgeIfStructureNeedBuilderWork(structure, 0);
        });
    }
    // 非自卫战争时期先找建筑工地，再找是否有符合的建筑
    else {
        targetFlag = !!this.find(FIND_CONSTRUCTION_SITES).length ||
            this.find(FIND_STRUCTURES).some((structure) => {
                return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART
                    || structure.structureType == STRUCTURE_CONTAINER)
                    && judgeIfStructureNeedBuilderWork(structure, 0);
            });
    }

    // 存在工地或者有符合的建筑（血量低于设定的Wall、Rampart）
    return targetFlag;
};

/**
 * 自动设定creep数量，待完成
 *
 * @param {string} creepRole 角色类型
 * @returns {number} 返回对应角色应该生产的数量
 */
Room.prototype.getCreepNumberSetting = function (creepRole) {
    switch (creepRole) {
        // harvester数量在RCL_1且没建成Container时与矿开采位数量有关，后续则始终为矿的数量
        case "harvester": {
            return (this.controller.level <= 2 && this.sourceContainer.length < this.source.length) ?
                _.sum(this.source.map((i) => {
                    let j = i.getFreeSpaceNumber();
                    return j >= 3 ? 3 : j;
                })) : this.source.length;
        }
        // upgrader数量随着RCL的增加而减少，当有builder存在时，数量直接减半
        case "upgrader": {
            return undefined;
        }
        // filler??
        case "filler": {
            return undefined;
        }
        // centercarrier数量一般为1
        case "centercarrier": { return 1; }
        // miner数量一般为1
        case "miner": { return 1; }
        // builder数量一般为2
        case "builder": { return 2; }
        // 其他角色数量一律为0
        default: { return 0; }
    }
}
