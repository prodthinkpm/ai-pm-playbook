# Loop Engineering：AI Agent 时代，从写 Prompt 到设计工作循环

> **本文发布于 2026-06**：当 AI Agent 不再只是回答问题，而是开始持续执行任务、调用工具、审查结果并自我修正时，产品经理需要关注的不只是 Prompt、Context 或 Harness，而是一个更产品化的问题：如何设计 Agent 的工作循环。本文面向 AI PM，系统解释 Loop Engineering 的定义、核心组件、产品设计方法、风险边界、评估指标与落地模板。

---

## 执行摘要

过去几年，AI 产品方法论经历了几次明显演进：

```text
Prompt Engineering → Context Engineering → Harness Engineering → Loop Engineering
```

如果说：

- **Prompt Engineering** 关注"怎么问模型"；
- **Context Engineering** 关注"给模型什么信息"；
- **Harness Engineering** 关注"给 Agent 什么运行环境"；
- 那么 **Loop Engineering** 关注的是：**如何让 Agent 在一个可控循环中持续推进任务、检查结果、吸收反馈，并在正确的时候停止。**

一句话定义：

> **Loop Engineering 是为 AI Agent 设计可重复、可验证、可中止的工作循环。**

它不等于"让 Agent 一直自动跑"。真正成熟的 Loop Engineering 不是追求无人值守，而是设计清楚：

```text
什么时候启动？
本轮目标是什么？
需要加载哪些上下文？
可以调用哪些工具？
谁来验证结果？
失败后如何反馈？
什么时候继续？
什么时候停止？
什么时候必须交给人？
```

对于 AI PM 而言，Loop Engineering 的意义是：**把产品经理擅长的流程设计、验收标准、反馈闭环、风险控制和资源约束，转化为 Agent 可以执行的工作系统。**

---

## 一、为什么现在开始讲 Loop Engineering

早期使用大模型，产品团队主要关注单次输出：

```text
写一段文案
生成一份 PRD
总结一份文档
回答一个问题
```

这时 Prompt Engineering 很重要。

后来，大家发现单次 Prompt 不够，模型需要更多背景信息：

```text
历史对话
知识库
用户画像
项目文档
代码库
工具返回结果
```

于是 Context Engineering 和 RAG 成为重点。

再后来，AI Agent 开始调用工具、执行代码、读写文件、提交 PR、调用 API。团队发现，模型本身不是全部问题，Agent 还需要：

```text
工具
权限
沙箱
记忆
上下文压缩
任务编排
验证过滤
审计日志
自我修正
```

这就是 Harness Engineering 的关注范围。

但当 Agent 从"一次任务"变成"持续任务"，新的问题出现了：

```text
Agent 要不要继续下一步？
失败后要不要重试？
重试几次？
谁来 review？
review 后如何修正？
成本超了怎么办？
方向错了什么时候停？
多个 Agent 之间如何接力？
```

这些问题不只是 Harness 的组件问题，而是 **Loop 的产品设计问题**。

因此，Loop Engineering 可以理解为 Harness Engineering 之后更贴近产品运行的一层：

```text
Harness Engineering = 让 Agent 有能力工作
Loop Engineering = 让 Agent 按正确节奏持续工作
```

---

## 二、Prompt、Workflow、Harness、Loop 的区别

| 概念 | 核心问题 | 典型产物 | PM 关注点 |
|------|----------|----------|-----------|
| Prompt Engineering | 怎么让模型这次答得更好 | Prompt 模板、示例、输出格式 | 单次输出质量 |
| Context Engineering | 给模型什么信息 | RAG、上下文窗口、记忆、文档片段 | 信息质量和上下文相关性 |
| Workflow Engineering | 任务流程怎么拆 | 流程图、DAG、自动化步骤 | 业务流程自动化 |
| Harness Engineering | Agent 在什么环境中做事 | 工具、权限、沙箱、验证、可观测性 | Agent 运行环境 |
| **Loop Engineering** | Agent 如何持续推进、检查、修正和停止 | Trigger、Goal、Action、Review、Feedback、Stop Condition | 持续执行闭环 |

