export const configs = {
    // 玩家白名单
    whiteList: {
        'W59N37': ['PandaFlower'],
        'W59N38': ['PandaFlower']
    },

    // 房间签名
    roomSign: {
        'W59N37': `我是新手，别打我，求你了！\nI'am noob, please don't attack me, thanks! \n白名单 whiteList：PandaFlower`,
        'W59N38': `我是新手，别打我，求你了！\nI'am noob, please don't attack me, thanks! \n白名单 whiteList：PandaFlower`
    },

    // 房间carry中心点
    centerPoint: {
        'W59N37': new RoomPosition(19, 12, 'W59N37'),
        'W59N38': null
    },

    // 修墙、门修到的最大血量
    maxHitsRepairingWallOrRampart: {
        'W59N37': 8000000,
        'W59N38': 1000
    },

    // creep角色设定表
    creepRoleSetting: [
        'harvester', 'filler', 'collecter', 'centercarrier', 'upgrader', 'builder', 'miner', 'outsideharvester',
        'warcarrier', 'controllerattacker', 'dismantler'
    ],

    // creep角色优先级设定表
    creepRolePrioritySetting: {
        'filler': 1, 'harvester': 2, 'collecter': 2, 'centercarrier': 2, 'upgrader': 3, 'builder': 4, 'miner': 5, 'outsideharvester': 6,
        'warcarrier': 3, 'controllerattacker': 3, 'dismantler': 3
    },

    // creep数量设定表
    creepNumberSetting: {
        'sim': {
            'harvester': 2, 'filler': 1, 'collecter': 2, 'centercarrier': 1, 'upgrader': 2, 'builder': 2, 'miner': 1, 'outsideharvester': 0,
            'warcarrier': 0, 'controllerattacker': 0, 'dismantler': 0
        },
        'W59N37': {
            'harvester': 2, 'filler': 2, 'collecter': 0, 'centercarrier': 1, 'upgrader': 1, 'builder': 2, 'miner': 0, 'outsideharvester': 0,
            'warcarrier': 0, 'controllerattacker': 0, 'dismantler': 0
        },
        'W59N38': {
            'harvester': 2, 'filler': 1, 'collecter': 2, 'centercarrier': 1, 'upgrader': 4, 'builder': 4, 'miner': 1, 'outsideharvester': 0,
            'warcarrier': 0, 'controllerattacker': 0, 'dismantler': 0
        }
    },

    // 外矿房间设定表
    outsideSoucreRoomSetting: {
        'W59N37': ['W58N37'],
        'W59N38': []
    },

    // creep的body配置表
    creepBodyConfigs: {
        // RCL_1: 300
        'RCL_1': {
            'maxcost': 300,
            'harvester': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            'filler': { [CARRY]: 4, [MOVE]: 2 },
            'collecter': { [CARRY]: 4, [MOVE]: 2 },
            'centercarrier': { [CARRY]: 5, [MOVE]: 1 },
            'upgrader': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            'builder': { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
        },
        // RCL_2: 250 + 300
        'RCL_2': {
            'maxcost': 550,
            'harvester': { [WORK]: 4, [CARRY]: 1, [MOVE]: 2 },
            'filler': { [CARRY]: 5, [MOVE]: 5 },
            'collecter': { [CARRY]: 5, [MOVE]: 5 },
            'centercarrier': { [CARRY]: 10, [MOVE]: 1 },
            'upgrader': { [WORK]: 2, [CARRY]: 1, [MOVE]: 3 },
            'builder': { [WORK]: 2, [CARRY]: 4, [MOVE]: 3 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
        },
        // RCL_3: 500 + 300
        'RCL_3': {
            'maxcost': 800,
            'harvester': { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
            'filler': { [CARRY]: 10, [MOVE]: 5 },
            'collecter': { [CARRY]: 10, [MOVE]: 5 },
            'centercarrier': { [CARRY]: 10, [MOVE]: 1 },
            'upgrader': { [WORK]: 5, [CARRY]: 1, [MOVE]: 5 },
            'builder': { [WORK]: 4, [CARRY]: 4, [MOVE]: 4 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
        },
        // RCL_4: 1000 + 300
        'RCL_4': {
            'maxcost': 1050,
            'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            'filler': { [CARRY]: 10, [MOVE]: 10 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 20, [MOVE]: 1 },
            'upgrader': { [WORK]: 5, [CARRY]: 2, [MOVE]: 5 },
            'builder': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
        },
        // RCL_5: 1500 + 300
        'RCL_5': {
            'maxcost': 1500,
            'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            'filler': { [CARRY]: 10, [MOVE]: 10 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 20, [MOVE]: 1 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 5 },
            'builder': { [WORK]: 10, [CARRY]: 5, [MOVE]: 5 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
        },
        // RCL_6: 2000 + 300
        'RCL_6': {
            'maxcost': 2050,
            'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            'filler': { [CARRY]: 20, [MOVE]: 20 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 40, [MOVE]: 1 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 10 },
            'builder': { [WORK]: 10, [CARRY]: 10, [MOVE]: 10 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
        },
        // RCL_7: 5000 + 600
        'RCL_7': {
            'maxcost': 2050,
            'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            'filler': { [CARRY]: 20, [MOVE]: 20 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 40, [MOVE]: 1 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
            'builder': { [WORK]: 10, [CARRY]: 10, [MOVE]: 10 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 10, [CARRY]: 1, [MOVE]: 10 },
            'warcarrier': { [CARRY]: 20, [MOVE]: 20 },
            'controllerattacker': { [CLAIM]: 2, [MOVE]: 2 },
            'dismantler': { [WORK]: 10, [CARRY]: 10, [MOVE]: 10 },
        },
        // RCL_8: 12000 + 900
        'RCL_8': {
            'maxcost': 3000,
            'harvester': { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            'filler': { [CARRY]: 20, [MOVE]: 20 },
            'collecter': { [CARRY]: 10, [MOVE]: 10 },
            'centercarrier': { [CARRY]: 40, [MOVE]: 1 },
            'upgrader': { [WORK]: 10, [CARRY]: 5, [MOVE]: 15 },
            'builder': { [WORK]: 15, [CARRY]: 15, [MOVE]: 15 },
            'outsideharvester': { [WORK]: 5, [CARRY]: 5, [MOVE]: 5 },
            'miner': { [WORK]: 20, [CARRY]: 1, [MOVE]: 10 },
            'warcarrier': { [CARRY]: 20, [MOVE]: 20 },
            'controllerattacker': { [CLAIM]: 2, [MOVE]: 2 },
            'dismantler': { [WORK]: 10, [CARRY]: 10, [MOVE]: 20 },
        },
    }
}
