import { dialogue } from "./dialogue";
import { configs } from "../configs";

/**
 * 判断某一角色类型是否达到生产条件
 *
 * @param {string} creepRole 角色类型
 * @returns {boolean} 返回true或者false
 */
Room.prototype.judgeIfCreepNeedSpawn = function (creepRole) {
    switch (creepRole) {
        // harvester一直都需要生产
        case "harvester": { return true; }
        // filler只有在有storage或者terminal或者sourceContainer时才需要生产
        case "filler": { return (this.storage || this.terminal || this.sourceContainer.length) ? true : false; }
        // collecter只有在同时有[storage或者terminal]和[sourceContainer或者mineralContainer]
        // 同时storage或者terminal有空余，mineralContainer快满了时才需要生产
        case "collecter": {
            let freeCapacity = (this.storage ? this.storage.store.getFreeCapacity() : 0) +
                (this.terminal ? this.terminal.store.getFreeCapacity() : 0);
            return (freeCapacity > 200000 && (this.sourceContainer.length ||
                (this.mineralContainer.length && this.mineralContainer[0].store.getFreeCapacity() < 200))) ? true : false;
        }
        // centercarrier只有在有[storage或者terminal]和[centerLink]和[集群中心时]才需要生产
        case "centercarrier": { return ((this.storage || this.terminal) && this.centerLink.length && configs.centerPoint[this.name]) ? true : false; }
        // upgrader一直都需要生产
        case "upgrader": { return true; }
        // builder只有在需要builder工作时才需要生产
        case "builder": { return this.memory.ifNeedBuilderWork; }
        // miner只有在有[Extractor和mineralContainer]同时[storage或者terminal]有空余且[矿余量不为0]时才会生产
        case "miner": {
            let freeCapacity = (this.storage ? this.storage.store.getFreeCapacity() : 0) +
                (this.terminal ? this.terminal.store.getFreeCapacity() : 0);
            return (this.extractor && this.mineralContainer.length && freeCapacity > 200000 &&
                this.mineral.mineralAmount > 0) ? true : false;
        }
        // 其他角色一律放行
        default: { return true; }
    }
}

/**
 * 为每个creep概率设定要说的话，由于双人对话涉及不同的creep，因此采取全局函数而不是creep原型拓展的设计
 * 注意：为了在当前tick说当前tick获取的dialogue，getDialogue要比showDialogue先调用
 * 注意：概率为每个tick每个creep的概率，双人对话涉及两个creep概率升高（一个成功另一个也成功），且概率非严格概率（需要乘上上一条件失败概率）
 */
