/**
 * 中央搬运任务类
 * 提醒：Memory中不能存放复杂对象
 */
class CenterCarryTask {
    constructor(id, source, target, resourceType, resourceNumber) {
        this.id = id;
        this.sourceId = source.id;
        this.targetId = target.id;
        this.resourceType = resourceType;
        this.resourceNumber = resourceNumber;
        this.progress = 0;
    }
}

/**
 * 创建中央搬运任务，Room原型拓展版本
 *
 * @param {StructureTerminal | StructureStorage | StructureFactory | string} source 源对象，Terminal、Storage、Factory对象本身或其id
 * @param {StructureTerminal | StructureStorage | StructureFactory | string} target 目标对象，Terminal、Storage、Factory对象本身或其id
 * @param {string} resourceType RESOURCE_*系列
 * @param {number} resourceNumber 资源数量
 */
Room.prototype.creatCenterCarryTask = function (source, target, resourceType, resourceNumber) {
    let _source = typeof source == 'string' ? Game.getObjectById(source) : source;
    let _starget = typeof target == 'string' ? Game.getObjectById(target) : target;

    if (!(_source instanceof Structure) || !(_starget instanceof Structure) ||
        !(_source.room.name == _starget.room.name) ||
        !([STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_FACTORY].includes(_source.structureType)) ||
        !([STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_FACTORY].includes(_starget.structureType)) ||
        !(RESOURCES_ALL.includes(resourceType)) || !(typeof resourceNumber == 'number') ||
        !(_source.store[resourceType]) || (_source.store[resourceType] < resourceNumber) ||
        (_starget.store.getFreeCapacity(resourceType) < resourceNumber)) {
        console.log("创建中央搬运任务失败，请检查：");
        console.log("1、source、target、resourceType、resourceNumber类型是否错误");
        console.log("2、source和target是否在同一房间");
        console.log("3、source是否有足够的对应资源的数量");
        console.log("4、target是否有足够的剩余空间");
        return undefined;
    }

    if (_source.room != this.name) {
        console.log("创建中央搬运任务失败，source、target与当前房间不匹配！");
        return undefined;
    }

    if (this.memory.centerCarryTask) {
        console.log("创建中央搬运任务失败，当前房间中央搬运任务尚未完成，请取消当前房间中央搬运任务或等待其完成！");
        return undefined;
    }

    let _task = new CenterCarryTask(Game.time, _source, _starget, resourceType, resourceNumber);
    this.memory.centerCarryTask = _task;
    console.log(`成功在房间${this.name}创建以下中央搬运任务：`);
    console.log(`tick：${_task.id} | sourceType：${Game.getObjectById(_task.sourceId).structureType} | targetType：${Game.getObjectById(_task.targetId).structureType} | resourceType：${_task.resourceType} | resourceNumber：${_task.resourceNumber} | progress：${_task.progress}`);
}

/**
 * 创建中央搬运任务，global全局函数版本
 *
 * @param {StructureTerminal | StructureStorage | StructureFactory | string} source 源对象，Terminal、Storage、Factory对象本身或其id
 * @param {StructureTerminal | StructureStorage | StructureFactory | string} target 目标对象，Terminal、Storage、Factory对象本身或其id
 * @param {string} resourceType RESOURCE_*系列
 * @param {number} resourceNumber 资源数量
 */
