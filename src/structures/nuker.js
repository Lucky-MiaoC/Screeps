StructureNuker.prototype.testLaunchNuke = function (pos) {
    console.log(`测试POS参数合法性...${pos instanceof RoomPosition ? '通过！' : '未通过！'}`);
    console.log(`测试冷却时间...${this.cooldown == 0 ? '通过！' : '未通过！'}`);
    console.log(`测试ENERGY...${this.store.getFreeCapacity(RESOURCE_ENERGY) == 0 ? '通过！' : '未通过！'}`);
    console.log(`测试GHODIUM...${this.store.getFreeCapacity(RESOURCE_GHODIUM) == 0 ? '通过！' : '未通过！'}`);
    console.log(`测试发射距离...${Game.map.getRoomLinearDistance(this.room.name, pos.roomName) <= 10 ? '通过！' : '未通过！'}`);
    console.log(`测试目标房间开发状态...${Game.map.getRoomStatus(pos.roomName).status == 'normal' ? '通过！' : '未通过！'}`);
}
