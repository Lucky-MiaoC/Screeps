/**
 * 选择一个Source
 *
 * @returns {Source | null} 返回Source或者null
 */
Creep.prototype.chooseSource = function () {
    let sources = _.filter(this.room.source, (i) => {
        return i.getFreeSpaceNumber() > this.room.memory.sourceInfo[i.id].length;
    });

    if (!sources.length) { return null; }

    sources.sort((i, j) => {
        return this.pos.getRangeTo(i.pos) - this.pos.getRangeTo(j.pos);
    });

    sources.sort((i, j) => {
        return this.room.memory.sourceInfo[i.id].length - this.room.memory.sourceInfo[j.id].length;
    });
    return sources[0];
};

/**
 * 选择一个SourceContainer
 *
 * @param {number} limit 当SourceContainer资源数量大于limit时才会被选到
 * @returns {StructureContainer | null} 随机返回一个SourceContainer或者null
 */
Creep.prototype.chooseSourceContainer = function (limit = 0) {
    let sourceContainers = _.filter(this.room.sourceContainer, (i) => {
        return i.store[RESOURCE_ENERGY] > limit;
    });

    if (!sourceContainers.length) { return null; }
    if (sourceContainers.length == 1) { return sourceContainers[0]; }
    if (this.store[RESOURCE_ENERGY]) { return this.pos.findClosestByRange(sourceContainers); }

    let totalAmount = sourceContainers.reduce((previousValue, currentValue) => {
        return previousValue + currentValue.store[RESOURCE_ENERGY];
    }, 0);
    let totatlDistance = sourceContainers.reduce((previousValue, currentValue) => {
        return previousValue + this.pos.getRangeTo(currentValue);
    }, 0);
    sourceContainers = sourceContainers.map((i) => {
        let weight = (i.store[RESOURCE_ENERGY] / totalAmount) * 0.7 + (this.pos.getRangeTo(i) / totatlDistance) * 0.3;
        return { 'containerId': i.id, 'weight': weight };
    });

    let random = Math.random();
    let sum = 0;
    return Game.getObjectById(sourceContainers.find((i) => { return random < (sum += i.weight) }).containerId);
};
