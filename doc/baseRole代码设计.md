# baseRole代码设计：

代码设计细节可参考`template.js`模板文件，以下为大致说明：

1. 生产中的creep不执行代码

2. creep快死的时候趁着身上没资源赶紧死，否则浪费资源

3. 手动控制代码执行

4. 工作状态切换，由creep身上是否携带资源以及携带资源多少决定

5. 工作逻辑代码执行

6. 采取target导向的工作模式，即只有当存在target时，creep才会执行工作逻辑代码

7. target和source的获取逻辑：

    1. 获取target或source缓存

    2. 验证target或source缓存

    3. 当缓存失效时重新获取target或source

    4. 验证target或source

    5. 添加target或source缓存

    6. target或source交互
