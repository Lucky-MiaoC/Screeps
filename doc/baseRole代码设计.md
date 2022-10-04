# baseRole代码设计：

代码设计细节可参考`template.js`模板文件，以下为大致逻辑：

1. 生产中的creep不执行代码，直接返回

2. creep快死的时候趁着身上没资源赶紧死（自杀），否则浪费资源

3. 手动控制代码执行（用于实现“征召”效果）

4. 工作状态切换，通常由creep身上是否携带资源以及携带资源多少决定，不同种类creep实现细节存在差异

5. 工作逻辑代码执行，不同种类creep完全不同，是creep工作的核心流程

6. 工作逻辑采取target导向的工作模式，即只有当存在target时，creep才会执行工作逻辑代码，即先获取target，再获取source的思路

7. target和source的获取逻辑：

    1. 获取target或source缓存

    2. 验证target或source缓存

    3. 当缓存失效时重新获取target或source

    4. 验证target或source是否存在

    5. 如果存在则添加target或source到缓存

    6. target或source与creep交互（包括creep移动）
