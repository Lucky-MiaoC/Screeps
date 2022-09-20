StructurePowerSpawn.prototype.startProcessPower = function () {
    this.room.memory.ifProcessPower = true;
    console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 开始 ProcessPower！`);
}

StructurePowerSpawn.prototype.stopProcessPower = function () {
    this.room.memory.ifProcessPower = false;
    console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 停止 ProcessPower！`);
}

StructurePowerSpawn.prototype.work = function () {
    if (this.room.memory.ifProcessPower) {
        if (this.store[RESOURCE_POWER] >= 1 && this.store[RESOURCE_ENERGY] >= 50) {
            // 每10tick控制台提醒一次
            if (!(Game.time % 10)) {
                console.log(`注意：Room ${this.room.name} 中的 PowerSpawn 正在 ProcessPower！`);
            }
            this.processPower();
        }
    }
}
