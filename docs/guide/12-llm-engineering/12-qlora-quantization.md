# 第 12 课：量化和 QLoRA

> 本课目标：理解量化（Quantization）是什么、为什么这么重要，以及如何用 QLoRA 在消费级显卡上微调大模型。

---

## 1. 先说结论

**量化** = 把模型里的数字精度降低，用更少的内存存储和计算。

**QLoRA** = 把量化和 LoRA 结合起来，让你在**一张消费级显卡**上微调 70B 的大模型。

这对 AI PM 来说可能是整个工程系列里**最实用**的一课——因为它直接回答了一个问题：

> **如果团队只有 RTX 3090 / 4090，没有 A100，还能不能做 LLM 微调？**

答案：可以。靠的就是量化和 QLoRA。

先看一个直观对比：

| 方式 | 7B 模型微调最低显存 | 70B 模型推理 |
|------|-------------------|-------------|
| Full FP16 | ~56GB（需要 A100） | ~140GB（需要多卡） |
| INT8 量化 | ~28GB（单卡 3090） | ~70GB（两张 3090） |
| INT4 量化 | ~14GB（单卡消费级） | ~35GB（单卡 A100） |
| QLoRA (4bit) | ~6GB（笔记本也能跑） | ~48GB（单卡 A6000） |

**量化让大模型不再是大公司的专利。**

---

## 2. 什么是量化？生活类比

### 先理解"精度"

模型参数是**浮点数**——小数点后很多位。

```
原始参数（FP32）：3.141592653589793
                    ↑ 小数点后 15 位
量化后（INT8）：   3
```

就像一张照片：

- **FP32（32位浮点）** = 4K 超高清照片，放大 10 倍还能看清细节
- **FP16（16位浮点）** = 1080p 照片，够用
- **INT8（8位整数）** = 640×480 的 JPEG，能看清主要内容
- **INT4（4位整数）** = 打码的缩略图，但轮廓还能认出来

### 生活类比：收银台的故事

你去超市买东西，总价是 **"99.876543 元"**。

| 精度 | 收银员怎么说 | 误差 |
|------|------------|------|
| FP32 | "99.876543 元" | 精确到分 |
| FP16 | "99.88 元" | 少收 0.003 元 |
| INT8 | "100 元" | 多收 0.12 元 |
| INT4 | "100……大概吧" | 可能找错钱 |

**关键点**：模型不是人类——它不需要绝对的精确。模型参数稍有偏差，**输出质量几乎不变**，但内存和速度大幅提升。

---

## 3. 为什么要量化？

### 原因 1：模型太大

一个 70B 参数的模型：

```
参数数量：70,000,000,000 个
每个参数用 FP16（2字节）→ 70B × 2 = 140 GB
140 GB 显存 → 需要 2 张 A100-80G
```

量化后：

```
INT4 量化（0.5字节/参数）→ 70B × 0.5 = 35 GB
35 GB → 一张 A100 或 RTX 6000 就够了
```

### 原因 2：推理更快

低精度计算更快：

- FP16 的矩阵乘法 ≈ FP32 的 **2 倍**速度
- INT8 的矩阵乘法 ≈ FP16 的 **2 倍**速度
- INT4 的矩阵乘法 ≈ 特殊硬件加速，更快

### 原因 3：省电省钱

| 精度 | 计算强度 | 功耗 |
|------|---------|------|
| FP32 | 高 | 100% |
| FP16 | 中 | ~50% |
| INT8 | 低 | ~25% |
| INT4 | 极低 | ~12% |

> 量化是实际部署中**性价比最高**的优化手段——花很少的成本换取速度翻倍。

---

## 4. 量化精度级别详解

### 一张表看懂

