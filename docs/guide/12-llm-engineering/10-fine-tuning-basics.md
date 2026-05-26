# 第 10 课：Fine-tuning 基础

> 本课目标：理解 fine-tuning 的核心原理——从梯度更新到 loss 曲线、从过拟合到灾难性遗忘——以及何时该微调、何时不该。

---

## 1. 先说结论

Fine-tuning（微调）是 LLM 工程里最重要的一步。

**简单定义**：在已经训练好的模型基础上，用少量高质量数据继续训练，让它更擅长某一类任务。

你做 SFT（指令微调）是在做 fine-tuning，你做 LoRA 也是在做 fine-tuning，差别只在于**方式不同**。

核心概念一览：

| 概念 | 一句话 |
|------|--------|
| Fine-tuning | 在预训练模型上继续训练，适应新任务 |
| Full fine-tuning | 更新模型**所有**参数 |
| PEFT | 只更新**少量**额外参数，主体不动 |
| Loss | 衡量模型输出和正确答案之间的差距 |
| 过拟合 | 模型记住了训练数据，但面对新数据就垮 |
| 灾难性遗忘 | 学新能力时，把旧能力丢了 |

> Fine-tuning 不是万能药。用错了，模型会变差。

---

## 2. 生活类比

### 类比 1：一个厨房里的故事

你已经有一个厨师（预训练模型），他什么菜都会做。

但你的餐厅主做**川菜**。

你可以：

- **Full fine-tuning** = 让厨师重新学一遍所有烹饪技术，再专门训练川菜。他全身心投入。
- **PEFT（LoRA）** = 给厨师配一套川菜专用工具包，他原来的刀法不变，但有了新工具后专门强化川菜手艺。更快、更省力。

同样是提升川菜水平，方式完全不同。

### 类比 2：学生备考

一个学生已经学过高中数学（预训练）。

现在要考**竞赛数学**：

- **Full fine-tuning** = 所有的数学课本全部重新学一遍，全部知识点都更新。
- **PEFT** = 只买几本竞赛辅导书，基础数学知识不动，把时间全部用在竞赛题型上。

**结果**：PEFT 更高效，但上限可能不如 full fine-tuning。

---

## 3. Full Fine-tuning vs PEFT：核心区别

### Full Fine-tuning（全参数微调）

对整个模型的**全部参数**进行更新。

```
输入数据 → 模型（7B / 70B 参数全部参与计算）
                ↓
         计算 loss
                ↓
         梯度回传到**所有层**
                ↓
         更新**所有参数**
```

特点：

| 维度 | 说明 |
|------|------|
| 参数量 | 全部参数参与更新 |
| GPU 显存 | 极高（需要存储优化器状态 + 梯度 + 参数） |
| 训练时间 | 长 |
| 效果上限 | 理论上最高 |
| 风险 | 高——容易过拟合，容易灾难性遗忘 |

### PEFT（Parameter-Efficient Fine-Tuning）

只更新**一小部分额外参数**，原始模型参数不动。

最常见的 PEFT 方法是 **LoRA（Low-Rank Adaptation）**。

```
输入数据 → 模型原始参数（冻结，不更新）
                ↓
         经过 LoRA 层（新增的小矩阵）
                ↓
         计算 loss
                ↓
         只更新 LoRA 层的参数
```

特点：

| 维度 | 说明 |
|------|------|
| 参数量 | 仅 0.1% ~ 2% 的参数在更新 |
| GPU 显存 | 低很多（不需要存完整优化器状态） |
| 训练时间 | 短 |
| 效果上限 | 接近 full fine-tuning（大部分场景够用） |
| 风险 | 低——保留原模型能力，不易遗忘 |

### 对比总结

| 对比项 | Full Fine-tuning | PEFT（LoRA） |
|--------|-----------------|-------------|
| 更新哪些参数 | 全部 | 少量新增参数 |
| 原始模型 | 被修改 | 冻结、不改变 |
| 显存需求 | 高 | 低 |
| 适合场景 | 数据量大、需要大幅调整 | 数据量小、快速实验 |
| 存储结果 | 每个模型要存一份完整权重（~15GB for 7B） | 只存小文件（~几十 MB） |
| 部署灵活性 | 每个任务一个完整模型 | 基础模型不变，切换 LoRA 权重即可 |