Loop 和 Workflow 的区别尤其重要。

Workflow 更像：

```text
A → B → C → D
```

Loop 更像：

```text
目标 → 执行 → 检查 → 反馈 → 修正 → 再执行 → 停止
```

Workflow 偏确定流程。Loop 偏不确定任务。

因此，Loop 更适合 AI Agent，因为 Agent 处理的大多数任务都不是一次性线性流程，而是需要不断探索、验证和修正。

---

## 三、什么是一个 Agent Loop

一个最小 Agent Loop 可以写成：

```text
Trigger → Goal → Context → Action → Verification → Feedback → Stop
```

也可以写成产品公式：

```text
Loop = Trigger + Goal + Context + Action + Verification + Feedback + Stop Condition
```

### 3.1 Trigger：循环如何启动

Trigger 决定 Agent 什么时候开始工作。

| 类型 | 示例 | 适用场景 |
|------|------|----------|
| 手动触发 | 用户点击"开始分析" | 高风险任务、用户主动任务 |
| 定时触发 | 每天 9 点检查竞品更新 | 监控、日报、周期复盘 |
| 事件触发 | 新 Issue、新用户反馈、新日志异常 | 工程、客服、运营 |
| 阈值触发 | 负面反馈率超过 5% | 风险预警、指标监控 |
| 上游 Agent 触发 | Review Agent 要求修复 | 多 Agent 协作 |

PM 要定义的不是"能不能自动触发"，而是：

```text
什么事情值得触发？
触发频率是多少？
重复触发如何去重？
触发后是否需要用户确认？
```

### 3.2 Goal：本轮循环的目标是什么

没有清晰目标的 Loop 很容易变成"Agent 自嗨"。

坏目标：

```text
优化这个项目
改进用户体验
帮我看看有没有问题
```

好目标：

```text
检查 docs/guide/07-prompts 下的新文章是否已加入 sidebar、guide index 和 README。
如果缺失，请补齐导航入口；不要修改无关文件。
```

一个好的 Loop Goal 应该包含：

| 要素 | 示例 |
|------|------|
| 任务对象 | 某个 PRD、某个页面、某个代码目录 |
| 成功标准 | 构建通过、测试通过、指标达标 |
| 约束范围 | 不改无关文件、不改接口、不改数据库 |
| 输出格式 | PR、报告、表格、Checklist |
| 风险边界 | 高风险动作需人工确认 |

### 3.3 Context：每轮循环应该加载什么信息

Agent 每一轮执行都需要上下文，但上下文不是越多越好。

Loop 中的上下文通常包括：

```text
项目目标
当前任务
历史决策
相关文件
工具说明
代码结构
产品规范
用户反馈
失败记录
验收标准
```

PM 要关注两个问题：

1. **上下文是否足够？**
2. **上下文是否太多、太旧、太乱？**

推荐做法：

```text
核心规则常驻
任务相关文档按需加载
历史失败样例摘要化
大文件只传摘要和路径
工具结果不直接当作系统指令
```

如果上下文管理不好，Loop 会出现"越跑越糊"的问题：前几轮还正常，后几轮开始忘记目标、重复操作、误解旧信息。

### 3.4 Action：Agent 可以做什么

Loop 中的 Action 不只是"生成文本"，还可能包括：

| 动作类型 | 示例 | 风险 |
|----------|------|------|
| 读取 | 读文档、读代码、查数据 | 低到中 |
| 生成 | 写文案、写 PRD、生成测试用例 | 中 |
| 修改 | 改文档、改代码、改配置 | 中到高 |
| 调用工具 | 搜索、运行脚本、调用 API | 中到高 |
| 外部发送 | 发邮件、提交 PR、发通知 | 高 |
| 不可逆操作 | 删除数据、生产发布、付款 | 极高 |

PM 必须定义动作边界：

```text
Agent 可以读什么？
可以写什么？
可以调用什么工具？
哪些动作需要审批？
哪些动作默认禁止？
```

### 3.5 Verification：谁来检查结果