| 精度 | 全称 | 每个参数占内存 | 7B 模型大小 | 质量损失 |
|------|------|-------------|-----------|---------|
| FP32 | 32位浮点数 | 4 字节 | 28 GB | 无（原始精度） |
| FP16 | 16位浮点数 | 2 字节 | 14 GB | 几乎无 |
| BF16 | 16位脑浮点 | 2 字节 | 14 GB | 几乎无（训练常用） |
| FP8 | 8位浮点数 | 1 字节 | 7 GB | 轻微 |
| INT8 | 8位整数 | 1 字节 | 7 GB | 轻微 |
| NF4 | 4位归一化浮点 | 0.5 字节 | 3.5 GB | 中等 |
| FP4 | 4位浮点数 | 0.5 字节 | 3.5 GB | 中等 |
| INT4 | 4位整数 | 0.5 字节 | 3.5 GB | 中等 |

### 深入：每种精度什么意思

**FP32** — 原始精度。

模型训练和推理的"黄金标准"。但在实际使用中，绝大多数场景不需要这么高的精度。

```
FP32:  3.141592653589793
```

**FP16 / BF16** — 最常用的训练精度。

FP16 是半精度浮点，BF16 是 Google 发明的"脑浮点"。两者都是 16 位，但 BF16 保留了更多指数位（更大范围），训练时更稳定。

```
FP16:  3.140625    (范围有限，但够用)
BF16:  3.140625    (范围更大，训练更稳定)
```

几乎所有的 LLM 训练现在都用 BF16。

**INT8** — 整数精度。

把浮点数映射到 -128 到 127 的整数范围。推理精度损失很小，但速度提升很大。

**NF4** — QLoRA 专用的 4 位精度。

NormalFloat4，专门为神经网络设计。0 附近精度更高（因为模型参数大部分在 0 附近），远处精度低。

```
NF4 分布：
...-6 -5 -4 -3 -2 -1  0  1  2  3  4  5  6...
                     ██████████████
                  0 附近的参数精度最高
```

NF4 是 QLoRA 的关键创新之一。

**INT4 / FP4** — 最低精度。

参数被压缩到 16 个可能值（4 位 = 2^4 = 16 种组合）。质量损失明显，但内存节省极大。

### 一条经验法则

> 推理时，INT8 几乎不掉分；NF4/INT4 掉 1~3% 的准确率，但在大多数任务上仍然可用。

---

## 5. 什么是 QLoRA？

**QLoRA** = Quantized LoRA = 量化 + LoRA

### 核心思想

把预训练基座模型**量化到 4 位**（NF4），然后在这个量化模型上训练 LoRA 层。

```
普通 LoRA:   基座模型（FP16）→ 冻结 → 训练 LoRA 层
                                          显存：~16GB（7B）

QLoRA:      基座模型（NF4） → 冻结 → 训练 LoRA 层
                                          显存：~6GB（7B）
```

### 关键区别

| 维度 | LoRA | QLoRA |
|------|------|-------|
| 基座模型精度 | FP16/BF16 | NF4（4 位量化） |
| 训练时基座模型 | 冻结（不更新参数） | 冻结（不更新参数） |
| LoRA 层精度 | FP16/BF16 | FP16/BF16 |
| 每 token 推理速度 | 正常 | 略慢（需要反量化） |
| 显存节省 | 2~4 倍 | 8~12 倍 |
| 效果 | 接近全参数微调 | 接近 LoRA（损失极小） |

> 关键洞察：**LoRA 层本身跑在 FP16**，所以微调效果不会被量化损失严重影响。

---

## 6. QLoRA 工作原理（三剑客）

QLoRA 论文（2023 年 5 月，华盛顿大学）提出了三个关键技术：

### 剑 1：NF4 量化

普通 4 位量化把数值均匀分布，但这对模型参数来说不是最优的。

神经网络参数服从**正态分布**——大多数参数在 0 附近，少数参数在很远的地方。

NF4 做了优化：**0 附近分配更多量化值**，远处分配更少。

```
普通 4 位量化（均匀）：
-8 -6 -4 -2  0  2  4  6  8
每个区间一样宽，浪费了精度

NF4 量化（正态分布优化）：
-8 -6 -4 -2  0  2  4  6  8
              ██████████████
        靠近 0 的区间更细，精度更高
```

**结果**：NF4 比普通 4 位量化的质量更高。

### 剑 2：双重量化（Double Quantization）

量化参数本身也需要存储。

普通做法：每个 64 个参数共享一个量化缩放因子（scale），额外占用 0.5 位/参数。