> 实际工程中，80% 以上的场景用 PEFT 就够了。Full fine-tuning 一般留给大团队、大数据、大预算的场景。

---

## 4. 训练时模型内部发生了什么？

很多人把 fine-tuning 当成"黑魔法"。其实内部逻辑非常清楚。

### Step 1：前向传播（Forward Pass）

输入数据进入模型，经过每一层 Transformer 计算，最终输出一个 token 序列。

模型对**每个位置**输出一个**概率分布**——预测下一个词是谁。

### Step 2：计算 Loss

Loss = 模型预测和正确答案之间的差距。

最常用的是 **交叉熵损失（Cross-Entropy Loss）**：

```
如果正确 token 是 "北京"
模型预测 "北京" 的概率是 0.9 → loss 很小
模型预测 "北京" 的概率是 0.1 → loss 很大
```

简单理解：loss 越小，模型越接近正确答案。

### Step 3：反向传播（Backward Pass）

这是 fine-tuning 的核心。系统会：

1. 计算 loss 对**每个参数**的导数（梯度）
2. 梯度 = "往哪个方向调整参数，能让 loss 下降"

梯度像是一个**方向指示器**：

```
参数 A 的梯度是 +0.5 → 参数 A 应该减小一点
参数 B 的梯度是 -0.3 → 参数 B 应该增大一点
```

### Step 4：参数更新

用**优化器**（Optimizer）更新参数。

最常用的是 **AdamW** 优化器。更新公式简化版：

```
新参数 = 旧参数 - 学习率 × 梯度
```

如果学习率太大，参数一步跳太远，模型可能震荡。
如果学习率太小，参数慢慢挪，训练超级慢。

### 一张图看流程

```
输入 → [Transformer 层] → [Transformer 层] → ... → 输出概率
                                                ↓
                                          计算 loss
                                                ↓
                                          反向传播梯度
                                                ↓
                                          更新参数（只更新被允许的部分）
                                                ↓
                                          下一轮训练
```

> Full fine-tuning：梯度传给所有层，所有参数都更新。
> PEFT（LoRA）：梯度只传给 LoRA 层，原始参数不动。

---

## 5. 训练超参数详解

Fine-tuning 有一堆超参数（hyperparameters）需要你设置。它们直接影响训练效果。

### 学习率（Learning Rate）

最重要的超参数。

| 设置 | 效果 |
|------|------|
| 太高（> 5e-4） | 模型跳跃太大，loss 可能爆炸，甚至 NaN |
| 适中（1e-4 ~ 2e-4） | 一般 SFT 的起点 |
| 较低（1e-5） | 稳定但慢，适合 full fine-tuning |
| 太低（< 1e-6） | 模型几乎不学，浪费训练时间 |

经验法则：

- **SFT（全参数微调）**：学习率约 1e-5 ~ 2e-5
- **LoRA 微调**：学习率约 2e-4 ~ 5e-4（因为更新参数少，需要大一点步长）

### Batch Size（批次大小）

一次输入模型的数据量。

```
Batch size = 4 → 一次读 4 条数据，更新一次参数
```

| 设置 | 效果 |
|------|------|
| batch size 太小（1~2） | 梯度噪声大，不稳定 |
| batch size 适中（4~16） | 最常用 |
| batch size 太大（64+） | 训练稳定但收敛可能变慢，需要更多显存 |

> **显存不够怎么办？** 用 gradient accumulation（梯度累积）。batch size=2，累积 4 步 = 等效 batch size=8。

### Epochs（训练轮数）

模型完整看完一遍训练数据 = 1 epoch。

| epoch 数 | 效果 |
|----------|------|
| 1 epoch | 适合 SFT（防止过拟合） |
| 2~3 epochs | 数据量小的时候可以多学几遍 |
| 太多（>5） | 过拟合风险极高 |

