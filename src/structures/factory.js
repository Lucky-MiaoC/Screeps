// 各房间生产商品信息初始化
let productInfo = {}
Object.values(Game.rooms).forEach((room) => {
    productInfo[room.name] = null;
})


/**
 * 开始生产商品
 *
 * @param {string} resourceType "RESOURCE_*"常量
 */
StructureFactory.prototype.startProduce = function (resourceType) {
    // 检查参数合法性
    if (!RESOURCES_ALL.includes(resourceType)) {
        console.log(`失败：参数有误，请输入"RESOURCE_*"常量`);
    }

    // 检查工厂等级是否足够
    let factoryLevel = this.level || 0;
    let productLevel = COMMODITIES[resourceType].level || 0;
    if (!(productLevel == 0 && factoryLevel == productLevel)) {
        console.log(`失败：工厂等级不足！无法生产该商品！`);
    }

    productInfo[this.room.name] = resourceType;
    console.log(`注意：Room ${this.room.name} 中的 Factory 开始生产商品 ${resourceType}！`);
}

/**
 * 停止生产商品
 */
StructureFactory.prototype.stopProduce = function () {
    let _resourceType = productInfo[this.room.name];
    productInfo[this.room.name] = null;
    console.log(`注意：Room ${this.room.name} 中的 Factory 停止生产商品 ${_resourceType}！`);
}

/**
 * Factory工作
 */
StructureFactory.prototype.work = function () {
    let resourceType = productInfo[this.room.name];
    if (resourceType && !this.cooldown) {
        // 检查底物是否足够
        let flag = 0;
        Object.keys(COMMODITIES[resourceType].components).forEach((resource) => {
            this.store[resource] >= COMMODITIES[resourceType].components[resource] ?
                null : (flag = 1);
        });

        // 开始生产
        if (!flag && this.store.getFreeCapacity() > 500) {
            // 每20tick控制台提醒一次
            if (!(Game.time % 20)) {
                console.log(`注意：Room ${this.room.name} 中的 Factory 正在生产商品 ${resourceType}！`);
            }
            this.produce(resourceType);
        }
        else {
            // 每20tick控制台提醒一次
            if (!(Game.time % 20)) {
                console.log(`注意：Room ${this.room.name} 中的 Factory 暂停生产商品 ${resourceType}！`);
                console.log(`请检查：Factory 中底物是否足够！容量是否足够！`);
            }
        }
    }
}