双重量化：**把这 0.5 位的缩放因子，再量化一次**。

```
第一层量化：
模型参数（FP32）→ 分组 → 每组存一个 scale（FP32）
                                       ↓
第二层量化（Double Quantization）：
scale（FP32）→ 进一步量化 → 每组存一个 scale（INT8）
```

结果：额外内存从 0.5 位/参数降到 **0.127 位/参数**。听起来不多，但 70B 模型上意味着节省好几 GB。

### 剑 3：分页优化器（Paged Optimizers）

训练时，如果显存不够，优化器状态被自动换出到 CPU 内存。

```
GPU 显存满了 → 优化器状态自动换到 CPU 内存
                ↓
GPU 需要时 → 从 CPU 内存换回 GPU
```

类似操作系统的虚拟内存/分页机制。让模型在**显存刚好不够**的情况下也能正常训练。

### 整体流程

```
加载模型 → NF4 量化 → 附加 LoRA 层 → 冻结基座 → 训练 LoRA 层
                                              ↓
                                  NF4 参数推理时反量化到 FP16
                                  LoRA 层直接 FP16 计算
                                              ↓
                                  合并梯度 → 只更新 LoRA 层
```

---

## 7. 显存对比：全参数 vs LoRA vs QLoRA

### 训练显存（以 7B 模型为例）

| 方式 | 基座模型 | 梯度 + 优化器 | LoRA 层 | 总计 |
|------|---------|-------------|---------|------|
| Full FT (FP16) | 14 GB | 28 GB | 0 GB | ~56 GB |
| LoRA (FP16) | 14 GB | ~2 GB | ~0.5 GB | ~16 GB |
| QLoRA (NF4) | 3.5 GB | ~2 GB | ~0.5 GB | ~6 GB |

### 推理显存（不需要优化器状态）

| 模型大小 | FP16 | INT8 | INT4/NF4 |
|---------|------|------|---------|
| 7B | 14 GB | 7 GB | 3.5 GB |
| 13B | 26 GB | 13 GB | 6.5 GB |
| 34B | 68 GB | 34 GB | 17 GB |
| 70B | 140 GB | 70 GB | 35 GB |
| 120B | 240 GB | 120 GB | 60 GB |

### 看看你能跑什么

| 你的硬件 | FP16 可推理 | 4-bit 可推理 | LoRA 可训练 | QLoRA 可训练 |
|---------|-----------|------------|-----------|------------|
| MacBook (16GB) | ❌ | 7B ✅ | ❌ | 7B ✅ |
| RTX 3060 (12GB) | ❌ | 7B ✅ | ❌ | 7B ✅ |
| RTX 3090 (24GB) | 7B ✅ | 13~34B ✅ | 7B ✅ | 13B ✅ |
| RTX 4090 (24GB) | 7B ✅ | 13~34B ✅ | 7B ✅ | 13B ✅ |
| A100 (80GB) | 34B ✅ | 70B ✅ | 13B ✅ | 70B ✅ |

> **对于 AI PM 来说，这条信息最关键**：如果你的团队只有 RTX 3090/4090（单卡 24GB），用 QLoRA 可以微调 13B 模型，推理 34B 模型。

---

## 8. 什么时候用 QLoRA vs LoRA vs Full FT

### 决策流程

```
你有多少 GPU 显存？
├── 24GB 以上 → 能跑 LoRA（7B~13B）
├── 12~24GB → QLoRA 是主力方案
├── 8~12GB → 只能 QLoRA 微调小模型
└── 6~8GB → QLoRA 微调 1.5B~3B 模型
```

### 三种方式的选择标准

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 数据量大（10万+） | Full FT 或 LoRA | QLoRA 训练慢，数据多时不值得 |
| 需要极致效果 | Full FT | 理论上上限最高 |
| 消费级显卡（24GB 以下） | QLoRA | 这是唯一选项 |
| 快速实验 / 迭代 | LoRA 或 QLoRA | 训练快、成本低 |
| 效果要求不高 / Demo | QLoRA | 够用且最省钱 |
| 70B+ 模型微调 | QLoRA | 全参数微调成本极高 |

