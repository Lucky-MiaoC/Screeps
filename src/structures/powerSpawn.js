/**
 * 开始烧power
 */
StructurePowerSpawn.prototype.startProcessPower = function () {
    this.room.memory.structures.powerSpawn['processPower'] = true;
    console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 开始 ProcessPower！`);
};

/**
 * 停止烧power
 */
StructurePowerSpawn.prototype.stopProcessPower = function () {
    if (this.room.memory.structures.powerSpawn) {
        this.room.memory.structures.powerSpawn['processPower'] = false;
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
    // 不需要烧power直接返回
    if (!this.room.memory.structures.powerSpawn['processPower']) {
        return undefined;
    }

    // 失败持续超过200tick自动停止烧power
    let failTick = this.room.memory.structures.powerSpawn['failTick'];
    if (failTick) {
        if (Game.time - failTick > 200) {
            this.stopProcessPower();
            this.room.memory.structures.powerSpawn['failTick'] = false;
            return undefined;
        }
    }

    if (this.store[RESOURCE_POWER] >= 1 && this.store[RESOURCE_ENERGY] >= 50) {
        this.processPower();
        if (this.room.memory.structures.powerSpawn['failTick']) {
            this.room.memory.structures.powerSpawn['failTick'] = false;
        }
        // 每20tick控制台提醒一次
        if (!(Game.time % 20)) {
            console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 正在 ProcessPower！`);
        }
    }
    else {
        // 每20tick控制台提醒一次
        if (!this.room.memory.structures.powerSpawn['failTick']) {
            this.room.memory.structures.powerSpawn['failTick'] = Game.time;
        }
        if (!(Game.time % 20)) {
            console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 暂停 ProcessPower！`);
            console.log(`请检查：PowerSpawn 中 RESOURCE_POWER 和 RESOURCE_ENERGY 的储存量！`);
        }
    }
};
