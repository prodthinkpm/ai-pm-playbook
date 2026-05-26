# LLM 工程与微调教程

> 从产品经理视角出发，用简单中文、生活类比和小项目，系统学习现代 LLM 工程、微调、RAG、Agent、部署和评估。

---

## 这个教程适合谁？

适合想从“会用 AI”升级到“能设计和落地 AI 产品”的人，尤其适合：

- AI 产品经理
- 想转型 AI PM 的产品经理
- 需要和算法、工程团队协作的业务负责人
- 想理解 LLM 工程但不想一开始陷入数学细节的学习者

---

## 学习目标

学完这个系列，你应该能够：

1. 解释 LLM、token、embedding、attention、参数、训练、推理等基础概念。
2. 区分 prompt、RAG、fine-tuning、continued pretraining 分别适合什么问题。
3. 看懂 LoRA、QLoRA、DPO、RLHF、量化、checkpoint、GGUF 等微调相关词。
4. 理解本地 AI 工具链，如 Ollama、llama.cpp、vLLM、Hugging Face、Unsloth、Axolotl、PEFT、TRL。
5. 设计一个基础 RAG 系统，包括 chunking、embedding、vector database、retrieval pipeline。
6. 设计 AI Agent，包括 system prompt、tool calling、function calling、memory、workflow 和权限控制。
7. 从产品角度评估模型质量、速度、成本、幻觉风险和上线方案。

---

## 学习方式

每一课都尽量使用固定结构：

1. 简单定义
2. 生活类比
3. 核心原理
4. 实际例子
5. 工程应用
6. 常见误区
7. 本课总结
8. 心智模型
9. 小练习
10. 小项目

原则是：

> 先建立直觉，再补工程细节，最后回到产品落地。

---

## 课程路线

### 第一部分：基础篇

| 课程 | 核心问题 |
|------|---------|
| [第 1 课：什么是 LLM？](./01-llm-basics) | 大语言模型到底是什么？ |
| [第 2 课：Token、Tokenization 和上下文窗口](./02-token-tokenization-context) | 模型为什么不是直接读“字”和“词”？ |
| [第 3 课：Embedding 和语义搜索](./03-embedding-semantic-search) | 文字为什么可以变成“意思坐标”？ |

### 第二部分：模型结构篇

| 课程 | 核心问题 |
|------|---------|
| [第 4 课：Transformer 和 Attention](./04-transformer-attention) | 为什么现代 LLM 这么强？ |
| [第 5 课：参数、训练和推理](./05-parameters-training-inference) | 模型里面的“参数”到底是什么？ |
| [第 6 课：开源模型 vs 闭源模型](./06-open-source-vs-closed-source) | 什么时候用开源，什么时候用闭源？ |

### 第三部分：数据和训练篇

| 课程 | 核心问题 |
|------|---------|
| 第 7 课：SFT 数据集和指令微调 | 如何把模型教成“听指令的助手”？ |
| 第 8 课：偏好数据、DPO 和 RLHF | 如何让模型回答更符合人的偏好？ |
| 第 9 课：合成数据和数据清洗 | 为什么数据质量比数据数量更重要？ |

### 第四部分：微调篇

| 课程 | 核心问题 |
|------|---------|
| 第 10 课：Fine-tuning 基础 | 微调到底改变了什么？ |
| 第 11 课：LoRA 和 Adapter Tuning | 如何低成本微调大模型？ |
| 第 12 课：QLoRA 和 Quantization | 如何更省显存地训练和部署？ |
| 第 13 课：Checkpoint、Adapter 和 GGUF | 模型文件为什么有这么多格式？ |

### 第五部分：RAG、Agent、部署与产品篇

| 课程 | 核心问题 |
|------|---------|
| 第 14 课：RAG 基础 | 如何让模型基于你的资料回答？ |
| 第 15 课：Tool Calling 和 Agent | 如何让模型不只回答，还能做事？ |
| 第 16 课：推理优化和模型服务 | 如何让模型更快、更便宜、更稳定？ |
| 第 17 课：本地 AI 生态 | Ollama、llama.cpp、vLLM 等工具怎么选？ |
| 第 18 课：评估、成本和产品落地 | 如何判断一个 AI 功能是否值得上线？ |

---

## 最终项目

完成一个从 0 到 1 的 AI 知识库助手：

1. 准备业务文档。
2. 清洗文档。
3. 切 chunk。
4. 生成 embedding。
5. 存入向量数据库。
6. 构建检索流程。
7. 接入 LLM。
8. 设计 system prompt。
9. 加入引用来源。
10. 做质量评估。
11. 做成本估算。
12. 部署成 API 或网页 Demo。

最终你会理解：

> AI 产品不是只接一个模型 API，而是模型、数据、检索、工具、评估、成本和用户体验的组合系统。
