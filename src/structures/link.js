export const linkWork = {
    work: function (room) {
        if (room.sourceLink.length && room.centerLink.length) {
            let sourceLinks = room.sourceLink;
            let centerLinks = room.centerLink;

            // 默认centerLink只有一个（目前我的布局只有一个），如果布局中certerLink有多个则需要重写下面方法
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
}
