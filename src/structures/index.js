/**
 *  修改自群（565401831）里Scorpior_gh大佬的极致建筑缓存v1.4.3，对代码进行大量额外添加、修改、删除以满足本人需求
 *
 *
 *  命令：
 *      唯一建筑类：
 *          room.observer           // 得到observer对象
 *          room.powerSpawn         // 得到powerSpawn对象
 *          room.extractor          // 得到extractor对象
 *          room.nuker              // 得到nuker对象
 *          room.factory            // 得到factory对象
 *          [room.storage]          // 得到storage对象
 *          [room.terminal]         // 得到terminal对象
 *          room.invaderCore        // 得到invaderCore对象
 *
 *      复数建筑类：
 *          room.spawn              // 得到spawn数组
 *          room.extension          // 得到extension数组
 *          room.road               // 得到road数组
 *          room.constructedWall    // 得到constructedWall数组
 *          room.rampart            // 得到rampart数组
 *          room.link               // 得到link数组
 *          room.tower              // 得到tower数组
 *          room.lab                // 得到lab数组
 *          room.container          // 得到container数组
 *          room.powerBank          // 得到powerBank数组
 *          room.keeperLair         // 得到keeperLair数组
 *          room.portal             // 得到portal数组
 *
 *      LOOK_*系列：
 *          [room.controller]       // 得到controller对象
 *          room.mineral            // 得到mineral对象
 *          room.source             // 得到source数组
 *          room.deposit            // 得到deposit数组
 *
 *      link系列:
 *          room.centerLink         // 得到centerLink数组
 *          room.sourceLink         // 得到sourceLink数组
 *          room.upgradeLink        // 得到upgradeLink数组
 *
 *      container系列:
 *          room.sourceContainer    // 得到sourceContainer数组
 *          room.mineralContainer   // 得到mineralContainer数组
 *          room.upgradeContainer   // 得到upgradeContainer数组
 *
 *      rampart系列：
 *          room.centerRampart      // 得到centerRampart数组
 *          room.surroundingRampart // 得到surroundingRampart数组
 *
 *  建筑缓存存放在global.structureIndex[room.name]，唯一对象存id, 复数对象存Set([id])
 *  复数建筑不存在时返回[]，唯一建筑不存在时返回undefined，linkList系列、containerList系列均返回[]（视为复数建筑）
 *  拆除建筑会自动移除缓存，新建筑用room.update()更新缓存，不主动调用room.update()则不会识别新建筑
 *
 *  建筑id缓存在global.structureIndex上，当访问room.*时，实际上是获取缓存里的对应id再转为对象（数组）返回
 *  更新时实际是更新global.structureIndex上的缓存内容
 */

/**
 * 自定义的特殊建筑种类，它们都是现有建筑的子类
 */
// centerLink：非sourceLink和upgradeLink的Link
// 注意：为了可移植性，不采取'房间中心'一定范围内的Link的定义方式
const STRUCTURE_CENTERLINK = "centerLink";
// sourceLink：Source 2格范围内内的Link
const STRUCTURE_SOURCELINK = "sourceLink";
// upgradeLink：Controller 2格范围内的Link（暂时用不到）
const STRUCTURE_UPGRADELINK = "upgradeLink";
// sourceContainer：Source 2格范围内的Container
const STRUCTURE_SOURCECONTAINER = "sourceContainer";
// mineralContainer：Mineral 2格范围内的Container
const STRUCTURE_MINERALCONTAINER = "mineralContainer";
// upgradeContainer：Controller 3格范围内的Container（暂时用不到）
const STRUCTURE_UPGRADECONTAINER = "upgradeContainer"
// centerRampart：覆盖着非Road、Wall的建筑的Rampart以及Controller 1格范围内的Rampart
const STRUCTURE_CENTERRAMPART = "centerRampart";
// surroundingRampart：非centerRampart的Rampart
const STRUCTURE_SURROUNDINGRAMPART = "surroundingRampart";

