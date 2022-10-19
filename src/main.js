// 导入错误处理程序
import { ErrorMapper } from './error';

// 导入功能模块
import { autoSF } from './autoSF';

// 导入全局依赖和原型拓展
import "./structures/index";
import "./global";
import "./roles/creep";
import "./roles/index";
import "./roles/task";
import "./room";

// 导入建筑
import { towerWork } from "./structures/tower";
import { linkWork } from "./structures/link";
import { labWork } from "./structures/lab";
import "./structures/powerSpawn";
import "./structures/nuker";
import "./structures/factory";
import "./structures/observer";

// 导入powerCreep模块
import { myPowerCreep } from './roles/powerCreep';

// 导入基础角色
import { roleHarvester } from "./roles/baseRoles/roleHarvester";
import { roleFiller } from "./roles/baseRoles/roleFiller";
import { roleCollector } from "./roles/baseRoles/roleCollector";
import { roleCentercarrier } from "./roles/baseRoles/roleCentercarrier";
import { roleUpgrader } from "./roles/baseRoles/roleUpgrader";
import { roleBuilder } from "./roles/baseRoles/roleBuilder";
import { roleMiner } from "./roles/baseRoles/roleMiner";

// 导入远程角色

// 导入战争角色

// 杀死所有creep！
// 注意：该命令风险极高！只有当已存在名称不同于本人命名风格的Creep时使用！
// 注意：该命令需要手动更改false为true以确认操作！
// killAllMyCreeps(false);

// 设置初始化的相关标志位
let doNotClearMyMemory = false;
let doNotInitializeMyStructureIndex = false;
let doNotInitializeMyCreepMemory = false;
let doNotInitializeMyRoomMemory = {};
let doNotInitializeMyGameStatsMemory = false;

// 注意：全局重启时将清空内存
// 注意：测试房间sim会不停的全局重启，因此无法将代码部署到测试房间sim
RawMemory.set("{}");

// 主循环，游戏入口
module.exports.loop = ErrorMapper(() => {
    // 全局重启后将清空Memory，等当前tick结束，Creep和Room的初始的内存才能由游戏自动重新构建完成
    // 也就是说下一个tick才能复游戏初始的内存状态，然后才能在此基础构建自己的Memory
    // 也是因为这个原因无法在全局重启的时候初始化建筑索引和Memory
    if (!doNotClearMyMemory) {
        doNotClearMyMemory = true;
        console.log("tick：" + Game.time + "清空了内存，下一tick将开始建筑索引初始化和内存初始化");
        return undefined;
    }

    // 建筑索引初始化
    // 注意：内存初始化需要依赖建筑索引初始化，请保证先执行建筑索引初始化
    if (!doNotInitializeMyStructureIndex) {
        console.log("建筑索引初始化开始...");
        Object.values(Game.rooms).forEach((room) => {
            if (room.controller && room.controller.my) {
                room.updateStructureIndex();
            }
        });
        console.log("建筑索引初始化完成！");
        doNotInitializeMyStructureIndex = true;
    }

    // creep内存初始化
    // 注意：creep内存初始化依赖已存在creep的名称，请先保证creep名称符合格式
    if (!doNotInitializeMyCreepMemory) {
        console.log("Creep内存初始化开始...");
        try {
            global.creepMemoryInitialization();
            console.log("Creep内存初始化完成！");
        }
        catch {
            console.log("Creep内存初始化失败！可能是Creep名称格式不符！");
            console.log("已存在Creep将无法执行工作！");
        }
        doNotInitializeMyCreepMemory = true;
    }

    // room内存初始化
    // 注意：内存初始化需要依赖建筑索引初始化，请保证先执行建筑索引初始化
    // 提醒：内存初始化在每次扩张房间时需要初始化一次，不像其他内存只需要在全局重启的时候初始化一次
    Object.values(Game.rooms).forEach((room) => {
        if (room.controller && room.controller.my) {
            if (!doNotInitializeMyRoomMemory[room.name]) {
                console.log(`Room：${room.name} 内存初始化开始...`);
                global.roomMemoryInitialization(room);
                console.log(`Room：${room.name} 内存初始化完成！`);
                doNotInitializeMyRoomMemory[room.name] = true;
            }
        }
    });

    // 初始化游戏状态扫描相关内存
    if (!doNotInitializeMyGameStatsMemory) {
        console.log("游戏状态扫描内存初始化开始...");
        Memory.stats = {};
        console.log("游戏状态扫描内存初始化完成！");
        doNotInitializeMyGameStatsMemory = true;
    }

    // 利用空闲cpu获取pixel
    if (Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
        console.log("tick：" + Game.time + "获取了一点pixel！");
    }

    // 房间运维
    Object.values(Game.rooms).forEach((room) => {
        // 判断属于自己的房间，注意需要先判断room.controller，因为过道没有controller，不判断将导致过道有视野时报错
        if (room.controller && room.controller.my) {
            // 每20tick扫描一次是否存在敌对creep（排除了白名单中的玩家的creep），发现则进入自卫战争状态，否则退出自卫战争状态
            // 该方法会更新room.memory.period.warOfSelfDefence的布尔值
            if (!(Game.time % 20)) {
                room.scanHostiles();
            }

            // 清理死亡creep内存
            room.clearDeadCreepMemory();
            // 更新spawn生产任务
            room.updateSpawnTasks();

            // 房间内建筑工作
            // 由于Tower、Link、Lab在相同房间内不同个体之间是协同作用的，因此需要将它们看成一个整体同一处理，因此不使用建筑原型拓展
            towerWork.work(room);
            linkWork.work(room);
            labWork.work(room);
            // PowerSpawn、Nuker、Observer、Factory是个体单独工作，并且需要实现手操，因此使用原型拓展比较好
            if (room.powerSpawn) { room.powerSpawn.work(); }
            if (room.factory) { room.factory.work(); }
            if (room.observer) { room.observer.work(); }
        }
    });

    // powerCreep工作
    Object.values(Game.powerCreeps).forEach((creep) => {
        myPowerCreep.run(creep);
    });

    // creep工作，非设定的creep不会工作但也不会报错
    Object.values(Game.creeps).forEach((creep) => {
        switch (creep.memory.role) {
            case 'harvester': roleHarvester.run(creep); break;
            case 'filler': roleFiller.run(creep); break;
            case 'collector': roleCollector.run(creep); break;
            case 'centercarrier': roleCentercarrier.run(creep); break;
            case 'upgrader': roleUpgrader.run(creep); break;
            case 'builder': roleBuilder.run(creep); break;
            case 'miner': roleMiner.run(creep); break;
            default: break;
        }
    });

    // 自动开启SF模块工作
    autoSF.work();

    // 自动更新建筑索引
    global.autoUpdateStructureIndex();

    // 在内存中更新 RCL、GCL、GPL 使用情况和当前 CPU、bucket 使用情况
    global.stateScanner();
});
