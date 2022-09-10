import { errorMapper } from './modules/errorMapper';
import { configs } from "./configs";

import { towerWork } from "./structures/tower";
import { linkWork } from "./structures/link";
import { observerWork } from "./structures/observer";

import { roleHarvester } from "./roles/roleHarvester";
import { roleFiller } from "./roles/roleFiller";
import { roleCollecter } from "./roles/roleCollecter";
import { roleCentercarrier } from "./roles/roleCentercarrier";
import { roleUpgrader } from "./roles/roleUpgrader";
import { roleBuilder } from "./roles/roleBuilder";
import { roleMiner } from "./roles/roleMiner";
import { roleOutsideharvester } from "./roles/roleOutsideharvester";

import { roleWarcarrier } from './roles/roleWarcarrier';

import "./structures/index";
import "./global";
import "./room";

// 主循环，每个tick调用
module.exports.loop = errorMapper(() => {
    // 利用空闲cpu获取pixel
    if (Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
    // 建筑索引初始化
    if (!Memory.doNotInitializeMyStructureIndex) {
        Object.keys(Game.rooms).forEach((roomName) => {
            let room = Game.rooms[roomName];
            if (room.controller && room.controller.my) {
                room.updateStructureIndex();
            }
        });
        Memory.doNotInitializeMyStructureIndex = true;
    }

    // 内存初始化执行函数
    if (!Memory.doNotInitializeMyMemory) {
        global.memoryInitialization();
    }

    // 当Spawn被攻击时自动开SF，单房间用，多房间因为同时只能开一个，需要慎重使用
    Object.keys(Game.spawns).forEach((spawnName) => {
        if (Game.spawns[spawnName].hits / Game.spawns[spawnName].hitsMax < 0.9) {
            Game.spawns[spawnName].room.controller.safeMode ? null : Game.spawns[spawnName].room.controller.activateSafeMode();
        }
    })

    // 对每个房间
    Object.keys(Game.rooms).forEach((roomName) => {
        let room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            // 如果controller一格范围内有敌人判断为controller马上被攻击，直接开SF，单房间用，多房间因为同时只能开一个，需要慎重使用
            if (room.controller.pos.findInRange(FIND_HOSTILE_CREEPS, 1).length) {
                room.controller.safeMode ? null : room.controller.activateSafeMode();
            }

            // 每隔100tick扫描一次房间是否有建筑工地或者墙、门是否要builder去修
            if ((Game.time % 100)) {
                room.updateIfNeedBuilderWork();
            }

            // 更新creep内存
            room.updateCreepMemory();
            // 更新creep生产队列
            room.updateSpawnQueue();

            // 检查房间生产队列，如果有，则向随机Spawn分发生产任务
            if (room.memory.spawnQueue.length) {
                room.distributeSpawnTasks();
            }

            // 房间内建筑工作
            towerWork.work(room);
            linkWork.work(room);
            observerWork.work(room);
        }
    });

    // creep工作
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        switch (creep.memory.role) {
            case 'harvester': roleHarvester.run(creep); break;
            case 'filler': roleFiller.run(creep); break;
            case 'collecter': roleCollecter.run(creep); break;
            case 'centercarrier': roleCentercarrier.run(creep); break;
            case 'upgrader': roleUpgrader.run(creep); break;
            case 'builder': roleBuilder.run(creep); break;
            case 'outsideharvester': roleOutsideharvester.run(creep); break;
            case 'miner': roleMiner.run(creep); break;

            case 'warcarrier': roleWarcarrier.run(creep); break;
            default: break;
        }
    }

    // 在内存中更新 RCL、GCL、GPL 使用情况和当前 CPU、bucket 使用情况
    global.stateScanner();
});