// 复数建筑类
const multipleList = new Set([
    STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_ROAD, STRUCTURE_WALL,
    STRUCTURE_RAMPART, STRUCTURE_KEEPER_LAIR, STRUCTURE_PORTAL, STRUCTURE_LINK,
    STRUCTURE_TOWER, STRUCTURE_LAB, STRUCTURE_CONTAINER, STRUCTURE_POWER_BANK,
]);

// 唯一建筑类
const singleList = new Set([
    STRUCTURE_OBSERVER, STRUCTURE_POWER_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_NUKER,
    STRUCTURE_FACTORY, STRUCTURE_INVADER_CORE,
    // STRUCTURE_TERMINAL, STRUCTURE_CONTROLLER, STRUCTURE_STORAGE,
]);

// LOOK_*系列
const additionalList = new Set([
    LOOK_SOURCES, LOOK_DEPOSITS, LOOK_TOMBSTONES, LOOK_MINERALS,
]);

// link系列
const linkList = new Set([
    STRUCTURE_CENTERLINK, STRUCTURE_SOURCELINK, STRUCTURE_UPGRADELINK,
])

// container系列
const containerList = new Set([
    STRUCTURE_SOURCECONTAINER, STRUCTURE_MINERALCONTAINER, STRUCTURE_UPGRADECONTAINER,
])

// rampart系列
const rampartList = new Set([
    STRUCTURE_CENTERRAMPART, STRUCTURE_SURROUNDINGRAMPART,
])

// 缓存位置
global.structureIndex = {};


/**
 * structure初始化构造函数
 *
 * @param {Room} room 房间对象
*/
function structureIndexInitialization(room) {
    this.name = room.name;

    // 处理复数建筑类和唯一建筑类
    let structureData = _.groupBy(room.find(FIND_STRUCTURES), (structure) => structure.structureType);
    for (let type in structureData) {
        if (singleList.has(type)) {
            let id = structureData[type][0].id;
            this[type] = id;
        }
        else {
            this[type] = new Set(structureData[type].map((structure) => { return structure.id; }));
        }
    }

    // 处理LOOK_*系列
    for (let type of additionalList) {
        let objects = room.lookForAtArea(type, 1, 1, 49, 49, true);
        if (objects.length > 1) {
            this[type] = new Set(objects.map((object) => { return object[type].id; }));
        }
        else if (objects.length == 1) {
            this[type] = objects[0][type].id;
        }
    }

    // 处理link系列
    room.find(FIND_STRUCTURES, {
        filter: (structure) => { return structure.structureType == STRUCTURE_LINK; }
    }).forEach((link) => {
        if (link.pos.findInRange(FIND_SOURCES, 2).length) {
            this[STRUCTURE_SOURCELINK] = this[STRUCTURE_SOURCELINK] ?
                this[STRUCTURE_SOURCELINK].add(link.id) : new Set([link.id]);
        }
        else if (link.pos.inRangeTo(room.controller, 2)) {
            this[STRUCTURE_UPGRADELINK] = this[STRUCTURE_UPGRADELINK] ?
                this[STRUCTURE_UPGRADELINK].add(link.id) : new Set([link.id]);
        }
        else {
            this[STRUCTURE_CENTERLINK] = this[STRUCTURE_CENTERLINK] ?
                this[STRUCTURE_CENTERLINK].add(link.id) : new Set([link.id]);
        }
    });

    // 处理container系列
    room.find(FIND_STRUCTURES, {
        filter: (structure) => { return structure.structureType == STRUCTURE_CONTAINER; }
    }).forEach((container) => {
        if (container.pos.findInRange(FIND_SOURCES, 2).length) {
            this[STRUCTURE_SOURCECONTAINER] = this[STRUCTURE_SOURCECONTAINER] ?
                this[STRUCTURE_SOURCECONTAINER].add(container.id) : new Set([container.id]);
        }
        else if (container.pos.findInRange(FIND_MINERALS, 2).length) {
            this[STRUCTURE_MINERALCONTAINER] = this[STRUCTURE_MINERALCONTAINER] ?
                this[STRUCTURE_MINERALCONTAINER].add(container.id) : new Set([container.id]);
        }
        else if (container.pos.inRangeTo(room.controller, 2)) {
            this[STRUCTURE_UPGRADECONTAINER] = this[STRUCTURE_UPGRADECONTAINER] ?
                this[STRUCTURE_UPGRADECONTAINER].add(container.id) : new Set([container.id]);
        }
    });

    // 处理rampart系列
    room.find(FIND_STRUCTURES, {
        filter: (structure) => { return structure.structureType == STRUCTURE_RAMPART; }
    }).forEach((rampart) => {
        let structureUnderRampart = _.filter(rampart.pos.lookFor(LOOK_STRUCTURES), (structure) => {
            return structure.structureType != STRUCTURE_ROAD &&
                structure.structureType != STRUCTURE_RAMPART &&
                structure.structureType != STRUCTURE_WALL;
        });
        if (structureUnderRampart.length || rampart.pos.isNearTo(room.controller)) {
            this[STRUCTURE_CENTERRAMPART] = this[STRUCTURE_CENTERRAMPART] ?
                this[STRUCTURE_CENTERRAMPART].add(rampart.id) : new Set([rampart.id]);
        }
        else {
            this[STRUCTURE_SURROUNDINGRAMPART] = this[STRUCTURE_SURROUNDINGRAMPART] ?
                this[STRUCTURE_SURROUNDINGRAMPART].add(rampart.id) : new Set([rampart.id]);
        }
    })

    // 绑定该构造函数到global上
    global.structureIndex[room.name] = this;
}