Loop Engineering 的核心不是让 Agent 做得更多，而是让每一步都有验证。

验证可以分为五类：

| 验证方式 | 示例 |
|----------|------|
| 规则验证 | Lint、schema、链接检查、格式检查 |
| 测试验证 | 单元测试、集成测试、构建测试 |
| 模型验证 | Review Agent、Judge Prompt、红队 Agent |
| 人工验证 | PM、工程师、法务、运营审核 |
| 数据验证 | 指标是否改善、用户反馈是否变好 |

在产品文档场景里，验证可以是：

```text
新增文章是否放对目录？
sidebar 是否加入？
guide index 是否加入？
README 是否加入？
内部链接是否正确？
标题风格是否一致？
是否包含参考来源？
```

在 Coding Agent 场景里，验证可以是：

```text
测试是否通过？
类型检查是否通过？
是否改了无关文件？
是否符合架构边界？
是否有安全风险？
```

### 3.6 Feedback：失败后如何修正

没有 Feedback 的 Loop 只是重复执行。

一个好的反馈机制应该告诉 Agent：

```text
哪里失败？
为什么失败？
下轮应该改什么？
哪些方向不要再试？
是否需要升级人工？
```

反馈可以来自：

- 测试失败日志；
- Review Agent 评论；
- 用户反馈；
- PM 修改意见；
- 线上指标；
- 安全扫描；
- 成本告警。

PM 要避免模糊反馈：

```text
写得不够好
再优化一下
感觉不对
```

更好的反馈是：

```text
PRD 的验收标准不可测试。请把"体验流畅"改成 Given / When / Then 格式，并补充失败状态。
```

### 3.7 Stop Condition：什么时候停止

Stop Condition 是 Loop Engineering 最容易被忽略，但最重要的部分。

如果没有停止条件，Agent 可能会：

```text
无限重试
重复修改
越改越偏
消耗大量 token
为了通过测试而破坏原始需求
```

常见停止条件：

| 类型 | 示例 |
|------|------|
| 成功停止 | 所有测试通过，PR 创建完成 |
| 失败停止 | 连续失败 3 次 |
| 时间停止 | 运行超过 30 分钟 |
| 成本停止 | 消耗超过 50 credits |
| 风险停止 | 需要删除数据、修改生产配置 |
| 不确定停止 | 置信度低于阈值 |
| 人工停止 | 等待 PM 或工程师确认 |

PM 应该明确写出：

```text
最多执行几轮？
每轮最多花多少钱？
失败几次后停止？
哪些动作必须等待人类？
什么时候输出报告而不是继续执行？
```

---

## 四、Loop Engineering 的七层设计框架

可以把 Loop Engineering 拆成七层：

```text
目标层 → 触发层 → 上下文层 → 工具层 → 验证层 → 反馈层 → 治理层
```

| 层级 | 设计问题 | PM 产出物 |
|------|----------|-----------|
| 目标层 | 本循环解决什么问题？ | Loop Goal、成功标准 |
| 触发层 | 什么时候启动？ | Trigger 规则 |
| 上下文层 | 每轮需要什么信息？ | Context Policy |
| 工具层 | Agent 能做什么？ | Tool Permission Matrix |
| 验证层 | 如何判断做得对？ | Eval Checklist |
| 反馈层 | 错了如何修正？ | Feedback Rules |
| 治理层 | 成本、安全、权限如何控制？ | Budget、Approval、Audit |

这七层里，最有 PM 价值的是：

```text
目标层
验证层
反馈层
治理层
```

因为这些决定了 Agent 不是"能做事"，而是"做正确的事"。

---

## 五、产品经理如何设计 Loop

AI PM 可以把 Loop 设计成一个 Canvas。

### Loop Design Canvas

