/**
 * 注意：Link的工作与子类设计息息相关，你可能需要修改Link的子类设计或相关逻辑
 * 本人目前只使用到了Source旁边的sourceLink（多个）和中央集群的centerLink（单个）
 * 本人在index.js中只设计了sourceLink、centerLink、upgradeLink三种子类（都返回数组）
 * 如果需要其他种类的Link（例如房间入口专供外矿creep使用的link），你可能需要修改index.js的建筑索引
 */
export const linkWork = {
    work: function (room) {
        // 必须同时存在sourceLink和centerLink
        if (room.sourceLink.length && room.centerLink.length) {
            let sourceLinks = room.sourceLink;
            let centerLinks = room.centerLink;

            // 本人目前基地布局设计centerLink只有一个，直接centerLinks[0]即可获得
            if (centerLinks[0].store[RESOURCE_ENERGY] == 0) {
                for (let link of sourceLinks) {
                    if (!link.cooldown && link.store[RESOURCE_ENERGY] == 800) {
                        link.transferEnergy(centerLinks[0]);
                        break;
                    }
                }
            }
        }
    }
};
