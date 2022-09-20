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
        console.log("创建中央搬运任务失败，source、target与房间不匹配！");
        return undefined;
    }

    if (this.memory.centerCarryTask.some((task) => {
        return task.id == Game.time;
    })) {
        console.log("创建中央搬运任务失败，同一tick一个Room只能创建一份中央搬运任务，请下一tick之后重试");
        return undefined;
    }

    let _task = new CenterCarryTask(Game.time, _source, _starget, resourceType, resourceNumber);
    this.memory.centerCarryTask.push(_task);
    console.log(`成功在房间${this.name}创建以下中央搬运任务：`);
    console.log(`id：${_task.id} | sourceType：${Game.getObjectById(_task.sourceId).structureType} | targetType：${Game.getObjectById(_task.targetId).structureType} | resourceType：${_task.resourceType} | resourceNumber：${_task.resourceNumber} | progress：${_task.progress}`);
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
    if (room.memory.centerCarryTask.some((task) => {
        return task.id == Game.time;
    })) {
        console.log("创建中央搬运任务失败，同一tick一个Room只能创建一份中央搬运任务，请下一tick之后重试");
        return undefined;
    }

    let _task = new CenterCarryTask(Game.time, _source, _starget, resourceType, resourceNumber);
    room.memory.centerCarryTask.push(_task);
    console.log(`成功在房间${room.name}创建以下中央搬运任务：`);
    console.log(`id：${_task.id} | sourceType：${Game.getObjectById(_task.sourceId).structureType} | targetType：${Game.getObjectById(_task.targetId).structureType} | resourceType：${_task.resourceType} | resourceNumber：${_task.resourceNumber} | progress：${_task.progress}`);
}

/**
 * 取消已存在的中央搬运任务，Room原型拓展版本
 *
 * @param {number} taskId 需要取消的中央搬运任务的id
 */
Room.prototype.cancelCenterCarryTask = function (taskId) {
    if (this.memory.centerCarryTask.some((task) => {
        return task.id == taskId;
    })) {
        _.remove(this.memory.centerCarryTask, (task) => {
            return task.id == taskId;
        });
        console.log(`成功移除房间${this.name}中id为${taskId}的中央搬运任务`);
    }
    else {
        console.log(`房间${this.name}不存在id为${taskId}的中央搬运任务，请检查id是否正确！`);
    }
}

/**
 * 取消已存在的中央搬运任务，global全局函数版本
 *
 * @param {Room | string} room 需要取消的中央搬运任务的房间对象或房间名称
 * @param {number} taskId 需要取消的中央搬运任务的id
 */
global.cancelCenterCarryTask = function (room, taskId) {
    if (!room || !taskId) {
        console.log('请提供两个参数：room和taskId');
        return undefined;
    }

    let _room = (typeof room == 'string') ? Game.rooms[room] : room;

    if (!(_room instanceof Room && _room.controller && _room.controller.my)) {
        console.log("room参数不正确！请检查！");
        return undefined;
    }

    if (_room.memory.centerCarryTask.some((task) => {
        return task.id == taskId;
    })) {
        _.remove(_room.memory.centerCarryTask, (task) => {
            return task.id == taskId;
        });
        console.log(`成功移除房间${_room.name}中id为${taskId}的中央搬运任务`);
    }
    else {
        console.log(`房间${_room.name}不存在id为${taskId}的中央搬运任务，请检查id是否正确！`);
    }
}

/**
 * 在控制台显示当前存在的中央搬运任务，Room原型拓展版本
 *
 * @param {number | null} taskId 当提供id时只显示对应中央搬运任务，当不提供参数时，显示所有中央搬运任务
 */
Room.prototype.showCenterCarryTask = function (taskId = null) {
    if (taskId) {
        let task = this.memory.centerCarryTask.find((t) => {
            return t.id == taskId;
        })
        if (task) {
            console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
        }
        else {
            console.log(`房间${this.name}不存在id为${taskId}的中央搬运任务`);
        }
    }
    else {
        this.memory.centerCarryTask.forEach((task) => {
            console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
        });
    }
}

/**
 * 在控制台显示当前存在的中央搬运任务，global全局函数版本
 *
 * @param {number | null} room 当提供room时只显示对应房间的中央搬运任务，当不提供参数时，显示所有房间的中央搬运任务
 * @param {number | null} taskId 当提供id时只显示对应中央搬运任务，当不提供参数时，显示所有中央搬运任务
 */
global.showCenterCarryTask = function (room = null, taskId = null) {
    if (room) {
        let _room = (typeof room == 'string') ? Game.rooms[room] : room;

        if (!(_room instanceof Room && _room.controller && _room.controller.my)) {
            console.log("room参数不正确！请检查！");
            return undefined;
        }

        if (taskId) {
            let task = _room.memory.centerCarryTask.find((t) => {
                return t.id == taskId;
            })
            if (task) {
                console.log(`在房间${_room.name}中：`);
                console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
            }
            else {
                console.log(`房间${_room.name}不存在id为${taskId}的中央搬运任务！请检查id是否正确！`);
            }
        }
        else {
            if (_room.memory.centerCarryTask.length) {
                console.log(`在房间${_room.name}中：`);
                _room.memory.centerCarryTask.forEach((task) => {
                    console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
                });
            }
            else {
                console.log(`房间${_room.name}中不存在中央搬运任务！`);
            }
        }
    }
    else {
        if (taskId) {
            let i = 1;
            Object.values(Game.rooms).forEach((room) => {
                if (room.controller && room.controller.my) {
                    let task = room.memory.centerCarryTask.find((t) => {
                        return t.id == taskId;
                    })
                    if (task) {
                        i = 0;
                        console.log(`在房间${room.name}中找到id为${taskId}的中央搬运任务：`);
                        console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
                    }
                }
            })
            if (i) {
                console.log(`任何房间都不存在id为${taskId}的中央搬运任务！请检查id是否正确！`);
            }
        }
        else {
            let j = 1;
            let k = 1;
            Object.values(Game.rooms).forEach((room) => {
                if (room.controller && room.controller.my) {
                    room.memory.centerCarryTask.forEach((task) => {
                        if (j == 1) {
                            console.log(`在房间${room.name}中：`);
                            j = 0;
                            k = 0;
                        }
                        console.log(`id：${task.id} | sourceType：${Game.getObjectById(task.sourceId).structureType} | targetType：${Game.getObjectById(task.targetId).structureType} | resourceType：${task.resourceType} | resourceNumber：${task.resourceNumber} | progress：${task.progress}`);
                    });
                }
            })
            if (k) {
                console.log(`任何房间都不存在中央搬运任务！`);
            }
        }
    }
}