| 模块 | 关键问题 | 示例 |
|------|----------|------|
| Loop 名称 | 这个循环叫什么？ | PRD Review Loop |
| 用户 / 负责人 | 谁使用？谁负责？ | PM、Tech Lead |
| 触发条件 | 什么时候启动？ | PRD v0.1 完成后 |
| 目标 | 本轮要完成什么？ | 检查需求完整性和可测试性 |
| 输入 | 需要哪些材料？ | PRD、用户故事、业务目标 |
| 上下文 | 需要加载哪些规则？ | PRD 模板、验收标准规范 |
| 工具 | 可以调用哪些工具？ | 文档编辑、评论、链接检查 |
| 执行动作 | Agent 做什么？ | 找缺失项、提出修改建议 |
| 验证方式 | 怎么判断结果有效？ | Checklist 全部通过 |
| 反馈机制 | 失败后怎么办？ | 生成修改清单，等待 PM 确认 |
| 停止条件 | 何时结束？ | P0 缺陷清零或人工终止 |
| 成本上限 | 最多执行多少轮？ | 最多 3 轮 |
| 风险边界 | 哪些不能自动做？ | 不改核心需求，不删内容 |

### 推荐模板

```markdown
# Loop Design Canvas

## 1. Loop Name

## 2. Owner

## 3. Trigger

## 4. Goal

## 5. Inputs

## 6. Context Policy

## 7. Tools and Permissions

## 8. Action Steps

## 9. Verification

## 10. Feedback Rules

## 11. Stop Conditions

## 12. Budget

## 13. Risks and Human Approval
```

---

## 六、典型场景一：Coding Agent Loop

Coding Agent 是 Loop Engineering 最典型的应用场景。

一个成熟的 Coding Agent Loop 可能是：

```text
Issue / 需求 → 读取代码 → 制定计划 → 修改代码
→ 运行测试 → 自我 Review → 修复问题
→ 独立 Review Agent 检查 → 创建 PR → 人类 Review
```

### 示例：代码修复 Loop

```text
Trigger:
- GitHub Issue 被标记为 agent-ready

Goal:
- 修复 Issue 中描述的 bug，不改变无关功能

Context:
- Issue 描述
- 相关代码文件
- 测试目录
- AGENTS.md
- 架构约束

Actions:
- 定位问题
- 修改最小必要代码
- 新增或更新测试
- 运行测试

Verification:
- 单元测试通过
- 类型检查通过
- 没有修改无关文件
- Review Agent 通过

Feedback:
- 测试失败则读取错误并重试
- 连续失败 3 次则停止并输出诊断报告

Stop:
- PR 创建完成
- 或连续失败 3 次
- 或需要高风险修改
```

### PM 要关注什么

PM 不需要写代码，但要定义：

```text
什么叫修好了？
哪些行为不能做？
是否可以改接口？
是否可以改数据库？
是否需要兼容老用户？
失败后是否继续？
```

如果 PM 不定义这些，Agent 可能会为了让测试通过而牺牲产品意图。

---

## 七、典型场景二：PRD Review Loop

这是 AI PM 最容易落地的 Loop。

```text
PRD 草稿 → Agent 检查 → 输出缺失项 → PM 修改
→ Agent 二次检查 → 形成评审版 → 进入需求评审
```

### PRD Review Loop 规则

```text
Trigger:
- PRD v0.1 完成

Goal:
- 检查 PRD 是否达到评审标准

Context:
- PRD 模板
- 产品目标
- 用户画像
- 业务约束
- AI 功能评估规范

Verification:
- 是否有目标用户
- 是否有核心场景
- 是否有用户故事
- 是否有主流程和异常流程
- 是否有可测试验收标准
- 是否有埋点
- 是否有权限规则
- 是否有 AI 评估和兜底
- 是否有上线风险

Stop:
- P0 缺失项清零
- 或 PM 选择进入评审
```

### Agent 输出示例

| 问题 | 严重程度 | 说明 | 建议 |
|------|----------|------|------|
| 缺少失败兜底 | P0 | AI 生成失败时未定义用户看到什么 | 补充超时、无结果、低置信度状态 |
| 验收标准不可测试 | P0 | "体验流畅"无法验收 | 改成 Given / When / Then |
| 成本指标缺失 | P1 | 未定义单次任务成本 | 增加 cost per task 和月度预算 |

---

## 八、典型场景三：用户反馈归因 Loop