### 一个经验法则

> - 有 A100 → 用 LoRA 或 Full FT
> - 有 RTX 3090/4090 → 用 QLoRA 微调 13B，用 LoRA 微调 7B
> - 只有笔记本 → 用 QLoRA 微调 1.5B~3B
> - 部署时 → 能量化就量化，用户不在乎 1% 的准确率差异

---

## 9. 量化方法：GPTQ、AWQ、GGUF、bitsandbytes

市场上有多种量化方法，它们的目标相同（降低精度），但方式不同。

### 四种主流方法

| 方法 | 特点 | 最适合 | 支持精度 |
|------|------|-------|---------|
| **GPTQ** | 基于层校准，一次量化 | GPU 推理 | 4bit, 8bit |
| **AWQ** | 感知权重的重要性，保护关键层 | GPU 推理 | 4bit |
| **GGUF** | CPU/混合推理，轻量格式 | CPU / MacBook / 边缘设备 | 2~8bit |
| **bitsandbytes** | 训练时量化，NF4 | 训练（QLoRA） | 4bit, 8bit |

### GPTQ

**谁在用**：大部分 Hugging Face 量化模型

**原理**：逐层量化，用一小批校准数据（calibration data）找出最优量化参数。

```python
# GPTQ 量化模型加载示例
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained(
    "TheBloke/Llama-2-7B-GPTQ",
    device_map="auto"
)
```

**优点**：效果好，速度快
**缺点**：需要 GPU 运行，量化过程较慢

### AWQ

**谁在用**：追求高 4bit 质量

**原理**：不是所有参数都一样重要。AWQ 识别"重要通道"（salient channels），对这些通道保留更高精度。

```
常规 4bit：所有参数一刀切 → 质量损失较大
AWQ 4bit：重要参数 ≈ INT8，次要参数 ≈ INT4 → 总精度更高
```

**特点**：在 4bit 精度下，AWQ 通常比 GPTQ 质量更好。

### GGUF

**谁在用**：llama.cpp、Ollama、LM Studio——几乎所有本地推理工具

**原理**：专为 CPU/边缘设备设计。把模型打包成一个文件，支持多种量化级别。

```
模型名示例：Llama-3.2-3B-Instruct-Q4_K_M.gguf
                                    │
                                    └── Q4_K_M = 4bit 中等量化
```

GGUF 的各种量化后缀：

| 后缀 | 含义 | 文件大小缩水 |
|------|------|------------|
| Q2_K | 2bit | 最极端的压缩 |
| Q3_K_S/M/L | 3bit | 小/中/大 | 
| Q4_K_S/M/L | 4bit | 小/中/大（最常见） |
| Q5_K_S/M/L | 5bit | 体积略大 |
| Q6_K | 6bit | 接近无损 |
| Q8_0 | 8bit | 几乎无损 |

> 对普通用户，GGUF + Ollama = 在 MacBook 上跑任何模型的最简单方式。

### bitsandbytes

**谁在用**：QLoRA 训练、Hugging Face Transformers

**原理**：运行时即时量化，不需要预先处理。

```python
# bitsandbytes 量化加载 — 训练/推理时即时量化
from transformers import BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",      # NF4 量化
    bnb_4bit_compute_dtype=torch.bfloat16,  # 计算用 BF16
    bnb_4bit_use_double_quant=True,  # 双重量化
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-8B",
    quantization_config=bnb_config,
    device_map="auto",
)
```

**特点**：最方便的量化方案——一行代码搞定。但只适合 Hugging Face 生态。

---

## 10. 实用权衡：质量 vs 速度/内存

### 量化质量损失有多严重？

取决于模型大小、任务难度和量化精度。

**实验数据（基于 Llama 系列）**：

| 精度 | 推理速度 | 内存占用 | 模型质量（MMLU） | 实际体验 |
|------|---------|---------|----------------|---------|
| FP16 | 1x (基准) | 100% | 100% (基准) | 完美 |
| INT8 | ~1.3x | 50% | 99.5% | 几乎一样 |
| INT4 (GPTQ) | ~1.5x | 25% | 98~99% | 几乎没区别 |
| NF4 (bitsandbytes) | ~0.8x* | 25% | 97~98% | 可能略差 |
| INT2 (GGUF Q2) | ~2x | 12.5% | 90~95% | 能感知到变笨 |