> **很多 SFT 只需要 1 epoch**。一遍就够了，多学几遍模型反而会记住训练数据。

### Warmup Steps（预热步数）

训练刚开始时，学习率从 0 慢慢升到目标值。

```
0 steps      → 学习率直接从 0 跳到目标值 → 不稳定
100 steps    → 前 100 步学习率从 0 升到目标值 → 稳定
```

预热的作用：避免刚开始训练时，模型参数还处于"不稳定状态"，大梯度冲击导致震荡。

> 一般设为总步数的 5%~10%。比如 1000 步训练，warmup=50~100 步。

---

## 6. 过拟合和欠拟合

### 过拟合（Overfitting）

模型**把训练数据背下来了**，但没学会真正的规律。

表现：

- 训练 loss 很低
- 验证 loss 很高（不下降，甚至上升）
- 模型在训练数据上表现完美，在新数据上表现很差

**日常类比**：

学生背了考试原题，考了 100 分。但题目一换，他完全不会。他不是学会了知识，是背下了答案。

### 欠拟合（Underfitting）

模型**还没学到足够的知识**。

表现：

- 训练 loss 仍然很高
- 验证 loss 也很高
- 模型在训练数据上表现就不好

**日常类比**：

学生只刷了 5 道题就去考试，当然什么都不会。

### 看看对比

| 状态 | 训练 loss | 验证 loss | 怎么办 |
|------|----------|----------|--------|
| 欠拟合 | 高 | 高 | 增加 epoch，增大学习率，加数据 |
| 正常 | 低 | 略高但不恶化 | ✅ 好 |
| 过拟合 | 非常低 | 高/上升 | 减少 epoch，加 dropout，早停（early stopping） |

---

## 7. 训练 vs 验证 Loss 曲线

训练时，你会在两个数据集上看 loss：

- **训练集（Training set）**：模型学习的数据
- **验证集（Validation set）**：模型没见过的新数据，用来评估真实表现

### 理想曲线

```
Loss
 ↑
 |    🟦训练 loss
 |   ╱
 |  ╱  🟩验证 loss
 | ╱  ╱
 |╱  ╱
 |   ╱
 |  ╱
 | ╱
 └──────────────────→ 步数
```

两条线都下降，验证 loss 略高于训练 loss，但不反弹。✅ 完美状态。

### 过拟合曲线（危险的信号）

```
Loss
 ↑
 |    🟦训练 loss
 |   ╱
 |  ╱
 | ╱   🟩验证 loss
 |╱   ╱
 |   ╱↗ ← 验证 loss 开始反弹！
 |  ╱
 | ╱
 └──────────────────→ 步数
```

验证 loss 先下降、后上升 → 模型开始**死记硬背**，而不是学习规律。

> **这个拐点就是"停止训练"的信号。** 看到验证 loss 反弹，立刻停。

### 欠拟合曲线

```
Loss
 ↑
 |   🟦训练 loss
 |  ╱
 | ╱  🟩验证 loss
 |╱  ╱
 |   ╱
 |  ╱
 | ╱   ← 两条线都高，下降缓慢
 └──────────────────→ 步数
```

两条线都居高不下 → 模型没学到足够信息。

### 实际中怎么做

1. 每 N 步（比如每 100 步）在验证集上算一次 loss
2. 记录训练 loss 和验证 loss
3. 画成两条曲线
4. 看到验证 loss 反弹 → 立刻保存当前最优模型并停止

---

## 8. 检查点（Checkpointing）

Fine-tuning 过程中，模型的状态会逐渐变好……然后可能变差（过拟合）。

**checkpoint** = 在某个时间点保存模型状态的"快照"。

### 为什么要保存 checkpoint

| 原因 | 说明 |
|------|------|
| 防止训练崩了 | 训练意外中断（掉电、OOM），可以恢复 |
| 找到最佳模型 | 验证 loss 最低的那个 checkpoint 才是最好的 |
| 回退 | 如果后面过拟合了，可以回退到前面的 checkpoint |

### Checkpoint 包含什么

