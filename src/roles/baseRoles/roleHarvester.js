export const roleHarvester = {
    run: function (creep) {
        // 生产中的creep不执行代码
        if (creep.spawning) { return undefined; }

        // 快死的时候趁着身上没资源赶紧死，否则浪费资源
        if (creep.ticksToLive < 10 && creep.store.getUsedCapacity() == 0) {
            creep.suicide();
            return undefined;
        }

        // 手动控制
        if (!creep.memory.autoControl) {
            // WRITE YOUR CODE WHEN CREEP IS NOT AUTOCONTROL
            return undefined;
        }

        // 工作状态切换
        if (creep.memory.ready && creep.store.getUsedCapacity() == 0) {
            creep.memory.ready = false;
            creep.memory.targetId = null;
        }
        if (!creep.memory.ready && creep.store.getFreeCapacity() <= 2) {
            creep.memory.ready = true;
            // creep.memory.sourceId = null;
        }

        // harvester特殊，需要先获取source，才能定位target，并且不清除creep.memory.sourceId
        if (!creep.memory.sourceId) {
            // 获取source
            let source = creep.chooseSource();

            // 验证source
            if (!source) { return undefined; }

            // 缓存source
            creep.memory.sourceId = source.id;
            creep.room.memory.sourceInfo[source.id].push(creep.name);
        }

        // 获取source缓存，不需要再验证缓存，不需要再获取source，不需要再缓存source
        let source = Game.getObjectById(creep.memory.sourceId);

        // 获取target缓存
        let target = Game.getObjectById(creep.memory.targetId);

        // 验证target缓存
        if (!target || (target instanceof Structure && target.store.getFreeCapacity(RESOURCE_ENERGY) == 0)) {
            target = null;
            creep.memory.targetId = null;
        }

        // 获取target
        target = target
            || _.filter(source.pos.findInRange(creep.room.sourceLink, 2), (link) => {
                return link.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            })[0]
            || _.filter(source.pos.findInRange(creep.room.sourceContainer, 2), (container) => {
                return container.store.getFreeCapacity() > 0;
            })[0]
            || ((source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2, {
                filter: (constructionSite) => {
                    return constructionSite.structureType == STRUCTURE_CONTAINER || constructionSite.structureType == STRUCTURE_LINK;
                }
            })))[0];

        // 验证target
        if (!target) {
            return undefined;
        }

        // 缓存target
        if (!creep.memory.targetId) {
            creep.memory.targetId = target.id;
        }

        // 工作逻辑代码
        if (!creep.memory.ready) {
            // 获取source缓存
            // let source = Game.getObjectById(creep.memory.sourceId);

            // 验证source缓存
            // if (!source || source.energy == 0) {
            //     source = null;
            //     // creep.memory.sourceId = null;
            // }

            // 获取source
            // source = source || creep.chooseSource();
            // }));

            // 验证source
            // if (!source) { return undefined; }

            // 缓存source
            // if (!creep.memory.sourceId) {
            //     creep.memory.sourceId = source.id;
            //     creep.room.memory.sourceInfo[source.id].push(creep.name);
            // }

            // source交互
            if (source.energy != 0) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            else {
                if (creep.store[RESOURCE_ENERGY] > 0) {
                    creep.memory.ready = true;
                }
            }
        }
        else {
            // target交互
            if (target instanceof Structure) {
                if (target instanceof StructureContainer && target.hits / target.hitsMax < 0.8) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                else {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
            else if (target instanceof ConstructionSite) {
                if (creep.build(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
};