> *bitsandbytes 的 4bit 推理略慢（因为需要反量化），但训练时反过来更省显存。

### 影响量化质量的因素

| 因素 | 影响 |
|------|------|
| 模型越大，量化损失越小 | 70B 4bit 几乎不掉分，但 1.5B 4bit 明显变笨 |
| 任务越简单，损失越小 | 问答几乎无影响，数学推理可能出更多错 |
| 关键通道保护（AWQ） | 比均匀量化的 4bit 高 1~2% |
| 校准数据质量 | 好的校准数据 = 更好的量化结果 |

### 一条实用建议

> **大模型用 4bit（如 70B → 4bit），小模型用 8bit（如 7B → INT8）。越大越适合量化。**

---

## 11. 在消费级硬件上运行量化模型

### 方案 1：MacBook + Ollama（最简单）

对所有 MacBook 用户最友好的方案。

```bash
# 安装 Ollama
brew install ollama

# 拉取 7B 模型（量化 GGUF）
ollama pull llama3.2:8b

# 运行
ollama run llama3.2:8b

# 拉取 34B 模型——只需要 18GB 内存
ollama pull llama3.2:34b-instruct-q4_K_M
```

**硬件要求**：

| MacBook 配置 | 可跑模型 |
|-------------|---------|
| 8GB 内存 | 7B 以下（Q4量化） |
| 16GB 内存 | 7B~13B（Q4） |
| 24GB 内存 | 13B~34B（Q4） |
| 32GB+ 内存 | 70B（Q3/Q4） |

### 方案 2：RTX 3090 / 4090 + LM Studio

24GB 显存能做很多事情。

| 精度 | 可推理模型 |
|------|-----------|
| FP16 | 7B 最大 |
| INT8 | 13B |
| INT4/GPTQ | 34B |
| GGUF Q3/Q4 | 70B（部分层卸载到 CPU） |

```bash
# 用 llama.cpp 运行 34B 4bit 模型
./llama-server \
  -m llama-3.2-34b-instruct-q4_K_M.gguf \
  -ngl 41 \        # 所有层放 GPU
  --port 8080
```

### 方案 3：RTX 3090 + QLoRA 微调

| 模型大小 | QLoRA 训练 | 单 batch 大小 |
|---------|-----------|-------------|
| 7B | ✅ 轻松 | 4~8 |
| 13B | ✅ 可行 | 2~4 |
| 34B | ❌ 困难 | 1 |
| 70B | ❌ 不可能 | - |

### 完整的 QLoRA 微调代码

```python
from transformers import (
    AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig,
    TrainingArguments, Trainer
)
from peft import LoraConfig, get_peft_model
import torch

# Step 1: 配置 4bit 量化
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# Step 2: 加载量化模型
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-8B",
    quantization_config=bnb_config,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-8B")

# Step 3: 配置 LoRA
lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
)

model = get_peft_model(model, lora_config)

# Step 4: 训练参数
training_args = TrainingArguments(
    output_dir="./qlora-output",
    per_device_train_batch_size=4,
    gradient_accumulation_steps=2,
    learning_rate=2e-4,
    num_train_epochs=3,
    logging_steps=25,
    save_strategy="steps",
    save_steps=100,
    fp16=True,
)

# Step 5: 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
)
trainer.train()

# Step 6: 保存 LoRA 权重（只有几十 MB）
model.save_pretrained("./qlora-adapter")
```

> 以上代码在 RTX 3090（24GB）上可以微调 13B 模型。

---

## 12. 本课总结

