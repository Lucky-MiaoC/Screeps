import { configs } from "../configs";

export const towerWork = {
    work: function (room) {
        let towers = _.filter(room.tower, (i) => {
            return i.store[RESOURCE_ENERGY] >= 10;
        });

        if (towers.length) {
            // 非自卫战争时期，则日常维护或战后维修建筑
            if (!room.memory.code.warOfSelfDefence || room.memory.code.forceNotToAttack) {
                // 需要修复的建筑列表不为空
                if (room.memory.structuresNeedTowerFix.length) {
                    // 由于需要修复的建筑列表是50tick扫描一次，所以每tick需要对该列表进行清洗，除去建筑不在了的，除去修好不需要再修的
                    _.remove(room.memory.structuresNeedTowerFix, (i) => {
                        return (!Game.getObjectById(i) || !global.judgeIfStructureNeedTowerFix(Game.getObjectById(i)));
                    })
                    let structures = _.map(room.memory.structuresNeedTowerFix, (i) => {
                        return Game.getObjectById(i);
                    });
                    towers.forEach((tower) => {
                        // 日常维护及战后维修留一半能量以防万一，从距离最近的修起
                        if (tower.store[RESOURCE_ENERGY] > 500 && structures.length) {
                            let closestDamagedStructure = tower.pos.findClosestByRange(structures);
                            tower.repair(closestDamagedStructure);
                        }
                    })
                }
            }
            // 自卫战争时期，所有塔按照敌方creep的bodypart的构成以及射杀优先级集火射杀敌方creep
            // 射杀优先级[CLAIM, WORK, RANGED_ATTACK, ATTACK, HEAL]排名越靠前数量越多越优先射杀
            else {
                if (room.memory.code.forceNotToAttack) {
                    room.memory.code.warOfSelfDefence = false;
                }
                else {
                    let hostile = Game.getObjectById(room.memory.hostileNeedToAttcak) || room.find(FIND_HOSTILE_CREEPS, {
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

                    if (hostile) {
                        if (!Game.getObjectById(room.memory.hostileNeedToAttcak)) {
                            room.memory.hostileNeedToAttcak = hostile.id;
                        }
                        towers.forEach((tower) => {
                            tower.attack(hostile);
                        })
                    }
                    else {
                        room.memory.hostileNeedToAttcak = null;
                    }
                }
            }
        }
    }
}
