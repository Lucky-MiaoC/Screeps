/**
 * 开始烧power
 */
StructurePowerSpawn.prototype.startProcessPower = function () {
    this.room.memory.structure.powerSpawn = true;
    console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 开始 ProcessPower！`);
};

/**
 * 停止烧power
 */
StructurePowerSpawn.prototype.stopProcessPower = function () {
    if (this.room.memory.structure.powerSpawn) {
        this.room.memory.structure.powerSpawn = false;
        console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 停止 ProcessPower！`);
    }
    else {
        console.log(`失败！Room ${this.room.name} 中的 PowerSpawn 并未在 ProcessPower！`);
    }
};

/**
 * PowerSpawn工作
 */
StructurePowerSpawn.prototype.work = function () {
    if (this.room.memory.structure.powerSpawn) {
        if (this.store[RESOURCE_POWER] >= 1 && this.store[RESOURCE_ENERGY] >= 50) {
            // 每20tick控制台提醒一次
            if (!(Game.time % 20)) {
                console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 正在 ProcessPower！`);
            }
            this.processPower();
        }
        else {
            // 每20tick控制台提醒一次
            if (!(Game.time % 20)) {
                console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 暂停 ProcessPower！`);
                console.log(`请检查：PowerSpawn 中 RESOURCE_POWER 和 RESOURCE_ENERGY 的储存量！`);
            }
        }
    }
};