global.getDialogue = function () {
    for (let creep of Object.values(Game.creeps)) {
        // 如果memory里没有要说的dialogue
        if (!(creep.memory.dialogue && creep.memory.dialogue.length)) {
            // 如果受伤则10%概率获取受伤的dialogue
            if (creep.hits < creep.hitsMax && Math.random() < 0.1) {
                let text = _.sample(dialogue['dialogue1']['anyRloe']['hurt']);
                let sayTime = Game.time;
                let _dialogue = { 'sayTime': sayTime + 1, 'text': text };
                creep.memory.dialogue ? creep.memory.dialogue.push(_dialogue) : (creep.memory.dialogue = [_dialogue]);
                continue;
            }
            // 如果处于自卫战争时期且3格内有敌人则10%概率获取对敌的dialogue
            // 即使没有自卫战争时期这一设定也无所谓不会报错，就是不触发该类型对话而已，设定处于自卫战争时期才扫描可以减少CPU消耗
            if (creep.room.memory.code && creep.room.memory.code.warOfSelfDefence &&
                creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3, {
                    filter: (hostile) => {
                        return !configs.whiteList['global'].concat(configs.whiteList[creep.room.name] || []).includes(hostile.owner.username);
                    }
                }).length && Math.random() >= 0.1) {
                let text = _.sample(dialogue['dialogue1']['anyRloe']['hostile']);
                let sayTime = Game.time;
                let _dialogue = { 'sayTime': sayTime + 1, 'text': text };
                creep.memory.dialogue ?
                    creep.memory.dialogue.push(_dialogue) : (creep.memory.dialogue = [_dialogue]);
                continue;
            }
            // 如果3格内有其他creep则8%概率获取双人的dialogue
            if (Math.random() < 0.08 && creep.ticksToLive > 20) {
                let suitableCreep = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
                    filter: (i) => {
                        return !(i.memory.dialogue && i.memory.dialogue.length) &&
                            !i.pos.isEqualTo(creep.pos) && !i.spawning && i.ticksToLive > 20;
                    }
                });
                if (suitableCreep.length) {
                    let otherCreep = creep.pos.findClosestByRange(suitableCreep);

                    let state = `${creep.memory.state} ${otherCreep.memory.state}`;
                    let _texts = dialogue['dialogue2']['twoRole'][state] ?
                        dialogue['dialogue2']['twoRole'][state].concat(dialogue['dialogue2']['twoRole']['any any']) :
                        dialogue['dialogue2']['twoRole']['any any'];
                    let texts = _.sample(_texts);
                    let sayTime = Game.time;

                    // 奇数语句给creep，偶数语句给otherCreep
                    for (let i = 0; i < texts.length; i++) {
                        if (i % 2 == 0) {
                            let _dialogue = { 'sayTime': sayTime + 1 + i, 'text': texts[i] };
                            creep.memory.dialogue ?
                                creep.memory.dialogue.push(_dialogue) : (creep.memory.dialogue = [_dialogue]);
                        }
                        else {
                            let _dialogue = { 'sayTime': sayTime + 1 + i, 'text': texts[i] };
                            otherCreep.memory.dialogue ?
                                otherCreep.memory.dialogue.push(_dialogue) : (otherCreep.memory.dialogue = [_dialogue]);
                        }
                    }
                    continue;
                }
            }
            // 2%概率获取通用单人的dialogue
            if (Math.random() < 0.02) {
                let _text = dialogue['dialogue1']['anyRloe'][creep.memory.state] ?
                    dialogue['dialogue1']['anyRloe'][creep.memory.state].concat(dialogue['dialogue1']['anyRloe']['any']) :
                    dialogue['dialogue1']['anyRloe']['any'];
                let text = _.sample(_text);
                let sayTime = Game.time;
                let _dialogue = { 'sayTime': sayTime + 1, 'text': text };
                creep.memory.dialogue ?
                    creep.memory.dialogue.push(_dialogue) : (creep.memory.dialogue = [_dialogue]);
                continue;
            }
        }
    }
}

/**
 * 让每个有话说的creep说话，由于双人对话涉及不同的creep，因此采取全局函数而不是creep原型拓展的设计
 * 注意：为了在当前tick说当前tick获取的dialogue，getDialogue要比showDialogue先调用
 */
global.showDialogue = function () {
    for (let creep of Object.values(Game.creeps)) {
        _showDialogue(creep);
    }

    // 为了能让【存在以前tick要说的dialogue】的creep在当前tick重新说下一个dialogue，特地抽取的函数
    function _showDialogue(creep) {
        // 如果memory里有要说的dialogue
        if (creep.memory.dialogue && creep.memory.dialogue.length) {
            let _dialogue = creep.memory.dialogue[0]
            // 如果dialogue是这个tick要说的，则say，然后移除该dialogue
            if (_dialogue.sayTime == Game.time) {
                creep.say(_dialogue.text, true);
                creep.memory.dialogue.shift();
            }
            // 如果dialogue是以前的tick要说的，则移除该dialogue，防止可能的bug，然后自己重新说
            else if (_dialogue.time < Game.time) {
                creep.memory.dialogue.shift();
                _showDialogue(creep);
            }
        }
    }
}
