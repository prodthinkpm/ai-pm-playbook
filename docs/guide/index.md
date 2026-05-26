# 📋 AI PM Playbook — 总索引

> 所有文档一目了然。按模块、按主题、按场景快速定位。

---

## 🧭 按模块索引

### 📡 研究方向

| 文件 | 核心内容 | 适用场景 |
|------|---------|---------|
| [AI产品经理研究与分析](./research/ai-pm-research-roadmap) | 10 个研究方向地图、3 个 P0 项目计划、工具链与合规清单 | 确定研究优先级、启动研究项目 |
| [大模型与 Harness 的未来轨迹](./research/llm-harness-future-trajectory) | 三层 harness 分类、BigModel vs BigHarness 争论裁决、混合架构方案与行动建议 | 理解 agent 运行时趋势、制定技术战略 |
| [Harness Engineering 入门](./research/harness-engineering-introduction) | Harness 六大核心组件、OpenAI Codex 案例、LangChain 数据验证、最小可行落地三步法 | 全面理解 Harness Engineering 范式、评估 Agent 产品成熟度 |

### 01 — AI 产品框架

| 文件 | 核心内容 | 适用场景 |
|------|---------|---------|
| [AI 产品画布](./01-framework/ai-product-canvas) | 9 大模块产品画布 | 立项前的框架梳理 |
| [Agent 产品画布](./01-framework/agent-product-canvas) | Agent 能力边界、工具定义、记忆设计 | Agent 产品规划 |
| [RAG 产品画布](./01-framework/rag-product-canvas) | 检索策略、分块、上下文窗口 | RAG 系统设计 |
| [HITL 产品画布](./01-framework/human-in-the-loop-canvas) | 决策点、置信度阈值、审核流程 | 人机协作产品 |

### 02 — PRD 模板

| 文件 | 适用产品类型 |
|------|-------------|
| [AI SaaS PRD](./02-prd/ai-saas-prd-template) | AI SaaS 产品 |
| [Agent PRD](./02-prd/agent-prd-template) | AI Agent 产品 |
| [Coding Agent PRD](./02-prd/coding-agent-prd-template) | 代码生成 Agent |
| [RAG PRD](./02-prd/rag-prd-template) | RAG 知识库产品 |
| [数据平台 PRD](./02-prd/data-platform-prd-template) | AI 数据平台 |

### 03 — 案例研究

| 文件 | 产品类型 | 核心专题 |
|------|---------|---------|
| [AppSignal：隐私政策解读](./03-cases/appsignal-case-study) | AI 内容平台 | AI 分析 + 人工审核、风险评分 |
| [OpenFoodData：营养数据平台](./03-cases/openfooddata-case-study) | 数据平台 | 多源数据聚合、评分方法论、搜索范式 |
| [Aurora：Agent 操作系统](./03-cases/aurora-agentos-case-study) | Agent 操作系统 | Agent 编排、记忆架构、可观测性 |
| [Falcon：推理优化](./03-cases/falcon-case-study) | AI 基础设施 | 量化策略、部署方案、成本优化 |
| [自动驾驶数据平台](./03-cases/autonomous-driving-data-platform-case-study) | 数据平台 | 数据采集、AI 标注、仿真、版本管理 |

### 04 — AI 评估体系

| 文件 | 核心指标 |
|------|---------|
| [Agent 评估指标](./04-evaluation/agent-evaluation-metrics) | 任务完成率、回退率、用户干预率 |
| [LLM 输出质量](./04-evaluation/llm-output-quality) | 准确率、幻觉率、格式合规 |
| [工具调用成功率](./04-evaluation/tool-call-success-rate) | 工具选择准确率、执行成功率 |
| [产品成功指标](./04-evaluation/product-success-metrics) | 留存、DAU/MAU、NPS、ROI |

### 05 — Agent 产品设计