// 定义获取唯一建筑类时的行为，返回建筑对象或者undefind
singleList.forEach((type) => {
    let bindstring = '_' + type;
    Object.defineProperty(Room.prototype, type, {
        get: function () {
            if (bindstring in this) {
                return this[bindstring];
            }
            else {
                let cache = global.structureIndex[this.name] ?
                    global.structureIndex[this.name][type] : new structureIndexInitialization(this)[type];
                if (cache) {
                    return this[bindstring] = Game.getObjectById(cache);
                }
                else {
                    return this[bindstring] = undefined;
                }
            }
        },
        set: function () {
        },
        enumerable: false,
        configurable: true
    });
})

// 定义获取复数建筑类时的行为，返回建筑对象数组或者[]空数组
multipleList.forEach((type) => {
    let bindstring = '_' + type;
    Object.defineProperty(Room.prototype, type, {
        get: function () {
            if (bindstring in this) {
                return this[bindstring];
            }
            else {
                let cache = global.structureIndex[this.name] ?
                    global.structureIndex[this.name][type] : new structureIndexInitialization(this)[type];
                this[bindstring] = [];
                if (cache) {
                    for (let id of cache) {
                        let object = Game.getObjectById(id);
                        if (object) {
                            this[bindstring].push(object);
                        }
                        else {
                            cache.delete(id);
                        }
                    }
                }
                return this[bindstring];
            }
        },
        set: function () {
        },
        enumerable: false,
        configurable: true
    })
})

// 定义获取LOOK_*系列建筑类时的行为，返回建筑对象数组或者undefined或者[]空数组
additionalList.forEach((type) => {
    let bindstring = '_' + type;
    Object.defineProperty(Room.prototype, type, {
        get: function () {
            if (bindstring in this) {
                return this[bindstring];
            }
            else {
                let cache = global.structureIndex[this.name] ?
                    global.structureIndex[this.name][type] : new structureIndexInitialization(this)[type];
                this[bindstring] = [];
                if (cache) {
                    if (cache instanceof Set) {
                        for (let id of cache) {
                            let object = Game.getObjectById(id);
                            if (object) {
                                this[bindstring].push(object);
                            }
                            else {
                                cache.delete(id);
                            }
                        }
                        return this[bindstring];
                    }
                    else {
                        return this[bindstring] = Game.getObjectById(cache);
                    }
                }
                else {
                    // LOOK_*中LOOK_MINERALS是单一对象，不存在时理应返回undefined，其他的则为复数对象，不存在时理应返回[]，不想分开写
                    return type == LOOK_MINERALS ? (this[bindstring] = undefined) : this[bindstring];
                }
            }
        },
        set: function () {
        },
        enumerable: false,
        configurable: true
    })
})