AI 产品上线后，用户反馈很分散：

```text
点赞 / 点踩
客服工单
社群吐槽
NPS
用户访谈
埋点数据
```

可以设计一个 Feedback Loop：

```text
收集反馈 → 聚类 → 归因 → 匹配功能 / 模型 / Prompt / 数据问题
→ 生成迭代建议 → 加入评估集 → 复盘
```

### 用户反馈 Loop

```text
Trigger:
- 每天早上 9 点
- 或负面反馈超过阈值

Goal:
- 找出过去 24 小时 AI 功能的主要失败模式

Input:
- 点踩记录
- 用户原始问题
- AI 输出
- 工具调用 trace
- 客服工单

Action:
- 聚类问题
- 判断失败类型
- 标记是否进入评估集
- 生成修复建议

Verification:
- 每类问题有代表样例
- 每条建议有负责人
- 高风险问题单独标记

Stop:
- 输出日报
- 高风险问题升级人工
```

### 失败类型

| 类型 | 说明 |
|------|------|
| 需求理解错误 | 模型没理解用户目标 |
| 检索失败 | RAG 没找到正确资料 |
| 引用错误 | 引用不支持答案 |
| 工具失败 | API、搜索、数据库调用失败 |
| 格式失败 | 输出不符合 schema |
| 安全问题 | 不该回答却回答了 |
| 体验问题 | 太长、太慢、太复杂 |

---

## 九、典型场景四：文档发布 Loop

对于 AI PM Playbook 这类文档仓库，非常适合设计文档发布 Loop。

```text
新文章 → 分类 → 创建文件 → 更新 sidebar
→ 更新 guide index → 更新 README / homepage
→ 检查链接 → 创建 PR
```

### 文档发布 Loop

```text
Trigger:
- 用户提供一篇新文章
- 或要求新增一个主题

Goal:
- 把文章发布为可导航、可检索、可 review 的站点文档

Context:
- 仓库目录结构
- VitePress sidebar 配置
- README 入口规则
- 总索引格式
- 现有同类文章风格

Action:
- 判断文章所属模块
- 创建 Markdown 文件
- 更新 docs/.vitepress/config.ts
- 更新 docs/guide/index.md
- 必要时更新 README.md
- 必要时更新 docs/index.md
- 创建 PR

Verification:
- 新文章路径正确
- sidebar 有入口
- guide index 有入口
- README 链接有效
- 没有改动无关文件

Stop:
- PR 创建完成
- 或发现分类不确定，需要用户确认
```

这类 Loop 的价值非常明显：它把"发布文章"从一次性人工操作，变成可重复执行的工作系统。

---

## 十、Loop Engineering 的风险

Loop Engineering 越强，风险也越大。

### 10.1 无限循环

Agent 不断尝试修复问题，但每次都失败。

缓解方式：

```text
最大轮数
最大运行时间
最大成本
失败原因去重
连续失败后停止
```

### 10.2 错误放大

Agent 第一轮理解错目标，后面每一轮都沿着错误方向优化。

缓解方式：

```text
目标复述
关键节点人工确认
每轮输出 diff
高风险变更审批
```

### 10.3 成本失控

多个 Agent 互相 review、重试、修复，会消耗大量 token 和工具成本。

缓解方式：

```text
run budget
step budget
tool call limit
低成本模型路由
采样 review
成本告警
```

### 10.4 越权执行

Agent 为了完成任务调用了不该调用的工具，或修改了不该修改的文件。

缓解方式：

```text
工具白名单
目录权限
只读 / 写入 / 高风险动作分级
人工审批
审计日志
```

### 10.5 形式上通过，实质上失败

Agent 可能为了让测试通过而绕开真实问题。

例如：

```text
删除测试
修改断言
伪造数据
绕开校验
```

缓解方式：

```text
测试变更 review
关键测试只允许人工修改
Review Agent 检查意图一致性
人类最终验收
```

### 10.6 多 Agent 互相强化错误

一个 Agent 提出错误建议，另一个 Agent 基于错误建议继续优化，形成"错误共识"。

