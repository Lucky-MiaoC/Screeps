const baseRoles = ['filler', 'harvester', 'collecter', 'centercarrier', 'upgrader', 'builder', 'miner'];
const warRoles = [];
const remoteRoles = [];

export const configs = {
    // 玩家白名单
    whiteList: {
        // 全局白名单
        'global': ['PandaFlower'],
        // 还可以设置各个房间单独的白名单，参照以下例子：
        // 'W59N37': []
    },

    // 房间Centercarrier所处的中心点，指导centerCarrier生产、移动，没有也不会报错，但是centercarrier无法正常生产移动
    centerPoint: {
        'W59N37': new RoomPosition(19, 12, 'W59N37'),
        // 'W59N38': null
    },

    // 修Wall、Rampart修到的目标血量，没有也不会报错，会在内部将其设为0，放心builder受到资源的限制不会无限修
    maxHitsRepairingWallOrRampart: {
        'centerRampart': {
            'W59N37': 12000000,
            // 'W59N38': 10000
        },
        'surroundingRampart': {
            'W59N37': 10000,
            // 'W59N38': 10000
        },
        [STRUCTURE_WALL]: {
            'W59N37': 10000,
            // 'W59N38': 10000
        }
    },


    // creep角色设定表
    // 说明：creepRoleSetting暗含了creepRole的生产优先级，creepRoleSetting中索引越小的角色生产优先级越高
    // baseRoles生产优先级 > warRoles生产优先级 > remoteRoles生产优先级
    // 如果对生产优先级有特殊要求的可以修改room.js中addSpawnTasks排序方法
    // creepRoleSetting无法直接调用baseRoles、warRoles、remoteRoles，因此将它们移出configs定义
    baseRoles: baseRoles,
    warRoles: warRoles,
    remoteRoles: remoteRoles,
    creepRoleSetting: [...baseRoles, ...warRoles, ...remoteRoles],

    // creep数量设定表
    // 提醒：是否生产某一角色取决于角色数量设定以及该角色是否达到房间生产条件
    creepNumberSetting: {
        'W59N37': {
            'baseRoles': { 'harvester': 2, 'filler': 2, 'collecter': 1, 'upgrader': 1, 'builder': 2, 'centercarrier': 1, 'miner': 0 },
            'warRoles': {},
            'remoteRoles': {},
        },
        'W59N38': {
            'baseRoles': { 'harvester': 2, 'filler': 2, 'collecter': 1, 'upgrader': 4, 'builder': 2, 'centercarrier': 1, 'miner': 0 },
            'warRoles': {},
            'remoteRoles': {},
        }
    },

    // creep的body配置表
    creepBodyConfigs: {
        // RCL_1: 300
        'RCL_1': {
            'maxcost': 300,
            // baseRoles
            'harvester': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            'filler': { [CARRY]: 4, [MOVE]: 2 },
            'collecter': { [CARRY]: 4, [MOVE]: 2 },
            'upgrader': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            'builder': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
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
            'collecter': { [CARRY]: 5, [MOVE]: 5 },
            'upgrader': { [WORK]: 2, [CARRY]: 1, [MOVE]: 3 },
            'builder': { [WORK]: 2, [CARRY]: 4, [MOVE]: 3 },
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
            'filler': { [CARRY]: 10, [MOVE]: 5 },
            'collecter': { [CARRY]: 10, [MOVE]: 5 },
            'upgrader': { [WORK]: 5, [CARRY]: 1, [MOVE]: 5 },
            'builder': { [WORK]: 4, [CARRY]: 4, [MOVE]: 4 },
            'centercarrier': { [CARRY]: 10, [MOVE]: 1 },
            'miner': { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
            // warRoles
            // remoteRoles
        },
        // RCL_4: 1000 + 300
        'RCL_4': {
            'maxcost': 1250,
            // baseRoles
            'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            'filler': { [CARRY]: 10, [MOVE]: 10 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'upgrader': { [WORK]: 5, [CARRY]: 2, [MOVE]: 5 },
            'builder': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'centercarrier': { [CARRY]: 20, [MOVE]: 5 },
            'miner': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            // warRoles
            // remoteRoles
        },
        // RCL_5: 1500 + 300
        'RCL_5': {
            'maxcost': 1500,
            // baseRoles
            'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
            'filler': { [CARRY]: 10, [MOVE]: 10 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 5 },
            'builder': { [WORK]: 10, [CARRY]: 5, [MOVE]: 5 },
            'centercarrier': { [CARRY]: 20, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 5 },
            // warRoles
            // remoteRoles
        },
        // RCL_6: 2000 + 300
        'RCL_6': {
            'maxcost': 2250,
            // baseRoles
            'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
            'filler': { [CARRY]: 20, [MOVE]: 20 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 10 },
            'builder': { [WORK]: 10, [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 40, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
            // warRoles
            // remoteRoles
        },
        // RCL_7: 5000 + 600
        'RCL_7': {
            'maxcost': 2500,
            // baseRoles
            'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
            'filler': { [CARRY]: 20, [MOVE]: 20 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
            'builder': { [WORK]: 10, [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 40, [MOVE]: 10 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
            // warRoles
            // remoteRoles
        },
        // RCL_8: 12000 + 900
        'RCL_8': {
            'maxcost': 3000,
            // baseRoles
            'harvester': { [WORK]: 10, [CARRY]: 2, [MOVE]: 5 },
            'filler': { [CARRY]: 20, [MOVE]: 20 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
            'builder': { [WORK]: 15, [CARRY]: 15, [MOVE]: 15 },
            'centercarrier': { [CARRY]: 40, [MOVE]: 10 },
            'miner': { [WORK]: 20, [CARRY]: 1, [MOVE]: 10 },
            // warRoles
            // remoteRoles
        },
    },
}