// 定义获取link系列建筑类时的行为，返回建筑对象数组或者[]空数组
linkList.forEach((type) => {
    let bindstring = '_' + type;
    Object.defineProperty(Room.prototype, type, {
        get: function () {
            if (bindstring in this) {
                return this[bindstring];
            }
            else {
                let cache = global.structureIndex[this.name] ?
                    global.structureIndex[this.name][type] : new structureIndexInitialization(this)[type];
                this[bindstring] = [];
                if (cache) {
                    for (let id of cache) {
                        let object = Game.getObjectById(id);
                        if (object) {
                            this[bindstring].push(object);
                        }
                        else {
                            cache.delete(id);
                        }
                    }
                }
                return this[bindstring];
            }
        },
        set: function () {
        },
        enumerable: false,
        configurable: true
    })
})

// 定义获取container系列建筑类时的行为，返回建筑对象数组或者[]空数组
containerList.forEach((type) => {
    let bindstring = '_' + type;
    Object.defineProperty(Room.prototype, type, {
        get: function () {
            if (bindstring in this) {
                return this[bindstring];
            }
            else {
                let cache = global.structureIndex[this.name] ?
                    global.structureIndex[this.name][type] : new structureIndexInitialization(this)[type];
                this[bindstring] = [];
                if (cache) {
                    for (let id of cache) {
                        let object = Game.getObjectById(id);
                        if (object) {
                            this[bindstring].push(object);
                        }
                        else {
                            cache.delete(id);
                        }
                    }
                }
                return this[bindstring];
            }
        },
        set: function () {
        },
        enumerable: false,
        configurable: true
    })
})

// 定义获取rampart系列建筑类时的行为，返回建筑对象数组或者[]空数组
rampartList.forEach((type) => {
    let bindstring = '_' + type;
    Object.defineProperty(Room.prototype, type, {
        get: function () {
            if (bindstring in this) {
                return this[bindstring];
            }
            else {
                let cache = global.structureIndex[this.name] ?
                    global.structureIndex[this.name][type] : new structureIndexInitialization(this)[type];
                this[bindstring] = [];
                if (cache) {
                    for (let id of cache) {
                        let object = Game.getObjectById(id);
                        if (object) {
                            this[bindstring].push(object);
                        }
                        else {
                            cache.delete(id);
                        }
                    }
                }
                return this[bindstring];
            }
        },
        set: function () {
        },
        enumerable: false,
        configurable: true
    })
})

/**
 * 更新建筑列表
 *
 * @param {string | undefined} type STRUCTURE_*系列
 */
