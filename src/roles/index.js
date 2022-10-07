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
        // upgrader一直都需要生产
        case "upgrader": { return true; }
        // filler只有在有[storage或者terminal或者sourceContainer]时才需要生产
        case "filler": { return (this.storage || this.terminal || this.sourceContainer.length) ? true : false; }
        // collecter只有在同时有[storage或者terminal或者factory]和[sourceContainer或者mineralContainer]
        // 同时[storage或者terminal或者factory]有空余，mineralContainer快满了时才需要生产
        case "collecter": {
            let freeCapacity = (this.storage ? this.storage.store.getFreeCapacity() : 0) +
                (this.terminal ? this.terminal.store.getFreeCapacity() : 0) +
                (this.factory ? this.factory.store.getFreeCapacity() : 0);
            return (freeCapacity > 200000 && (this.sourceContainer.length ||
                (this.mineralContainer.length && this.mineralContainer[0].store.getFreeCapacity() < 200))) ? true : false;
        }
        // centercarrier只有在有[storage或者terminal或者factory]和[centerLink]和[集群中心时]才需要生产
        case "centercarrier": {
            return ((this.storage || this.terminal || this.factory) &&
                this.centerLink.length && configs.centerPoint[this.name]) ? true : false;
        }
        // miner只有在有[Extractor和mineralContainer]同时[storage或者terminal或者factory]有空余且[矿余量不为0]时才会生产
        case "miner": {
            let freeCapacity = (this.storage ? this.storage.store.getFreeCapacity() : 0) +
                (this.terminal ? this.terminal.store.getFreeCapacity() : 0) +
                (this.factory ? this.factory.store.getFreeCapacity() : 0);
            return (this.extractor && this.mineralContainer.length && freeCapacity > 200000 &&
                this.mineral.mineralAmount > 0) ? true : false;
        }
        // builder只有在需要builder工作时才需要生产
        case "builder": { return this.ifNeedBuilderWork(); }
        // 其他角色一律放行
        default: { return true; }
    }
}

/**
 * 扫描房间是否有建筑工地或者Wall、Rampart是否要维修
 *
 * @returns {boolean} 返回true或者false
 */
Room.prototype.ifNeedBuilderWork = function () {
    // 当同时有storage和terminal时说明是稳定的后期，后期保留至少100k能量，防止刷墙、刷门把能量花光
    // 没有storage或terminal说明是前期或被打了的紧急时期，前期靠sourceContainer和Source直接挖，紧急时期也不需要保留能量
    if (this.storage && this.terminal &&
        this.storage.store[RESOURCE_ENERGY] + this.terminal.store[RESOURCE_ENERGY] < 100000) {
        return false;
    }

    let targets;
    // 自卫战争时期停止工地建设，找是否有符合的建筑
    if (this.memory.period.warOfSelfDefence) {
        targets = this.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART
                    || structure.structureType == STRUCTURE_CONTAINER)
                    && judgeIfStructureNeedBuilderRepair(structure);
            }
        });
    }
    // 非自卫战争时期先找建筑工地，再找是否有符合的建筑
    else {
        targets = this.find(FIND_CONSTRUCTION_SITES) ||
            this.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART
                        || structure.structureType == STRUCTURE_CONTAINER)
                        && judgeIfStructureNeedBuilderRepair(structure);
                }
            });
    }

    // 存在工地或者有符合的建筑（血量低于设定的Wall、Rampart）
    return targets.length ? true : false;
}