global.creatCenterCarryTask = function (source, target, resourceType, resourceNumber) {
    let _source = typeof source == 'string' ? Game.getObjectById(source) : source;
    let _starget = typeof target == 'string' ? Game.getObjectById(target) : target;

    if (!(_source instanceof Structure) || !(_starget instanceof Structure) ||
        !(_source.room.name == _starget.room.name) ||
        !([STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_FACTORY].includes(_source.structureType)) ||
        !([STRUCTURE_TERMINAL, STRUCTURE_STORAGE, STRUCTURE_FACTORY].includes(_starget.structureType)) ||
        !(RESOURCES_ALL.includes(resourceType)) || !(typeof resourceNumber == 'number') ||
        !(_source.store[resourceType]) || (_source.store[resourceType] < resourceNumber) ||
        (_starget.store.getFreeCapacity(resourceType) < resourceNumber)) {
        console.log("创建中央搬运任务失败，请检查：");
        console.log("1、source、target、resourceType、resourceNumber类型是否错误");
        console.log("2、source和target是否在同一房间");
        console.log("3、source是否有足够的对应资源的数量");
        console.log("4、target是否有足够的剩余空间");
        return undefined;
    }

    let room = _source.room;
    if (room.memory.centerCarryTask) {
        console.log("创建中央搬运任务失败，当前房间中央搬运任务尚未完成，请取消当前房间中央搬运任务或等待其完成！");
        return undefined;
    }

    let _task = new CenterCarryTask(Game.time, _source, _starget, resourceType, resourceNumber);
    room.memory.centerCarryTask = _task;
    console.log(`成功在房间${room.name}创建以下中央搬运任务：`);
    console.log(`tick：${_task.id} | sourceType：${Game.getObjectById(_task.sourceId).structureType} | targetType：${Game.getObjectById(_task.targetId).structureType} | resourceType：${_task.resourceType} | resourceNumber：${_task.resourceNumber} | progress：${_task.progress}`);
}

/**
 * 取消已存在的中央搬运任务，Room原型拓展版本
 */
Room.prototype.cancelCenterCarryTask = function () {
    if (this.memory.centerCarryTask) {
        delete this.memory.centerCarryTask;
        console.log(`成功取消房间${this.name}的中央搬运任务`);
    }
    else {
        console.log(`房间${this.name}当前并不存在中央搬运任务！`);
    }
}

/**
 * 取消已存在的中央搬运任务，global全局函数版本
 *
 * @param {Room | string} room 需要取消的中央搬运任务的房间对象或房间名称
 */
global.cancelCenterCarryTask = function (room) {
    if (!room) {
        console.log('请提供room参数！');
        return undefined;
    }

    let _room = (typeof room == 'string') ? Game.rooms[room] : room;

    if (!(_room instanceof Room && _room.controller && _room.controller.my)) {
        console.log("room参数不正确！请检查！");
        return undefined;
    }

    if (_room.memory.centerCarryTask) {
        delete _room.memory.centerCarryTask;
        console.log(`成功取消房间${_room.name}的中央搬运任务`);
    }
    else {
        console.log(`房间${_room.name}当前并不存在中央搬运任务！`);
    }
}

/**
 * 在控制台显示当前存在的中央搬运任务，Room原型拓展版本
 */
Room.prototype.showCenterCarryTask = function () {
    if (this.memory.centerCarryTask) {
        let task = this.memory.centerCarryTask;
        console.log(`房间${room.name}：`);
        console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
    }
}

/**
 * 在控制台显示当前存在的中央搬运任务，global全局函数版本
 *
 * @param {number | null} room 当提供room时只显示对应房间的中央搬运任务，当不提供参数时，显示所有房间的中央搬运任务
 */
global.showCenterCarryTask = function (room = null) {
    if (room) {
        let _room = (typeof room == 'string') ? Game.rooms[room] : room;

        if (!(_room instanceof Room && _room.controller && _room.controller.my)) {
            console.log("room参数不正确！请检查！");
            return undefined;
        }

        if (_room.memory.centerCarryTask) {
            console.log(`房间${_room.name}：`);
            let task = _room.memory.centerCarryTask;
            console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
        }
        else {
            console.log(`房间${_room.name}当前并不存在中央搬运任务！`);
        }
    }
    else {
        let flag = 1;
        Object.values(Game.rooms).forEach((room) => {
            if (room.controller && room.controller.my) {
                if (room.memory.centerCarryTask) {
                    let task = room.memory.centerCarryTask;
                    console.log(`房间${room.name}：`);
                    console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
                    flag = 0;
                }
            }
        })
        if (flag) {
            console.log(`任何房间都不存在中央搬运任务！`);
        }
    }
}