- **量化** = 降低模型参数精度，用更少内存存储和计算
- 量化后模型体积缩小 **2~8 倍**，速度提升 **1.5~2 倍**，质量下降很小
- **NF4** 是专门为神经网络优化的 4 位精度，QLoRA 的核心
- **QLoRA** = NF4 量化 + LoRA + 双重量化，让你在消费级显卡上微调大模型
- 7B QLoRA 只需要 **~6GB 显存**，MacBook 和 RTX 3060 都能跑
- 四种量化方法：**GPTQ**（GPU推理）、**AWQ**（高质量4bit）、**GGUF**（CPU/边缘）、**bitsandbytes**（QLoRA训练）
- **大模型量化损失小，小模型量化损失大**——越大越适合量化

---

## 13. 心智模型

> 量化就像把一张超高分辨率照片压缩成 JPEG。

原始照片（FP32）有几千兆，但你在手机上根本看不出 JPEG 和原图的区别。压缩后，你的手机存储空间省了很多，打开速度也更快。

但如果你是专业摄影师，需要在大屏幕上精细修图——那还是得用无损格式（Full FT / FP16）。

QLoRA 就是在 JPEG 照片上**再叠加一层手绘图层**（LoRA 层），图层本身是高清的，所以修改质量接近在原始照片上直接编辑。

---

## 14. 初学者常见错误

### 错误 1：以为量化后模型一定变差

❌ FP16 模型 > INT8 > INT4 > INT2，精度越低质量越差。

✅ 对大模型来说，INT8 几乎无损，INT4 损失极小。在很多任务上你根本感觉不到差别。

### 错误 2：用小模型做 4bit 量化

❌ 对 1.5B 模型做 INT4 量化 → 模型智商暴跌。

✅ 1.5B 模型用 INT8 或不动；70B 模型用 INT4。**模型越大，量化损失越小**。

### 错误 3：用 QLoRA 训练时不配 LoRA 层

❌ 只加载了 4bit 基座模型，没加 LoRA 层就训练——改了量化后的参数，效果极差。

✅ QLoRA = 量化基座 + LoRA 层，**只训练 LoRA 层**。

### 错误 4：混淆量化格式

❌ "我在 Hugging Face 上看到了一个 GPTQ 模型，下载了 GGUF 版本，用不了。"

✅ 不同格式不兼容：GPTQ → Transformers / vLLM；GGUF → llama.cpp / Ollama；bitsandbytes → Transformers 训练。

---

## 15. 小练习

1. 去 Hugging Face 搜索 `TheBloke` 的量化模型，找 3 个不同版本的 Llama-3.2-8B（GPTQ、AWQ、GGUF）
2. 对比它们的文件大小（GPTQ ~4.5GB、GGUF Q4 ~4.5GB、GGUF Q2 ~2.5GB）
3. 用 Ollama 本地跑一次 7B GGUF 模型，写一段话总结推理速度
4. 用 transformers + bitsandbytes 加载一个 4bit 模型，查看显存占用
5. 在 RTX 3090 上用 QLoRA 微调一个 7B 模型，记录训练前后的显存差异

---

## 16. 小项目

完整跑一次 QLoRA 微调 + 推理：

**任务**：在 RTX 3090（24GB）上微调一个 13B 模型，让模型学会用中文回答技术问题。

**步骤**：

1. 安装库

```bash
pip install transformers datasets peft accelerate bitsandbytes torch
```

2. 准备 100 条 QA 数据

```json
{
  "instruction": "什么是 Transformer 的注意力机制？",
  "output": "Attention 机制让模型在生成输出时，关注输入序列中不同位置的关系。"
}
```

3. 用 bitsandbytes 4bit 加载模型

```python
model = AutoModelForCausalLM.from_pretrained(
    "NousResearch/Hermes-2-Pro-Mistral-7B",
    quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4"),
    device_map="auto",
)
```

4. 附加 LoRA 层

```python
lora_config = LoraConfig(r=8, lora_alpha=16, target_modules=["q_proj", "v_proj"])
```

5. 训练 1 个 epoch，记录显存使用

6. 保存 LoRA 权重，推理测试

7. 写一段话总结：

**使用 QLoRA 时显存占用是多少？训练后的模型与基线相比效果如何？如果换成更大量化（INT4 换成 INT8），显存和效果有何变化？**

---

## 下一课

[第 13 课：Checkpoint、Adapter 和 GGUF](./13-checkpoint-adapter-gguf)
