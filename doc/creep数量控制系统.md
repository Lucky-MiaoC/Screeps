# creep数量控制系统：

**本项目reep数量控制采用集中式检查方法：**

1. Memory中初始化creepRole数量信息

2. 每个tick更新creep内存（清理死亡creep内存）

    1. 如果死亡creep为harvester则解除对矿的预定

    2. 更新Memory的creepRole数量（数量--）

    3. 清理死亡creep内存

3. 每个tick更新生产任务

    1. 获取空闲spawn

    2. 收集当前tick需要生产的creepRole：先判断数量是否不足（设定数量多余Memory中creep数量），再判断该角色是否达到生产条件

    3. 分发生产任务到Spawn

    4. 成功生产的话在Memory中更新对应creepRole数量，即Memory中creepRole数量和当前实际存在的creepRole数量对应

**本项目reep数量控制的优点：**

1. 实时更新，配置的变动马上反映到实际生产

2. 实时监控，Memory中creepRole数量和当前实际存在的creepRole数量对应

**本项目reep数量控制的缺点：**

1. cpu消耗略大，因为每个tick需要检查角色数量是否不足、是否达到生产条件，例如builder的生产条件需要扫描房间建筑或工地
   但是为了实时性我认为这点cpu是值得的，且经过建筑缓存之后cpu有所减少，确定长时间不生产的如8级房的builder可以手动设置数量为0减少cpu消耗

2. 需要提前设置配置项、更新配置项需要重新打包上传