一个完整的 checkpoint 包含：

```
checkpoint-100/
├── model.safetensors      # 模型权重文件
├── optimizer.pt           # 优化器状态（可恢复训练）
├── training_args.bin      # 训练超参数
├── scheduler.pt           # 学习率调度器状态
├── trainer_state.json     # 当前进度（步数、epoch）
└── config.json            # 模型配置
```

### 最佳实践

```
每隔 X 步保存一次 → 比如每 500 步
只保留最好的 3~5 个 checkpoint → 节省磁盘空间
保存验证 loss 最低的那个 → 最终使用这个
```

> Hugging Face `Trainer` 默认会帮你做 checkpointing。你也可以指定 `save_steps=500`。

---

## 9. 什么时候微调有效？什么时候无效？

### Fine-tuning 能改变什么

| 能改变 | 例子 |
|--------|------|
| 输出格式/风格 | 从长回答改为简短回答 |
| 对话语气 | 从正式改为亲切、幽默 |
| 指令遵循能力 | 更好遵守格式要求（JSON、Bullet points） |
| 任务专注度 | 更擅长某一类任务（代码、翻译、总结） |

### Fine-tuning 不能改变什么

| 不能改变 | 原因 |
|----------|------|
| 事实性知识 | 模型不知道的，你很难通过几百条数据教会它 |
| 推理能力上限 | 模型基础推理能力由预训练决定，微调提升有限 |
| 语言能力 | 7B 模型不会因为微调变成 70B 的水平 |
| 幻觉 | 微调不能根治幻觉，甚至可能加重 |

### 核心原则

> **Fine-tuning 擅长改**怎么回答**，不擅长教**新知识**。

如果你想教模型新知识：
- 应该用 **RAG**（检索增强生成）
- 或者用 **继续预训练**（continue pretraining），而不是微调

### 常见误区

```
❌ "我微调了模型，它应该能回答所有关于我们公司的问题了。"
→ 不对。微调只改回答方式，不改知识库。

✅ "我微调了模型，让它回答公司问题时用特定格式、语气亲切。"
→ 对。这是微调擅长的。
```

---

## 10. 灾难性遗忘

### 什么是灾难性遗忘

模型学会新东西的同时，**把旧能力忘了**。

```
微调前：模型会翻译、会写诗、会写代码、会解释概念
微调后：模型写代码变好了，但不会翻译了、不会写诗了
```

这就是灾难性遗忘。

### 为什么发生

模型的学习能力是**有限的资源**。

当你用大量"写代码"数据做微调：
- 模型的注意力/权重分布**往代码方向偏移**
- 原本用于翻译的权重被"挤走"
- 导致翻译能力下降

### 灾难性遗忘的严重程度

| 因素 | 遗忘程度 |
|------|---------|
| 微调数据量 | 数据越多，遗忘越严重 |
| 任务差异度 | 差异越大（代码 vs 诗歌），遗忘可能更严重 |
| Full vs PEFT | Full fine-tuning 更容易遗忘 |
| 学习率 | 学习率越大，遗忘越严重 |

### 如何缓解

**方法 1：保留原始数据**

在微调数据中混入 10%~30% 的原始通用数据（翻译、写诗、闲聊）。

```
训练数据 = 80% 新任务 + 20% 旧任务
```

**方法 2：用 PEFT（LoRA）**

LoRA 不改变原始模型参数，遗忘风险大幅降低。

**方法 3：学习率不要太大**

大学习率 = 大步调整 = 更容易覆盖旧知识。

**方法 4：减少 epoch**

不要贪多。1~2 epoch 通常就够。

**方法 5：EWC（弹性权重巩固）**

一种高级方法，在训练时对重要参数加"保护"，不让它们被大幅修改。

> 对多数团队来说，**用 LoRA + 混入旧数据** 是最实际的防遗忘方案。

---

## 11. 实际工程考量

### GPU 显存

Fine-tuning 的显存消耗来自 4 部分：

```
模型参数（weights） + 梯度（gradients） + 优化器状态（optimizer states） + 激活值（activations）
```

