/**
 * 测试核弹发射
 *
 * @param {RoomPosition | string} pos 核弹发射目标地点，使用new RoomPosition(x, y, TARGET_ROOM_NAME)来生成，也可简单的输入目标房间名称
 * @returns {string} 返回'未通过测试！' 或者 '通过测试！'
 */
StructureNuker.prototype.testLaunchNuke = function (pos) {
    let _pos = typeof pos == 'string' ? new RoomPosition(25, 25, pos) : pos;
    let flag = 0;
    console.log(`测试POS参数合法性...${_pos instanceof RoomPosition ? '通过！' : (flag = 1, '未通过！')}`);
    console.log(`测试冷却时间...${this.cooldown == 0 ? '通过！' : (flag = 1, '未通过！')}`);
    console.log(`测试ENERGY...${this.store.getFreeCapacity(RESOURCE_ENERGY) == 0 ? '通过！' : (flag = 1, '未通过！')}`);
    console.log(`测试GHODIUM...${this.store.getFreeCapacity(RESOURCE_GHODIUM) == 0 ? '通过！' : (flag = 1, '未通过！')}`);
    console.log(`测试发射距离...${Game.map.getRoomLinearDistance(this.room.name, _pos.roomName) <= 10 ? '通过！' : (flag = 1, '未通过！')}`);
    console.log(`测试目标房间开发状态...${Game.map.getRoomStatus(_pos.roomName).status == 'normal' ? '通过！' : (flag = 1, '未通过！')}`);
    return flag ? '未通过测试！' : '通过测试！';
};

/**
 * 发射核弹，简化了参数输入
 *
 * @param {number} x 核弹发射目标地点x坐标
 * @param {number} y 核弹发射目标地点y坐标
 * @param {string} targetRoomName 核弹发射目标房间名称
 */
StructureNuker.prototype.launchMyNuke = function (x, y, targetRoomName) {
    let pos;
    try {
        pos = new RoomPosition(x, y, targetRoomName);
    }
    catch {
        console.log('输入的参数无法构造RoomPosition！');
        return undefined;
    }

    if (this.testLaunchNuke(pos) == '未通过测试！') {
        console.log('核弹发射测试未通过！');
        return undefined;
    }
    else {
        console.log('核弹发射测试通过！开始发射核弹！');
        this.launchNuke(pos);
        console.log('成功发射核弹！');
    }
};