Room.prototype.updateStructureIndex = function (type = undefined) {
    // 全部更新
    if (!type || !global.structureIndex[this.name]) {
        new structureIndexInitialization(this);
    }
    // 更新指定建筑类型
    else if (type) {
        let cache = global.structureIndex[this.name];
        delete cache[type];
        // 更新LOOK_*系列
        if (additionalList.has(type)) {
            let objects = this.lookForAtArea(type, 1, 1, 49, 49, true);
            if (objects.length > 1) {
                cache[type] = new Set(objects.map((object) => {
                    return object[type].id;
                }));
            }
            else if (objects.length == 1) {
                cache[type] = objects[0][type].id;
            }
        }
        // STRUCTURE_LINK更新的时候同时更新linkList
        else if (type == STRUCTURE_LINK) {
            let objects = this.find(FIND_STRUCTURES, {
                filter: (structure) => { return structure.structureType == type; }
            });
            if (objects.length) {
                cache[type] = new Set(objects.map((s) => {
                    return s.id;
                }));
                delete cache[STRUCTURE_SOURCELINK];
                delete cache[STRUCTURE_UPGRADELINK];
                delete cache[STRUCTURE_CENTERLINK];
                objects.forEach((link) => {
                    if (link.pos.findInRange(FIND_SOURCES, 2).length) {
                        cache[STRUCTURE_SOURCELINK] = cache[STRUCTURE_SOURCELINK] ?
                            cache[STRUCTURE_SOURCELINK].add(link.id) : new Set([link.id]);
                    }
                    else if (link.pos.inRangeTo(this.controller, 2)) {
                        cache[STRUCTURE_UPGRADELINK] = cache[STRUCTURE_UPGRADELINK] ?
                            cache[STRUCTURE_UPGRADELINK].add(link.id) : new Set([link.id]);
                    }
                    else {
                        cache[STRUCTURE_CENTERLINK] = cache[STRUCTURE_CENTERLINK] ?
                            cache[STRUCTURE_CENTERLINK].add(link.id) : new Set([link.id]);
                    }
                });
            }
        }
        // STRUCTURE_CONTAINER更新的时候同时更新containerList
        else if (type == STRUCTURE_CONTAINER) {
            let objects = this.find(FIND_STRUCTURES, {
                filter: (structure) => { return structure.structureType == type }
            });
            if (objects.length) {
                cache[type] = new Set(objects.map((s) => {
                    return s.id;
                }));
                delete cache[STRUCTURE_SOURCECONTAINER];
                delete cache[STRUCTURE_MINERALCONTAINER];
                objects.forEach((container) => {
                    if (container.pos.findInRange(FIND_SOURCES, 2).length) {
                        cache[STRUCTURE_SOURCECONTAINER] = cache[STRUCTURE_SOURCECONTAINER] ?
                            cache[STRUCTURE_SOURCECONTAINER].add(container.id) : new Set([container.id]);
                    }
                    else if (container.pos.findInRange(FIND_MINERALS, 2).length) {
                        cache[STRUCTURE_MINERALCONTAINER] = cache[STRUCTURE_MINERALCONTAINER] ?
                            cache[STRUCTURE_MINERALCONTAINER].add(container.id) : new Set([container.id]);
                    }
                    else if (container.pos.inRangeTo(this.controller, 2)) {
                        cache[STRUCTURE_UPGRADECONTAINER] = cache[STRUCTURE_UPGRADECONTAINER] ?
                            cache[STRUCTURE_UPGRADECONTAINER].add(container.id) : new Set([container.id]);
                    }
                });
            }
        }
        // STRUCTURE_RAMPART更新的时候同时更新rampartList
        else if (type == STRUCTURE_RAMPART) {
            let objects = this.find(FIND_STRUCTURES, {
                filter: (structure) => { return structure.structureType == type }
            });
            if (objects.length) {
                cache[type] = new Set(objects.map((s) => {
                    return s.id;
                }));
                delete cache[STRUCTURE_CENTERRAMPART];
                delete cache[STRUCTURE_SURROUNDINGRAMPART];
                objects.forEach((rampart) => {
                    let structureUnderRampart = _.filter(rampart.pos.lookFor(LOOK_STRUCTURES), (structure) => {
                        return structure.structureType != STRUCTURE_ROAD &&
                            structure.structureType != STRUCTURE_RAMPART &&
                            structure.structureType != STRUCTURE_WALL;
                    });
                    if (structureUnderRampart.length || rampart.pos.isNearTo(this.controller)) {
                        cache[STRUCTURE_CENTERRAMPART] = cache[STRUCTURE_CENTERRAMPART] ?
                            cache[STRUCTURE_CENTERRAMPART].add(rampart.id) : new Set([rampart.id]);
                    }
                    else {
                        cache[STRUCTURE_SURROUNDINGRAMPART] = cache[STRUCTURE_SURROUNDINGRAMPART] ?
                            cache[STRUCTURE_SURROUNDINGRAMPART].add(rampart.id) : new Set([rampart.id]);
                    }
                });
            }
        }
        // 更新其他建筑
        else {
            let objects = this.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType == type
            });
            if (objects.length) {
                if (singleList.has(type)) {
                    cache[type] = objects[0].id;
                }
                else {
                    cache[type] = new Set(objects.map((s) => {
                        return s.id;
                    }));
                }
            }
        }
    }
}