| 文件 | 核心概念 |
|------|---------|
| [Agent 循环](./05-agent-design/agent-loop) | 感知-推理-行动循环 |
| [AI 工具分类与 Agent Loop](./05-agent-design/ai-tool-taxonomy-and-agent-loop) | 三层结构、9 类工具、价值判断、Agent Loop 升级路径 |
| [记忆设计](./05-agent-design/memory-design) | 短期/中期/长期记忆 |
| [权限与审批](./05-agent-design/permission-and-approval) | RBAC/ABAC/ReBAC |
| [多 Agent 工作流](./05-agent-design/multi-agent-workflow) | 层级式/管道式/市场式 |
| [可观测性](./05-agent-design/observability) | Logging/Metrics/Tracing |

### 06 — AI PM 职业发展

| 文件 | 核心内容 |
|------|---------|
| [成长路线图](./06-career/ai-pm-roadmap) | L1-L4 四阶段成长路线图 |
| [技能图谱](./06-career/ai-pm-skill-map) | 硬技能/软技能/工具技能图谱 |
| [作品集指南](./06-career/portfolio-building-guide) | 作品集模板、STAR 升级版 |
| [PM 实操工具包](./06-career/pm-toolkit) | 立项 Checklist、CEO 沟通框架、Demo 技巧 |

### 07 — 提示词工程

| 文件 | 核心内容 | 适用场景 |
|------|---------|---------|
| [ChatGPT Web 产品落地手册](./07-prompts/chatgpt-web-zero-to-one-product-playbook) | 用 ChatGPT Web 从机会发现、用户研究、MVP、PRD、原型、研发拆解到上线复盘 | 把 ChatGPT 当作产品经理工作台 |
| [PRD Prompts](./07-prompts/prd-prompts) | 8 个 PRD 写作 Prompt | 写各类 AI 产品的 PRD |
| [用户研究 Prompts](./07-prompts/user-research-prompts) | 8 个用户研究 Prompt | 用户访谈、问卷、竞品分析 |
| [路线图 Prompts](./07-prompts/roadmap-prompts) | 8 个路线图 Prompt | 路线图规划、OKR 拆解 |
| [评估 Prompts](./07-prompts/evaluation-prompts) | 10 个评估 Prompt | LLM 评估、Agent 评估、A/B 测试 |

### 08 — 用户研究

| 文件 | 核心内容 | 解决什么问题 |
|------|---------|-------------|
| [用户研究方法论](./08-user-research/user-research-methods) | AI 产品用户研究方法论、可用性测试、Beta 设计 | 传统方法在 AI 产品中怎么改 |
| [AI 需求验证](./08-user-research/demand-validation) | Fake Door Test、Concierge MVP、需求评估矩阵 | 用户到底需不需要这个 AI 功能 |
| [用户期望管理](./08-user-research/expectation-management) | 能力边界披露、置信度视觉化、失败兜底设计 | 怎么不让用户对 AI 期望过高 |

### 09 — 商业化

| 文件 | 核心内容 | 解决什么问题 |
|------|---------|-------------|
| [AI 产品定价策略](./09-monetization/pricing-strategies) | 4 种定价模式、免费层设计、企业定价 | AI 产品该怎么收费 |
| [Token 经济学](./09-monetization/token-economics) | 成本拆解、模型分级、缓存策略、限速设计 | 推理成本怎么控制不烧钱 |
| [B端 vs C端设计](./09-monetization/b2b-vs-consumer) | B端 vs C端差异、私有部署、SLA 设计 | 怎么同时服务企业和个人用户 |

### 10 — 安全合规

| 文件 | 核心内容 | 解决什么问题 |
|------|---------|-------------|
| [内容安全与幻觉管控](./10-compliance/content-safety-framework) | 三层安全架构、分级策略、幻觉管控 | 怎么保证 AI 内容安全 |
| [数据隐私与合规](./10-compliance/privacy-compliance) | 个保法/GDPR 解读、数据脱敏、用户控制 | 数据隐私合规怎么做 |
| [审计追踪与透明度](./10-compliance/ai-audit-transparency) | 审计日志、可解释性、企业合规报告 | 用户问'为什么给这个回答'怎么办 |
| [AI 治理检查清单](./10-compliance/ai-governance-checklist) | 68 项上线检查清单、P0/P1/P2 分级 | AI 产品上线前必查 |

