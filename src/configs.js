// 玩家白名单
const whiteList = {
    // 全局白名单
    'global': ['PandaFlower'],
    // 私有白名单
    'W59N37': ['Super_C'],
    'W59N38': ['TC_MiaoC'],
    'W19N59': [],
};

// 房间中心点，指导centerCarrier生产工作，没有也不会报错，但是centercarrier无法正常生产工作
const centerPoint = {
    'W59N37': new RoomPosition(19, 12, 'W59N37'),
    'W59N38': new RoomPosition(41, 12, 'W59N38'),
    'W19N59': new RoomPosition(18, 19, 'W19N59'),
};

// Wall、Rampart的目标血量，没有也不会报错，会在内部将其设为0
const maxHitsRepairingWallOrRampart = {
    'W59N37': {
        'centerRampart': 12000000,
        'surroundingRampart': 400000,
        'constructedWall': 400000
    },
    'W59N38': {
        'centerRampart': 20000,
        'surroundingRampart': 20000,
        'constructedWall': 20000
    },
    'W19N59': {
        'centerRampart': 10000,
        'surroundingRampart': 10000,
        'constructedWall': 10000
    },
};


// creep角色设定表
// 说明：creepRoleSetting暗含了creepRole的生产优先级，creepRoleSetting中索引越小的角色生产优先级越高
// baseRoles生产优先级 > warRoles生产优先级 > remoteRoles生产优先级
const baseRoles = ['filler', 'harvester', 'centercarrier', 'upgrader', 'builder', 'miner'];
const warRoles = [];
const remoteRoles = [];
const creepRoleSetting = [...baseRoles, ...warRoles, ...remoteRoles];

// creep数量设定表
// 提醒：是否生产某一角色取决于角色数量设定以及该角色是否达到房间生产条件
// 提醒：为了减少判断生产条件的cpu花费，可以将长期确定不会生产的角色数量设置为0
const creepNumberSetting = {
    'W59N37': {
        // baseRoles
        'harvester': 2, 'filler': 2, 'upgrader': 1, 'builder': 2, 'centercarrier': 1, 'miner': 0,
        // warRoles
        // remoteRoles
    },
    'W59N38': {
        // baseRoles
        'harvester': 2, 'filler': 2, 'upgrader': 1, 'builder': 2, 'centercarrier': 1, 'miner': 1,
        // warRoles
        // remoteRoles
    },
    'W19N59': {
        // baseRoles
        'harvester': 2, 'filler': 2, 'upgrader': 2, 'builder': 2, 'centercarrier': 1, 'miner': 0,
        // warRoles
        // remoteRoles
    },
};

