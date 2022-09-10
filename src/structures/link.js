export const linkWork = {
    work: function (room) {
        if (room.sourceLink.length && room.centerLink.length) {
            let sourceLinks = room.sourceLink;
            let centerLinks = room.centerLink;

            if (!centerLinks[0].cooldown && centerLinks[0].store[RESOURCE_ENERGY] == 0) {
                sourceLinks.forEach((link) => {
                    if (!link.cooldown && link.store[RESOURCE_ENERGY] == 800) {
                        link.transferEnergy(centerLinks[0]);
                    }
                });
            }
        }
    }
}