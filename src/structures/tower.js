import { configs } from "../configs";

export const towerWork = {
    work: function (room) {
        // 没有tower直接返回
        if (!room.tower.length) { return undefined; }

        // 每50tick扫描一次是否存在需要tower修复的建筑，用于指导tower修理建筑
        if (!(Game.time % 50)) {
            let structuresNeedTowerRepair = [];
            room.find(FIND_STRUCTURES).forEach((structure) => {
                if (judgeIfStructureNeedTowerRepair(structure)) {
                    structuresNeedTowerRepair.push(structure.id);
                }
            });
            room.memory.structures.tower['repair'] = structuresNeedTowerRepair;
        }

        // 非自卫战争时期，则日常维护或战后维修建筑
        if (!room.memory.period.warOfSelfDefence) {
            // 需要修复的建筑列表为空，直接返回
            if (!room.memory.structures.tower['repair'].length) {
                return undefined;
            }

            // 由于需要修复的建筑列表是50tick扫描一次，所以每tick需要对该列表进行清洗，除去建筑不在了的，除去修好不需要再修的
            _.remove(room.memory.structures.tower['repair'], (structureId) => {
                return (!Game.getObjectById(structureId) ||
                    !judgeIfStructureNeedTowerRepair(Game.getObjectById(structureId)));
            });

            let DamagedStructures = room.memory.structures.tower['repair'].map((structureId) => {
                return Game.getObjectById(structureId);
            });

            let workingTowerId = [];
            let usableTowers = _.filter(room.tower, (tower) => {
                return tower.store[RESOURCE_ENERGY] > 500;
            })
            if (!usableTowers.length) { return undefined; }

            // 日常维护及战后维修留一半能量以防万一，从距离最近的修起
            for (let structure of DamagedStructures) {
                let closestTower = structure.pos.findClosestByRange(usableTowers);
                closestTower.repair(structure);
                workingTowerId.push(closestTower.id);
                if (workingTowerId.length == usableTowers.length) {
                    return undefined;
                }
            }
        }
        // 自卫战争时期，所有塔按照敌方creep的bodypart的构成以及射杀优先级集火射杀敌方creep
        // 射杀优先级[CLAIM, WORK, RANGED_ATTACK, ATTACK, HEAL]排名越靠前数量越多越优先射杀
        else {
            // 没一个tower有能量直接返回
            let towers = _.filter(room.tower, (tower) => {
                return tower.store[RESOURCE_ENERGY] >= 10;
            });
            if (!towers.length) { return undefined; }

            // 获取hostile缓存
            let hostile = Game.getObjectById(room.memory.structures.tower['attack']);

            // 验证hostile缓存
            if (!hostile) {
                hostile = null;
                room.memory.structures.tower['attack'] = null;
            }

            // 获取hostile
            hostile = hostile || room.find(FIND_HOSTILE_CREEPS, {
                filter: (hostile) => {
                    return !configs.whiteList['global'].concat(configs.whiteList[room.name] || []).includes(hostile.owner.username);
                }
            }).sort((i, j) => {
                for (let Bodypart of [CLAIM, WORK, RANGED_ATTACK, ATTACK, HEAL]) {
                    if (i.getActiveBodyparts(Bodypart) > j.getActiveBodyparts(Bodypart)) {
                        return 1;
                    }
                    else if (i.getActiveBodyparts(Bodypart) < j.getActiveBodyparts(Bodypart)) {
                        return -1;
                    }
                    else {
                        continue;
                    }
                }
                return 0;
            })[0];

            // 验证hostile
            if (!hostile) { return undefined; }

            // 缓存hostile
            if (!room.memory.structures.tower['attack']) {
                room.memory.structures.tower['attack'] = hostile.id;
            }

            // 攻击hostile
            towers.forEach((tower) => {
                tower.attack(hostile);
            });
        }
    }
}
