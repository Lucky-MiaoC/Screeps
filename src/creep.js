/**
 * 按数量和距离综合权重随机选择一个DroppedResource
 *
 * @param {number} limit 当资源数量大于limit时才会被选到
 * @returns {Resource | null} 随机返回一个DroppedResource或者null
 */
Creep.prototype.chooseDroppedResource = function (limit = 0) {
    let droppedResources = [];
    this.room.source.forEach((i) => {
        droppedResources.concat(i.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
            filter: (j) => { return j.resourceType == RESOURCE_ENERGY && j.amount > limit; }
        }));
    });

    if (!droppedResources.length) { return null; }
    if (droppedResources.length == 1) { return droppedResources[0]; }
    if (this.store[RESOURCE_ENERGY]) { return creep.pos.findClosestByRange(droppedResources); }

    let totalAmount = droppedResources.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.amount;
    }, 0);
    let totatlDistance = droppedResources.reduce((previousValue, currentValue) => {
        return previousValue + this.pos.getRangeTo(currentValue);
    }, 0);
    droppedResources.map((i) => {
        let weight = (i.amount / totalAmount) * 0.7 + (this.pos.getRangeTo(i) / totatlDistance) * 0.3;
        return { 'resourceId': i.id, 'weight': weight };
    });

    let random = Math.random();
    let sum = 0;
    return Game.getObjectById(droppedResources.find((i) => { return random < (sum += i.weight) }).resourceId);
}

/**
 * 按数量和距离综合权重随机选择一个SourceContainer
 *
 * @param {number} limit 当资源数量大于limit时才会被选到
 * @returns {StructureContainer | null} 随机返回一个SourceContainer或者null
 */
Creep.prototype.chooseSourceContainer = function (limit = 0) {
    let sourceContainers = _.filter(this.room.sourceContainer, (i) => {
        return i.store[RESOURCE_ENERGY] > limit;
    });

    if (!sourceContainers.length) { return null; }
    if (sourceContainers.length == 1) { return sourceContainers[0]; }
    if (this.store[RESOURCE_ENERGY]) { return creep.pos.findClosestByRange(sourceContainers); }

    let totalAmount = sourceContainers.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.store[RESOURCE_ENERGY];
    }, 0);
    let totatlDistance = sourceContainers.reduce((previousValue, currentValue) => {
        return previousValue + this.pos.getRangeTo(currentValue);
    }, 0);
    sourceContainers.map((i) => {
        let weight = (i.store[RESOURCE_ENERGY] / totalAmount) * 0.7 + (this.pos.getRangeTo(i) / totatlDistance) * 0.3;
        return { 'containerId': i.id, 'weight': weight };
    });

    let random = Math.random();
    let sum = 0;
    return Game.getObjectById(sourceContainers.find((i) => { return random < (sum += i.weight) }).containerId);
}