缓解方式：

```text
独立上下文 review
反方 Agent
随机抽样人工 review
高风险场景要求证据来源
```

---

## 十一、Loop 的评估指标

Loop Engineering 需要新的指标，不只是看最终答案。

### 11.1 结果指标

| 指标 | 说明 |
|------|------|
| Task Success Rate | 任务最终完成率 |
| First Loop Success | 第一轮成功率 |
| Human Acceptance Rate | 人类接受结果比例 |
| Rework Rate | 人类返工比例 |
| Regression Rate | 修复后引入新问题比例 |

### 11.2 过程指标

| 指标 | 说明 |
|------|------|
| Average Steps per Run | 平均每次循环步骤数 |
| Retry Count | 平均重试次数 |
| Verification Coverage | 验证覆盖率 |
| Recovery Efficiency | 失败后恢复效率 |
| Abstention Quality | 是否知道何时放弃 |
| Tool Misuse Rate | 工具误用率 |
| Context Drift Rate | 上下文偏移率 |

### 11.3 成本指标

| 指标 | 说明 |
|------|------|
| Cost per Successful Run | 每次成功循环成本 |
| Token per Step | 每步 token 消耗 |
| Review Cost Ratio | review 成本占比 |
| Wasted Retry Cost | 无效重试成本 |
| P95 Run Cost | 高成本尾部任务 |

### 11.4 安全指标

| 指标 | 说明 |
|------|------|
| Approval Hit Rate | 高风险动作进入审批比例 |
| Unauthorized Action Attempts | 越权尝试次数 |
| Audit Completeness | trace 完整率 |
| Stop Condition Hit Rate | 停止条件触发率 |
| Incident Rate | 安全事故率 |

---

## 十二、Loop Engineering 对 AI PM 的意义

### 12.1 PM 从"写需求"变成"设计循环"

传统 PM 主要写：

```text
需求
流程
页面
验收标准
```

AI Agent 时代，PM 还要写：

```text
触发条件
循环目标
工具权限
验证机制
反馈规则
停止条件
成本边界
人工审批点
```

这意味着 PM 的工作从"描述产品功能"升级为"设计 AI 协作系统"。

### 12.2 PM 需要定义什么是"可接受的自动化"

不是所有事情都应该自动完成。

PM 要判断：

| 问题 | 示例 |
|------|------|
| 哪些任务可以自动跑？ | 文档索引更新、测试用例生成 |
| 哪些任务需要人确认？ | 改 PRD 范围、提交 PR |
| 哪些任务不能自动做？ | 删除生产数据、发送客户邮件 |
| 哪些结果必须可回滚？ | 配置变更、内容发布 |
| 哪些过程必须可审计？ | 合规、财务、客户数据访问 |

### 12.3 PM 的护城河变成"循环设计能力"

未来，普通使用者会说：

```text
帮我写个 PRD。
```

成熟 AI PM 会说：

```text
建立一个 PRD Review Loop：
当 PRD 草稿完成时，自动检查目标用户、用户故事、主流程、异常流程、验收标准、AI 评估、成本和风险；
生成缺失项清单；
P0 问题清零前不进入评审；
连续两轮无法修复时要求人工确认。
```

这就是差距。

---

## 十三、Loop Engineering 与 Harness Engineering 的关系

两者不是替代关系，而是上下层关系。

```text
Harness Engineering 提供能力
Loop Engineering 组织能力
```

| Harness 组件 | Loop 中的作用 |
|--------------|---------------|
| 工具层 | 支持 Action |
| 记忆层 | 支持 Context 和 Feedback |
| 上下文管理 | 防止 Context Drift |
| 任务编排 | 支持多步骤执行 |
| 验证过滤 | 支持 Verification |
| 自我修正 | 支持 Feedback 和 Recovery |
| 可观测性 | 支持 Audit 和 Evaluation |
| 权限沙箱 | 支持 Governance |

可以这样理解：

```text
没有 Harness，Loop 没有执行能力。
没有 Loop，Harness 只是一堆能力组件。
```

