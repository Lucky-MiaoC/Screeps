/**
 * 开始生产商品
 *
 * @param {string} resourceType "RESOURCE_*"常量
 */
StructureFactory.prototype.startProduce = function (resourceType) {
    // 检查参数合法性
    if (!RESOURCES_ALL.includes(resourceType)) {
        console.log(`失败：参数有误，请输入"RESOURCE_*"常量`);
        return undefined;
    }

    // 检查工厂等级是否足够
    let factoryLevel = this.level || 0;
    let productLevel = COMMODITIES[resourceType].level || 0;
    if (productLevel != 0 && factoryLevel != productLevel) {
        console.log(`失败：工厂等级与商品等级不对应！无法生产该商品！`);
        return undefined;
    }

    this.room.memory.structures.factory['produce'] = resourceType;
    console.log(`注意：Room ${this.room.name} 中的 Factory 开始生产商品 ${resourceType}！`);
};

/**
 * 停止生产商品
 */
StructureFactory.prototype.stopProduce = function () {
    let resourceType = this.room.memory.structures.factory['produce'];
    if (resourceType) {
        this.room.memory.structures.factory['produce'] = null;
        console.log(`注意：Room ${this.room.name} 中的 Factory 停止生产商品 ${resourceType}！`);
    }
    else {
        console.log(`失败！Room ${this.room.name} 中的 Factory 并未在生产商品！`);
    }
};

/**
 * Factory工作
 */
StructureFactory.prototype.work = function () {
    // 没有要生产的商品或者工厂冷却中直接返回
    let resourceType = this.room.memory.structures.factory['produce'];
    if (!resourceType || this.cooldown) { return undefined; }

    // 失败持续超过200tick自动停止生产商品
    let failTick = this.room.memory.structures.factory['failTick'];
    if (failTick) {
        if (Game.time - failTick > 200) {
            this.stopProduce();
            this.room.memory.structures.factory['failTick'] = false;
            return undefined;
        }
    }

    // 检查底物是否足够
    let flag = 0;
    for (let resource of Object.keys(COMMODITIES[resourceType].components)) {
        if (this.store[resource] < COMMODITIES[resourceType].components[resource]) {
            flag = 1;
            break;
        }
    }

    // 开始生产
    if (!flag && this.store.getFreeCapacity() >= COMMODITIES[resourceType].amount) {
        this.produce(resourceType);
        if (this.room.memory.structures.factory['failTick']) {
            this.room.memory.structures.factory['failTick'] = false;
        }
        console.log(`注意：Room ${this.room.name} 中的 Factory 正在生产商品 ${resourceType}！`);
    }
    else {
        if (!this.room.memory.structures.factory['failTick']) {
            this.room.memory.structures.factory['failTick'] = Game.time;
        }
        if (!(Game.time % 20)) {
            console.log(`注意：Room ${this.room.name} 中的 Factory 暂停生产商品 ${resourceType}！`);
            console.log(`请检查：Factory 中底物是否足够！容量是否足够！`);
        }
    }
};