| 模型大小 | Full FT 最低显存 | LoRA 最低显存 |
|---------|----------------|-------------|
| 7B 参数 | ~56GB（需要 A100-80G） | ~16GB（消费级 GPU 可跑） |
| 13B 参数 | ~120GB（需要多卡） | ~32GB（A100 可行） |
| 70B 参数 | 需要多卡集群 | ~120GB（至少 2 张 A100） |

> 显存不够的方案：LoRA、QLoRA（量化 + LoRA）、gradient checkpointing、CPU offloading。

### 训练时间

以 7B 模型、1000 条数据为例：

| 方式 | 训练时间（单卡 A100） |
|------|---------------------|
| Full fine-tuning | 30~60 分钟 |
| LoRA | 5~15 分钟 |
| QLoRA（4bit） | 10~20 分钟 |

数据量 10000 条，乘以 10 倍：

| 方式 | 训练时间 |
|------|---------|
| Full fine-tuning | 5~10 小时 |
| LoRA | 1~2 小时 |

### 数据要求

| 场景 | 最少数据量 | 推荐数据量 |
|------|-----------|-----------|
| 风格调整（语气、格式） | 50~200 条 | 500~2000 条 |
| 特定任务优化 | 500 条 | 1000~5000 条 |
| 任务能力显著提升 | 2000 条 | 5000~20000 条 |
| 通用助手训练 | 10000 条 | 50000+ 条 |

> 再次强调：**质量 > 数量**。200 条精心设计的数据 > 2000 条随便拼凑的数据。

### 要不要用分布式训练

| 场景 | 建议 |
|------|------|
| 7B 模型 + LoRA | 单卡足够，不需要分布式 |
| 7B 模型 + Full FT | 需要 1~2 张 A100 |
| 13B + Full FT | 需要 4+ 张 A100 |
| 70B + LoRA | 需要 2~4 张 A100 |
| 70B + Full FT | 需要分布式多节点集群 |

> 普通团队做 fine-tuning 建议从 LoRA + 7B 模型开始，单卡能跑，成本低，迭代快。

---

## 12. 本课总结

- **Fine-tuning** = 在预训练模型上继续训练，适应新任务
- **Full fine-tuning** 更新所有参数，效果好但代价大
- **PEFT（LoRA）** 只更新少量参数，是更务实的方案
- Loss 衡量模型输出和正确答案的差距，训练就是让 loss 不断下降
- **学习率、batch size、epochs、warmup** 是四大关键超参数
- **过拟合**：训练 loss 低、验证 loss 反弹；**欠拟合**：两条 loss 都高
- **Checkpoint** 帮你保存中间状态，找到最佳模型
- Fine-tuning 擅长**改输出风格**，不擅长**教新知识**（用 RAG）
- **灾难性遗忘** = 学新丢旧，用 LoRA + 混入旧数据缓解
- 工程上：首选 **LoRA + 7B 模型 + 单卡 GPU**

---

## 13. 心智模型

> Fine-tuning 就像给一位资深老师做"教学风格调整"。

他已经学识渊博（预训练），你不需要重新教他知识。

你要做的是：
1. 告诉他："回答问题时要给学生举例子"（风格调整）
2. 给他 1000 道练习题，让他练习这个风格（数据训练）
3. 过程中注意：不要让他把原来的数学知识丢掉（防灾难性遗忘）

LoRA 方案就像给老师带了一个**耳麦**——他的大脑（原始模型参数）不动，耳麦里的指令（LoRA 权重）告诉他在某些场景下怎么说话。

---

## 14. 初学者常见错误

### 错误 1：以为微调能"教"模型新知识

❌ 我微调了 500 条数据，模型应该能回答所有产品问题了。

✅ 微调改的是回答风格/格式，新知识用 RAG 或继续预训练。

### 错误 2：用 full fine-tuning 只为了改一点风格

❌ 只改了回答语气，却用了 full fine-tuning，浪费 GPU 且容易遗忘。

✅ 风格调整用 LoRA 就行。又快又稳。

### 错误 3：不断训练直到训练 loss 接近 0