### 11 — 开发流程

| 文件 | 核心内容 | 解决什么问题 |
|------|---------|-------------|
| [从 0 到 1 全流程](./11-dev-process/product-lifecycle-guide) | 12 周全流程、Go/No-Go 决策、时间线陷阱 | AI 产品怎么从 0 做到 1 |
| [Prompt 工程管理](./11-dev-process/prompt-management) | Prompt 版本控制、测试流程、发布策略 | Prompt 怎么像代码一样管理 |
| [PM 与工程师协作](./11-dev-process/pm-mle-collaboration) | 角色职责矩阵、决策权归属、冲突处理 | PM 和工程师怎么分工 |
| [模型升级与灰度策略](./11-dev-process/model-iteration-playbook) | 灰度策略、影响评估、回滚机制、A/B 测试 | 模型升级怎么不翻车 |

### 12 — LLM 工程与微调教程

| 文件 | 核心内容 | 适用场景 |
|------|---------|---------|
| [LLM 工程与微调教程总览](./12-llm-engineering/) | 从基础到高级的 LLM 工程学习路线 | 系统学习 LLM 工程 |
| [什么是 LLM？](./12-llm-engineering/01-llm-basics) | 大语言模型基础、参数、生成回答、能力边界 | 入门理解模型 |
| [Token、Tokenization 和上下文窗口](./12-llm-engineering/02-token-tokenization-context) | token、切词、context window、成本和 Prompt 设计 | Prompt / 成本 / RAG 设计 |
| [Embedding 和语义搜索](./12-llm-engineering/03-embedding-semantic-search) | embedding、向量数据库、语义搜索、RAG 检索基础 | 知识库 / RAG / AI 记忆 |
| [Transformer 和 Attention](./12-llm-engineering/04-transformer-attention) | Transformer、self-attention、多头注意力、长上下文成本 | 理解模型结构和上下文使用 |
| [参数、训练和推理](./12-llm-engineering/05-parameters-training-inference) | 参数、训练、推理、预训练、微调、生成参数 | 理解模型研发与产品方案选择 |
| [开源模型 vs 闭源模型](./12-llm-engineering/06-open-source-vs-closed-source) | API 模型、本地模型、私有化、模型路由、TCO | 模型选型与架构决策 |

---

## 🔍 按场景搜索

| 你在做什么 | 推荐阅读 |
|-----------|---------|
| **想用 ChatGPT 从 0 做产品** | ChatGPT Web 产品落地手册 → 从 0 到 1 全流程 → PRD Prompts |
| **想系统学习 LLM 工程** | LLM 工程与微调教程总览 → 什么是 LLM → Token 与上下文窗口 → Embedding 和语义搜索 → Transformer 和 Attention → 参数、训练和推理 → 开源模型 vs 闭源模型 |
| **接到一个新 AI 产品需求** | 需求验证 → 产品画布 → PRD 模板 → 评估指标 |
| **要设计一个 Agent** | Agent 画布 → Agent 循环 → 记忆设计 → 权限审批 |
| **要给模型做评测** | LLM 输出质量 → 工具调用评估 → 评估 Prompts |
| **要转型做 AI PM** | 成长路线图 → 技能图谱 → 作品集指南 → PM 工具包 |
| **要写一份 PRD** | 选对应 PRD 模板 → 看案例 → 用 Prompts |
| **要定价和算成本** | 定价策略 → Token 经济学 → B端 vs C端设计 |
| **要上线 AI 产品** | 安全合规清单 → 从 0 到 1 全流程 → 模型升级灰度 |
| **要管理用户期望** | 用户期望管理 → Demo 技巧 → 内容安全框架 |
| **要设计多 Agent 系统** | 多 Agent 工作流 → 可观测性 → 案例研究 |