Harness 解决"Agent 能不能工作"。  
Loop 解决"Agent 如何持续正确工作"。

---

## 十四、Loop Engineering 的落地路径

### 阶段 1：人工 Loop

人类手动推动每一步：

```text
PM 发起 → Agent 输出 → PM 检查 → PM 反馈 → Agent 修改
```

适合早期验证。

### 阶段 2：半自动 Loop

Agent 自动执行低风险步骤，高风险步骤人类确认：

```text
Agent 检查 → Agent 修改草稿 → 人类确认 → Agent 提交
```

适合 PRD、文档、测试用例、代码小修。

### 阶段 3：自动 Loop + 人类抽检

Agent 自动运行，但有预算、权限、trace 和抽检：

```text
定时触发 → 自动分析 → 自动生成报告 → 高风险升级人工
```

适合监控、日报、反馈归因、竞品跟踪。

### 阶段 4：多 Agent Loop

多个 Agent 分工协作：

```text
Planner Agent → Executor Agent → Reviewer Agent → Fixer Agent → Human Approver
```

适合复杂工程任务、内容生产流水线、Agent 平台。

### 阶段 5：组织级 Loop

Loop 成为团队运行机制：

```text
需求 Loop
研发 Loop
测试 Loop
发布 Loop
反馈 Loop
评估 Loop
治理 Loop
```

这时，AI 不再是工具，而是组织流程的一部分。

---

## 十五、产品经理的 Loop 设计 Checklist

```text
[ ] 这个 Loop 解决的问题明确吗？
[ ] Trigger 是否清晰？
[ ] Goal 是否可验证？
[ ] 输入和上下文是否定义清楚？
[ ] Agent 可以调用哪些工具？
[ ] 工具权限是否分级？
[ ] 每轮结果如何验证？
[ ] 失败后如何反馈和修正？
[ ] 最多执行几轮？
[ ] 成本上限是多少？
[ ] 哪些动作必须人工确认？
[ ] 是否有 trace 和审计？
[ ] 是否可以回滚？
[ ] 是否知道什么时候停止？
[ ] 是否定义了成功指标和失败指标？
```

---

## 十六、Loop Design Prompt 模板

产品经理可以直接用下面的 Prompt 设计一个 Loop。

```text
你是一位 AI 产品架构师和 Agent Workflow Designer。

我想为以下场景设计一个 Agent Loop：

场景：
[填写场景]

目标用户：
[填写用户]

业务目标：
[填写目标]

约束条件：
[时间 / 成本 / 权限 / 工具 / 风险]

请帮我设计 Loop Engineering 方案，包含：

1. Loop 名称
2. Trigger 触发条件
3. Goal 本轮目标
4. 输入材料
5. 上下文加载策略
6. Agent 可用工具
7. 工具权限分级
8. 执行动作序列
9. 验证机制
10. 反馈和重试规则
11. 停止条件
12. 成本预算
13. 人工审批点
14. 风险清单
15. 评估指标
16. 最小可行版本
17. 后续升级路径

要求：
- 用表格输出
- 不要假设完全自动化
- 高风险动作必须有人类确认
- 明确说明哪些事情不应该交给 Agent 做
```

---

## 十七、一个完整样例：AI PM Playbook 文档发布 Loop

