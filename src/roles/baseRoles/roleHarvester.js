/**
 * harvester是收获能量的，最基础的角色，一出生就和矿绑定在一起，采取挖运分离
 */
export const roleHarvester = {
    run: function (creep) {
        // 生产中的creep不执行操作
        if (creep.spawning) {
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            return undefined;
        }

        // creep状态初始化
        creep.memory.state = 'working';

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() <= 2) {
            creep.memory.ready = true;
        }

        // 快死的时候趁着身上没能量赶紧死，否则浪费能量
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
        }

        // 身上能量满了，优先选择sourceLink，其次是sourceContainer，最后是spawn&&extension
        if (creep.memory.ready && creep.memory.sourceId) {
            let target = Game.getObjectById(creep.memory.targetId) ||
                _.filter(Game.getObjectById(creep.memory.sourceId).pos.findInRange(creep.room.sourceLink, 2), (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                })[0] ||
                _.filter(Game.getObjectById(creep.memory.sourceId).pos.findInRange(creep.room.sourceContainer, 2), (i) => {
                    return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                })[0] ||
                ((creep.room.sourceLink.length || creep.room.sourceContainer.length) ? null :
                    creep.pos.findClosestByPath(_.filter(creep.room.spawn.concat(creep.room.extension), (i) => {
                        return i.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    })));

            if (target) {
                if (!Game.getObjectById(creep.memory.targetId)) {
                    creep.memory.targetId = target.id;
                }

                if (target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    creep.memory.targetId = null;
                }

                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.memory.state = 'moving';
                }

                /*
                // 紧急维修Container代码，如果2级建成Container3级塔还没建成或者塔被打掉时Container老化到快消失使用
                // 使用时记得把上面的transfer代码注释掉
                if (target instanceof StructureContainer && target.hits / target.hitsMax < 0.1) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
                else {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.memory.state = 'moving';
                    }
                }
                */
            }
            else {
                creep.memory.state = 'resting';
            }
        }
        // 身上能量空了，找到memory中的sourceId，如果没有则双向绑定到某矿上，记录该绑定关系，某矿选择由下面的getRelationshipToBeBind()方法确定
        // 注意数量超过房间内矿总可开采位的creep不会得到矿，所以设定时harvester数量不要多于房间内矿总可开采位，当然一般2个harvester就够了
        else {
            if (creep.memory.targetId) {
                creep.memory.targetId = null;
            }

            if (!creep.memory.sourceId) {
                let relationshipToBeBind = getRelationshipToBeBind();
                if (relationshipToBeBind) {
                    relationshipToBeBind.creepNames.push(creep.name);
                    creep.memory.sourceId = relationshipToBeBind.sourceId;
                }
            }

            let source = Game.getObjectById(creep.memory.sourceId);

            if (source && (source.energy > 0)) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.memory.state = 'moving';
                }
            }
            else {
                creep.memory.state = 'resting';
            }
        }

        // 辅助找到适合开采矿的函数，先按照距离排序，后面重新按其他属性排序时相同属性情况下不会改变距离排序
        // 优先选择没creep的矿，其次选择creep少的矿
        // 注意当harvester总数量多于矿总开采位，返回undefined
        function getRelationshipToBeBind() {
            let BindingRelationship = _.filter(creep.room.memory.sourceCreepBindingRelationship, (i) => {
                return Game.getObjectById(i.sourceId).getFreeSpaceNumber() > i.creepNames.length;
            });

            BindingRelationship.sort((i, j) => {
                return creep.pos.getRangeTo(Game.getObjectById(i.sourceId).pos) - creep.pos.getRangeTo(Game.getObjectById(j.sourceId).pos);
            })

            BindingRelationship.forEach((k) => {
                if (!k.creepNames.length) {
                    return k;
                }
            });

            BindingRelationship.sort((i, j) => {
                return i.creepNames.length - j.creepNames.length;
            });
            return BindingRelationship[0];
        }
    }
}