❌ 训练 loss 到 0 了，真厉害！
❌ 验证 loss 已经反弹了还不停……

✅ 只看验证 loss。验证 loss 反弹 = 过拟合，立刻停。

### 错误 4：学习率用预训练的默认值

❌ 微调用预训练的学习率（比如 1e-3），loss 直接炸了。

✅ SFT 全参数微调用 1e-5 ~ 2e-5，LoRA 用 2e-4 ~ 5e-4。

### 错误 5：不保存 checkpoint

❌ 训练跑了一夜，最后一步模型过拟合了，没有中间 checkpoint。

✅ 每 N 步保存一次，保留验证 loss 最低的那个。

### 错误 6：不看验证 loss，只看训练 loss

❌ 训练 loss 降得很好 → 觉得成功了 → 部署后效果极差。

✅ 验证 loss 才是真实能力反映。训练 loss 低可能是过拟合。

---

## 15. 小练习

1. 打开 Hugging Face，找到 `HuggingFaceH4/ultrachat_200k` 数据集
2. 下载 100 条数据，分成训练集（80 条）和验证集（20 条）
3. 用 Hugging Face `AutoModelForCausalLM` + `Trainer` 跑一次 LoRA 微调
4. 设置不同的学习率（1e-4、5e-4、1e-3），观察训练和验证 loss 变化
5. 跑 3 个 epoch，观察验证 loss 是否在某个 epoch 后反弹
6. 检查微调前后模型对同一问题的回答变化
7. 写一段话总结：**什么样的数据会让模型变好，什么样的数据会让模型变差**

---

## 16. 小项目

完整跑一次 fine-tuning 全流程：

**任务**：让一个 1.5B 模型学会用"老北京话"风格回答问题。

**步骤**：

1. 准备 30 条训练数据、10 条验证数据

```json
{
  "instruction": "你好",
  "output": "哟，您吉祥！吃了吗您内？"
},
{
  "instruction": "今天天气真好啊",
  "output": "可不是嘛，这天儿蓝得跟画儿似的，倍儿舒坦！"
}
```

2. 用 Unsloth 或 Hugging Face TRL 加载模型

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "Qwen/Qwen2.5-1.5B-Instruct"
model = AutoModelForCausalLM.from_pretrained(model_name)
tokenizer = AutoTokenizer.from_pretrained(model_name)
```

3. 配置 LoRA（rank=8, alpha=16）

```python
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)

model = get_peft_model(model, lora_config)
```

4. 设置超参数并训练

```python
from transformers import TrainingArguments, Trainer

training_args = TrainingArguments(
    output_dir="./beijing-dialect-lora",
    per_device_train_batch_size=4,
    learning_rate=3e-4,
    num_train_epochs=3,
    logging_steps=10,
    save_steps=50,
    eval_steps=50,
    evaluation_strategy="steps",
    save_total_limit=3,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
)

trainer.train()
```

5. 观察训练日志中的 loss 值

```
Step 10 - train loss: 2.34, eval loss: 2.45
Step 20 - train loss: 1.89, eval loss: 2.01
Step 30 - train loss: 1.52, eval loss: 1.78
Step 40 - train loss: 1.21, eval loss: 1.65  ← 注意验证 loss 下降变慢
Step 50 - train loss: 0.98, eval loss: 1.68  ← 验证 loss 开始反弹！过拟合！
```

6. 保存最终模型，加载 LoRA 权重，测试效果

```python
# 加载 LoRA 权重
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained(model_name)
lora_model = PeftModel.from_pretrained(base_model, "./beijing-dialect-lora/checkpoint-40")

# 测试
inputs = tokenizer("你好", return_tensors="pt")
outputs = lora_model.generate(**inputs, max_new_tokens=50)
print(tokenizer.decode(outputs[0]))
# 预期输出：哟，您吉祥！吃了吗您内？
```

完成后，你就算亲手完成了一次完整的 fine-tuning 项目。

---

## 下一课

[第 11 课：LoRA 和 Adapter Tuning](./11-lora-adapter-tuning)