```markdown
# Loop Name

AI PM Playbook Documentation Release Loop

## Trigger

用户提供一篇新文章，或要求新增一个研究主题。

## Goal

将文章发布为 AI PM Playbook 中可导航、可检索、可维护的正式文档。

## Inputs

- 文章正文
- 文章标题
- 推荐分类
- 目标读者
- 是否需要首页推荐
- 是否需要 README 入口

## Context Policy

Agent 应读取：

- docs/.vitepress/config.ts
- docs/guide/index.md
- docs/index.md
- README.md
- 同目录下相似文章

## Tools and Permissions

| 工具 | 权限 |
|------|------|
| 读取仓库文件 | 允许 |
| 新建 Markdown 文件 | 允许 |
| 更新 sidebar | 允许 |
| 更新 index | 允许 |
| 更新 README | 需判断是否重要 |
| 删除文件 | 禁止 |
| 修改无关文档 | 禁止 |
| 创建 PR | 允许 |
| 直接 merge | 需人工确认 |

## Action Steps

1. 判断文章所属目录。
2. 生成文件名。
3. 新增 Markdown 文件。
4. 更新 VitePress sidebar。
5. 更新 docs/guide/index.md。
6. 必要时更新 README.md。
7. 必要时更新 docs/index.md。
8. 检查内部链接。
9. 创建 PR。

## Verification

- 新文章路径正确；
- sidebar 有入口；
- guide index 有入口；
- README 链接使用 `.md`；
- VitePress link 不带 `.md`；
- PR diff 只包含相关文件；
- 没有删除旧内容；
- 没有无来源的最新事实。

## Feedback Rules

- 如果分类不确定，先给出建议并请求人工确认；
- 如果链接不确定，标记为待确认；
- 如果涉及最新价格、法规、模型能力，必须查官方来源；
- 如果构建无法运行，在 PR 说明中标注。

## Stop Conditions

- PR 创建完成；
- 或发现文章内容缺失严重；
- 或需要用户决定分类；
- 或发生权限 / 构建 / merge 冲突。

## Budget

- 单次任务最多 5 个文件变更；
- 超出范围需要说明原因；
- 不做大规模重构。

## Human Approval

以下动作必须人工确认：

- 删除文章；
- 修改目录结构；
- 首页强推荐；
- 合并 PR；
- 改仓库发布流程。
```

---

## 十八、未来趋势：从 Agent Loop 到 Organization Loop

Loop Engineering 不会只停留在 coding agent。

未来 AI 产品和组织会出现更多 Loop：

```text
Product Discovery Loop
User Research Loop
PRD Review Loop
Design QA Loop
Code Review Loop
Release Loop
Customer Feedback Loop
Compliance Review Loop
Model Evaluation Loop
Cost Optimization Loop
```

这些 Loop 会共同组成一个 AI-native 产品组织。

那时，产品经理的关键能力不是"会不会使用某个 AI 工具"，而是：

```text
能不能把复杂工作拆成可触发、可执行、可验证、可反馈、可停止的循环系统。
```

这就是 Loop Engineering 对 AI PM 的长期价值。

---

## 结语

Prompt Engineering 让我们学会了如何和模型对话。  
Context Engineering 让我们学会了如何给模型信息。  
Harness Engineering 让我们学会了如何给 Agent 运行环境。  
Loop Engineering 则要求我们进一步思考：

```text
Agent 如何持续推进任务？
如何检查自己？
如何吸收反馈？
如何避免越跑越偏？
如何知道什么时候停？
```

对 AI PM 来说，Loop Engineering 不是一个工程热词，而是一种新的产品设计语言。

它把 PM 熟悉的目标、流程、验收、反馈、成本、风险和责任边界，转化成 Agent 可以持续执行的系统。

一句话总结：

> **未来优秀的 AI PM，不只是会写 Prompt，而是会设计 Loop。**

---

## 参考来源

- Business Insider：Forget prompt engineering: 'Loop engineering' is all the rage now  
  https://www.businessinsider.com/what-are-loops-ai-engineering-tips-2026-6

- RigorBench: Benchmarking Engineering Process Discipline in Autonomous AI Coding Agents  
  https://arxiv.org/abs/2606.22678

- Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems  
  https://arxiv.org/abs/2604.14228

- CODE-GEN: A Human-in-the-Loop RAG-Based Agentic AI System for Multiple-Choice Question Generation  
  https://arxiv.org/abs/2604.03926

- AI PM Playbook：Harness Engineering：AI Agent 时代的新工程范式  
  https://prodthinkpm.github.io/ai-pm-playbook/guide/research/harness-engineering-introduction.html

- Anthropic：Building effective agents  
  https://www.anthropic.com/engineering/building-effective-agents

- Model Context Protocol  
  https://modelcontextprotocol.io/

- OWASP Top 10 for LLM Applications  
  https://genai.owasp.org/
