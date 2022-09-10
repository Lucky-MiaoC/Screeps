export const observerWork = {
    work: function (room) {
        let observer = room.observer;
        let target = room.memory.roomNameNeedObserver;
        if (observer && target) {
            observer.observeRoom(target);
        }
    }
}