// creep身体配置表
const creepBodyConfigs = {
    // RCL_1: 300
    'RCL_1': {
        'maxcost': 300,
        // baseRoles
        'harvester': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
        'filler': { [CARRY]: 3, [MOVE]: 3 },
        'upgrader': { [WORK]: 1, [CARRY]: 1, [MOVE]: 2 },
        'builder': { [WORK]: 1, [CARRY]: 1, [MOVE]: 2 },
        'centercarrier': { [CARRY]: 5, [MOVE]: 1 },
        'miner': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
        // warRoles
        // remoteRoles
    },
    // RCL_2: 250 + 300
    'RCL_2': {
        'maxcost': 550,
        // baseRoles
        'harvester': { [WORK]: 4, [CARRY]: 1, [MOVE]: 2 },
        'filler': { [CARRY]: 5, [MOVE]: 5 },
        'upgrader': { [WORK]: 3, [CARRY]: 1, [MOVE]: 4 },
        'builder': { [WORK]: 2, [CARRY]: 2, [MOVE]: 4 },
        'centercarrier': { [CARRY]: 10, [MOVE]: 1 },
        'miner': { [WORK]: 4, [CARRY]: 1, [MOVE]: 2 },
        // warRoles
        // remoteRoles
    },
    // RCL_3: 500 + 300
    'RCL_3': {
        'maxcost': 800,
        // baseRoles
        'harvester': { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
        'filler': { [CARRY]: 8, [MOVE]: 8 },
        'upgrader': { [WORK]: 4, [CARRY]: 2, [MOVE]: 6 },
        'builder': { [WORK]: 4, [CARRY]: 2, [MOVE]: 6 },
        'centercarrier': { [CARRY]: 15, [MOVE]: 1 },
        'miner': { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
        // warRoles
        // remoteRoles
    },
    // RCL_4: 1000 + 300
    'RCL_4': {
        'maxcost': 1200,
        // baseRoles
        'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
        'filler': { [CARRY]: 10, [MOVE]: 10 },
        'upgrader': { [WORK]: 6, [CARRY]: 3, [MOVE]: 9 },
        'builder': { [WORK]: 6, [CARRY]: 3, [MOVE]: 9 },
        'centercarrier': { [CARRY]: 20, [MOVE]: 1 },
        'miner': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
        // warRoles
        // remoteRoles
    },
    // RCL_5: 1500 + 300
    'RCL_5': {
        'maxcost': 1600,
        // baseRoles
        'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
        'filler': { [CARRY]: 20, [MOVE]: 10 },
        'upgrader': { [WORK]: 8, [CARRY]: 4, [MOVE]: 12 },
        'builder': { [WORK]: 8, [CARRY]: 4, [MOVE]: 12 },
        'centercarrier': { [CARRY]: 30, [MOVE]: 1 },
        'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 5 },
        // warRoles
        // remoteRoles
    },
    // RCL_6: 2000 + 300
    'RCL_6': {
        'maxcost': 2050,
        // baseRoles
        'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
        'filler': { [CARRY]: 20, [MOVE]: 10 },
        'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
        'builder': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
        'centercarrier': { [CARRY]: 40, [MOVE]: 1 },
        'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 5 },
        // warRoles
        // remoteRoles
    },
    // RCL_7: 5000 + 600
    'RCL_7': {
        'maxcost': 3200,
        // baseRoles
        'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
        'filler': { [CARRY]: 30, [MOVE]: 15 },
        'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
        'builder': { [WORK]: 16, [CARRY]: 8, [MOVE]: 24 },
        'centercarrier': { [CARRY]: 40, [MOVE]: 1 },
        'miner': { [WORK]: 20, [CARRY]: 1, [MOVE]: 10 },
        // warRoles
        // remoteRoles
    },
    // RCL_8: 12000 + 900
    'RCL_8': {
        'maxcost': 3200,
        // baseRoles
        'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
        'filler': { [CARRY]: 30, [MOVE]: 15 },
        'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
        'builder': { [WORK]: 16, [CARRY]: 8, [MOVE]: 24 },
        'centercarrier': { [CARRY]: 40, [MOVE]: 1 },
        'miner': { [WORK]: 20, [CARRY]: 1, [MOVE]: 10 },
        // warRoles
        // remoteRoles
    },
};


// 从反应目标产物获取其底物的对应表
const reactionSource = {
    // 三级化合物
    [RESOURCE_CATALYZED_GHODIUM_ACID]: [RESOURCE_GHODIUM_ACID, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]: [RESOURCE_GHODIUM_ALKALIDE, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_KEANIUM_ACID]: [RESOURCE_KEANIUM_ACID, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: [RESOURCE_KEANIUM_ALKALIDE, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_LEMERGIUM_ACID]: [RESOURCE_LEMERGIUM_ACID, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: [RESOURCE_LEMERGIUM_ALKALIDE, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_UTRIUM_ACID]: [RESOURCE_UTRIUM_ACID, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_UTRIUM_ALKALIDE]: [RESOURCE_UTRIUM_ALKALIDE, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_ZYNTHIUM_ACID]: [RESOURCE_ZYNTHIUM_ACID, RESOURCE_CATALYST],
    [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]: [RESOURCE_ZYNTHIUM_ALKALIDE, RESOURCE_CATALYST],
    // 二级化合物
    [RESOURCE_GHODIUM_ACID]: [RESOURCE_GHODIUM_HYDRIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_GHODIUM_ALKALIDE]: [RESOURCE_GHODIUM_OXIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_KEANIUM_ACID]: [RESOURCE_KEANIUM_HYDRIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_KEANIUM_ALKALIDE]: [RESOURCE_KEANIUM_OXIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_LEMERGIUM_ACID]: [RESOURCE_LEMERGIUM_HYDRIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_LEMERGIUM_ALKALIDE]: [RESOURCE_LEMERGIUM_OXIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_UTRIUM_ACID]: [RESOURCE_UTRIUM_HYDRIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_UTRIUM_ALKALIDE]: [RESOURCE_UTRIUM_OXIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_ZYNTHIUM_ACID]: [RESOURCE_ZYNTHIUM_HYDRIDE, RESOURCE_HYDROXIDE],
    [RESOURCE_ZYNTHIUM_ALKALIDE]: [RESOURCE_ZYNTHIUM_OXIDE, RESOURCE_HYDROXIDE],
    // 一级化合物
    [RESOURCE_GHODIUM_HYDRIDE]: [RESOURCE_GHODIUM, RESOURCE_HYDROGEN],
    [RESOURCE_GHODIUM_OXIDE]: [RESOURCE_GHODIUM, RESOURCE_OXYGEN],
    [RESOURCE_KEANIUM_HYDRIDE]: [RESOURCE_KEANIUM, RESOURCE_HYDROGEN],
    [RESOURCE_KEANIUM_OXIDE]: [RESOURCE_KEANIUM, RESOURCE_OXYGEN],
    [RESOURCE_LEMERGIUM_HYDRIDE]: [RESOURCE_LEMERGIUM, RESOURCE_HYDROGEN],
    [RESOURCE_LEMERGIUM_OXIDE]: [RESOURCE_LEMERGIUM, RESOURCE_OXYGEN],
    [RESOURCE_UTRIUM_HYDRIDE]: [RESOURCE_UTRIUM, RESOURCE_HYDROGEN],
    [RESOURCE_UTRIUM_OXIDE]: [RESOURCE_UTRIUM, RESOURCE_OXYGEN],
    [RESOURCE_ZYNTHIUM_HYDRIDE]: [RESOURCE_ZYNTHIUM, RESOURCE_HYDROGEN],
    [RESOURCE_ZYNTHIUM_OXIDE]: [RESOURCE_ZYNTHIUM, RESOURCE_OXYGEN],
    [RESOURCE_GHODIUM]: [RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE],
    // 基础化合物
    [RESOURCE_ZYNTHIUM_KEANITE]: [RESOURCE_ZYNTHIUM, RESOURCE_KEANIUM],
    [RESOURCE_UTRIUM_LEMERGITE]: [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM],
    [RESOURCE_HYDROXIDE]: [RESOURCE_HYDROGEN, RESOURCE_OXYGEN],
};

export const configs = {
    whiteList, centerPoint, maxHitsRepairingWallOrRampart,
    creepRoleSetting, creepNumberSetting, creepBodyConfigs,
    reactionSource,
};
