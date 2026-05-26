# 第 13 课：Checkpoint、Adapter 和 GGUF

> 本课目标：理解模型训练后产生的各种文件——checkpoint、adapter 权重、不同格式（safetensors、GGUF）——以及它们之间怎么转换、怎么部署。

---

## 1. 先说结论

当你训练或微调一个 LLM，最终得到的不是"一个文件"，而是一堆文件。

这些文件包括：

- 模型权重文件（模型的实际"大脑"）
- 配置文件（描述模型是什么结构）
- 分词器文件（告诉模型怎么切词）
- Adapter 文件（LoRA 微调产生的小文件）
- 优化器状态（训练中间状态，推理不需要）

**不同的文件格式影响了你怎么保存、加载、转换和部署模型。**

关键概念一览：

| 概念 | 一句话 |
|------|--------|
| Checkpoint | 训练过程中某个时间点保存的模型完整状态 |
| Adapter | LoRA 微调产生的轻量权重文件（几十 MB） |
| safetensors | 安全、快速的模型权重格式（新标准） |
| bin（PyTorch） | PyTorch 原生权重格式（旧标准） |
| GGUF | 针对 CPU/本地推理优化的打包格式 |
| 合并（merge） | 把 adapter 权重写进基础模型，变成一个新模型 |

> **核心区别**：Checkpoint 是训练过程的"快照"，Adapter 是微调后的"补丁"，GGUF 是部署用的"打包成品"。

---

## 2. 生活类比

### 类比 1：做菜

你有一个**基础模型**，就像一块**生鸡胸肉**。

**训练一个 checkpoint**，就像你每隔 5 分钟拍一张鸡肉的照片：
- checkpoint-100 = 鸡肉刚下锅
- checkpoint-500 = 鸡肉半熟
- checkpoint-1000 = 鸡肉刚好，火候完美
- checkpoint-2000 = 鸡肉老了

最后你选 checkpoint-1000 来用。

**Adapter（LoRA 权重）**，就像你在鸡肉上刷的**秘制酱料配方**。
- 酱料本身很小（葱姜蒜的比例）
- 你可以刷在鸡胸肉上，也可以刷在牛肉上
- 你可以换不同的酱料，肉不变

**GGUF 格式**，就像**一整份打包好的盒饭**：
- 鸡肉 + 酱料 + 米饭 + 配菜全部装一起
- 你拿到就可以直接吃

### 类比 2：乐高

- **基础模型** = 一套基础乐高（很多块）
- **Adapter** = 一小包补充零件（几块特殊砖）
- **完整模型** = 基础乐高 + 补充零件，拼好了一个完整作品
- **GGUF** = 拼好的作品被真空封装，可以直接放展示柜

---

## 3. 什么是 Checkpoint？

### 训练中的快照

训练模型不是一蹴而就的。你要跑很多步（steps）。

**Checkpoint 就是每隔 N 步保存一次模型的完整状态。**

```
Step 0     → 随机初始化的模型
Step 100   → 保存 checkpoint-100
Step 200   → 保存 checkpoint-200
...
Step 1000  → 保存 checkpoint-1000（验证 loss 最低！）
Step 1100  → 保存 checkpoint-1100
...
Step 2000  → 保存 checkpoint-2000（过拟合了）
```

最佳模型往往在**验证 loss 最低**的那个 checkpoint，而不是最后一个。

### Checkpoint 包含什么

一个 Hugging Face 训练器的 checkpoint 目录：

```
checkpoint-500/
├── model.safetensors      # 模型权重（最重要的文件）
├── model.safetensors.index.json  # 分片索引
├── config.json            # 模型结构配置
├── training_args.bin      # 训练超参数
├── optimizer.pt           # 优化器状态（可恢复训练）
├── scheduler.pt           # 学习率调度器状态
└── trainer_state.json     # 训练进度（步数、epoch）
```

| 文件 | 说明 | 推理是否需要？ |
|------|------|:---:|
| `model.safetensors` | 模型权重 | ✅ 需要 |
| `config.json` | 模型结构 | ✅ 需要 |
| `tokenizer.json` | 分词器 | ✅ 需要 |
| `optimizer.pt` | 优化器状态 | ❌ 不需要 |
| `scheduler.pt` | 学习率调度 | ❌ 不需要 |
| `training_args.bin` | 训练参数 | ❌ 不需要 |

> **推理只认三个东西**：权重文件、config.json、tokenizer 文件。其他都是训练中间产物。

### 为什么要保存多个 checkpoint

| 原因 | 说明 |
|------|------|
| 对比效果 | 不同 checkpoint 的验证 loss 不同，选最优 |
| 容错 | 训练中途崩了（OOM、断网），可以从最近 checkpoint 继续 |
| 回退 | 发现后面过拟合了，回到前面的 checkpoint |
| 实验对比 | 不同超参数产生的 checkpoint 可以对比 |

---

## 4. 不同模型权重格式

训练完成后，你手里的权重文件可能长这样：

```
模型权重文件/
├── model-00001-of-00004.safetensors  (2GB)
├── model-00002-of-00004.safetensors  (2GB)
├── model-00003-of-00004.safetensors  (2GB)
├── model-00004-of-00004.safetensors  (2GB)
└── model.safetensors.index.json      (分片索引)
```

为什么分成多个文件？因为单个文件超过 2GB 在某些系统上不好处理。

### safetensors vs bin（PyTorch）

这是目前最常见的两种格式。

| 对比 | safetensors | bin（PyTorch） |
|------|------------|---------------|
| 全名 | SafeTensors | PyTorch pickle |
| 安全性 | **安全**（不执行代码） | 不安全（可能含恶意代码） |
| 加载速度 | 快（零拷贝 + 并行加载） | 慢 |
| 是否分片 | ✅ 支持 | ✅ 支持 |
| 社区趋势 | ✅ 新标准 | ❌ 逐渐淘汰 |
| Hugging Face 推荐 | ✅ 推荐使用 | 不推荐 |

> **2024 年起，Hugging Face 默认保存格式已经是 safetensors 了。** 你基本不会再需要手动处理 .bin 文件。

### 为什么 safetensors 更安全

PyTorch 的 `.bin` 文件用 pickle 序列化。

Pickle 的问题：它可以执行任意 Python 代码。

如果有人给你一个恶意的 .bin 文件：

```python
import torch
model = torch.load("malicious.bin")  # 可能执行恶意代码！
```

safetensors 只保存纯张量数据，不保存代码，从根本上杜绝了这个问题。

---

## 5. 什么是 Adapter 文件？

当你用 LoRA 微调模型时，**基础模型的参数没有被修改**。

你得到的是一个很小的 Adapter 权重文件。

### Adapter 目录结构

```
lora-adapter/
├── adapter_config.json     # LoRA 配置（rank, alpha, target_modules）
├── adapter_model.safetensors  # LoRA 权重（通常只有几十 MB）
└── README.md               # 说明文件
```

| 文件 | 说明 |
|------|------|
| `adapter_config.json` | 记录了 rank、alpha、target_modules 等信息 |
| `adapter_model.safetensors` | 真正的 LoRA 权重（很小的矩阵） |
| `README.md` | 可选，说明这个 adapter 是做什么的 |

### Adapter 有多小？

| 基础模型 | 基础模型大小 | LoRA Adapter 大小 | 比例 |
|---------|------------|------------------|:----:|
| 1.5B | ~3 GB | ~5 MB | 0.17% |
| 7B | ~14 GB | ~20 MB | 0.14% |
| 13B | ~26 GB | ~30 MB | 0.12% |
| 70B | ~140 GB | ~80 MB | 0.06% |

> **一个 7B 模型的 LoRA adapter 只有 20MB，跟一张手机照片差不多大。**

这就是 LoRA 的工程魅力：
- 训练快
- 存储小
- 切换方便
- 部署灵活

---

## 6. 怎么加载 Adapter？

Adapter 需要和**基础模型搭配使用**。

### 推理时加载

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 1. 加载基础模型
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct"
)
tokenizer = AutoTokenizer.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct"
)

# 2. 在基础模型上加载 adapter
model = PeftModel.from_pretrained(
    base_model,
    "./my-lora-adapter"  # adapter 目录
)

# 3. 正常用
inputs = tokenizer("你好", return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=50)
```

### 多个 Adapter 切换

因为基础模型是固定的，你可以**动态切换 adapter**：

```python
# adapter A：客服风格
model.load_adapter("./customer-service-adapter")

# adapter B：代码风格
model.load_adapter("./code-assistant-adapter")

# adapter C：翻译风格
model.load_adapter("./translation-adapter")
```

想象一下：你只需要一份基础模型，搭配 N 个 20MB 的小 adapter，就能服务 N 种不同风格的任务。

> **这是生产环境中 LoRA 的一大优势。** 不用为每个任务部署一个完整模型。

---

## 7. 什么是 GGUF？

GGUF 是 **GPT-Generated Unified Format** 的缩写。

它是 llama.cpp 项目推出的模型格式，专门为**本地推理**设计。

### 为什么 GGUF 这么流行？

| 原因 | 说明 |
|------|------|
| **打包成一个文件** | 所有内容（权重 + config + tokenizer）在一个 .gguf 文件里 |
| **支持量化** | 原生支持 2bit~8bit 量化，模型可以缩小到原来的 1/4 ~ 1/8 |
| **CPU 友好** | 纯 CPU 也能跑，不强制需要 GPU |
| **跨平台** | macOS（Apple Silicon）、Windows、Linux 都能跑 |
| **工具链成熟** | Ollama、LM Studio、llama.cpp 都原生支持 GGUF |

### GGUF 和原始 HF 格式对比

| 对比 | HF（safetensors） | GGUF |
|------|------------------|------|
| 文件数 | 多个文件（权重 + config + tokenizer） | **1 个文件** |
| 大小（7B q4_K_M） | ~14 GB（FP16） | ~4.5 GB（4bit 量化） |
| 加载速度 | 快（需 GPU） | 慢但通用（CPU 也能跑） |
| GPU 需要 | 需要 NVIDIA GPU | 可选（CPU/GPU 都行） |
| 量化支持 | 需要额外工具 | **原生支持** |
| 谁在用 | 训练、微调、部署 | 本地运行、Ollama |
| 典型场景 | 用 GPU 做推理服务 | 个人电脑、Mac 上跑 |

### GGUF 文件命名说明

你在 Hugging Face 或 Ollama 下载 GGUF 文件时，名字通常长这样：

```
Qwen2.5-7B-Instruct-Q4_K_M.gguf
```

- `Q4` = 4bit 量化
- `K_M` = 量化方法（K_M 是中间档，平衡大小和质量）
- 常见的量化级别：

| 标识 | 说明 | 大小（7B 模型） | 质量损失 |
|------|------|:-------------:|:--------:|
| Q2_K | 最小 | ~2.7 GB | 明显 |
| Q3_K_M | 较小 | ~3.3 GB | 轻微 |
| Q4_K_M | **最推荐** | ~4.5 GB | 几乎无感 |
| Q5_K_M | 高精度 | ~5.5 GB | 极微小 |
| Q6_K | 更高精度 | ~6.5 GB | 几乎无损 |
| Q8_0 | 几乎无损 | ~8.5 GB | 可忽略 |

> **对多数人来说，Q4_K_M 是最佳选择**——大小合理，质量损失几乎察觉不到。

---

## 8. 模型文件完整结构

不管什么格式，一个完整可用的模型必须包含四类文件。

### Hugging Face 格式（最常见）

```
模型目录/
├── config.json                 # 模型结构配置（必须）
├── tokenizer.json              # 分词器数据（必须）
├── tokenizer_config.json       # 分词器配置（必须）
├── model.safetensors           # 权重（可能分片）
├── model.safetensors.index.json  # 分片索引
├── special_tokens_map.json     # 特殊 token 映射
├── generation_config.json      # 推理默认参数
├── added_tokens.json           # 额外添加的 token
└── README.md                   # 模型说明
```

### config.json 里面有什么？

```json
{
  "model_type": "qwen2",
  "hidden_size": 3584,
  "num_hidden_layers": 28,
  "num_attention_heads": 28,
  "num_key_value_heads": 4,
  "intermediate_size": 18944,
  "vocab_size": 152064,
  "max_position_embeddings": 32768,
  "torch_dtype": "bfloat16"
}
```

关键字段：

| 字段 | 说明 | 影响 |
|------|------|------|
| `hidden_size` | 每层的向量维度 | 越大模型越大 |
| `num_hidden_layers` | 有多少层 Transformer | 层数越多推理越慢 |
| `num_attention_heads` | 注意力头数 | 影响并行计算 |
| `vocab_size` | 词表大小 | 决定 tokenizer 的规模 |
| `max_position_embeddings` | 最大上下文长度 | 限制模型能处理多长的输入 |
| `torch_dtype` | 默认精度 | float16 / bfloat16 |

> **config.json 是模型结构的"身份证"。** 没有它，加载时模型甚至不知道自己是几层、几头。

### 为什么分片？

一个 70B 模型在 FP16 下大约 140GB。

如果保存成单个文件：加载 140GB 文件需要极多内存，而且传输困难。

所以 Hugging Face 自动分片：

```
model-00001-of-00060.safetensors  (~2.3GB)
model-00002-of-00060.safetensors  (~2.3GB)
...
model-00060-of-00060.safetensors  (~2.3GB)
```

加载时无需手动处理，Hugging Face 自动拼接：

```python
model = AutoModelForCausalLM.from_pretrained("模型路径")
# 自动读取 index.json，自动加载所有分片
```

---

## 9. 格式之间的转换

### 场景 1：HF → GGUF（最常用）

你在 Hugging Face 上下载了一个模型，但想用 Ollama 或 llama.cpp 在本地运行。

```bash
# 安装 llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# 安装 Python 依赖
pip install -r requirements.txt

# 转换：从 Hugging Face 格式 → GGUF
python convert_hf_to_gguf.py \
    --outfile Qwen2.5-7B-Instruct-Q4_K_M.gguf \
    --outtype q4_K_M \
    ../../models/Qwen2.5-7B-Instruct/
```

这个过程：
1. 读取 Hugging Face 格式模型目录
2. 加载所有 safetensors 分片
3. 合并权重
4. 应用量化（q4_K_M）
5. 打包成单个 .gguf 文件

### 场景 2：LoRA Adapter → 合并到基础模型

你训练了一个 LoRA adapter，但想把它变成**一个完整的模型**。

为什么需要合并？

| 场景 | 是否需要合并 |
|------|:-----------:|
| 用 PEFT 库动态加载 adapter | ❌ 不需要 |
| 部署到 Ollama / llama.cpp / vLLM | ✅ 需要合并 |
| 分发给别人用 | ✅ 需要合并 |
| 转成 GGUF | ✅ 需要先合并 |
| 自己调试对比 | ❌ 不需要 |

```python
from transformers import AutoModelForCausalLM
from peft import PeftModel

# 1. 加载基础模型
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-7B-Instruct",
    torch_dtype="bfloat16"
)

# 2. 加载 adapter
model = PeftModel.from_pretrained(
    base_model,
    "./my-lora-adapter"
)

# 3. **合并**：把 LoRA 权重写进基础模型
merged_model = model.merge_and_unload()

# 4. 保存成完整模型
merged_model.save_pretrained(
    "./my-merged-model",
    safe_serialization=True  # 保存为 safetensors
)
```

合并后，目录结构变成普通 Hugging Face 格式：

```
my-merged-model/
├── config.json
├── model.safetensors
├── tokenizer.json
├── tokenizer_config.json
└── special_tokens_map.json
```

### 场景 3：合并 + 转换（全流程）

```
训练 LoRA → 合并 → 转 GGUF → 部署到 Ollama
```

```bash
# Step 1: 用 Python 合并（见上面代码）
# Step 2: 转换 GGUF
python convert_hf_to_gguf.py \
    --outfile my-merged-model-Q4_K_M.gguf \
    --outtype q4_K_M \
    ./my-merged-model/

# Step 3: 放入 Ollama 模型目录
mv my-merged-model-Q4_K_M.gguf ~/.ollama/models/blobs/
```

---

## 10. 存储考量：不同格式的大小对比

以 **7B 模型**为例：

| 格式 | 量化 | 文件数量 | 总大小 | 适合场景 |
|------|:----:|:-------:|:------:|---------|
| HF safetensors (FP16) | 无 | ~7 个文件 | ~14 GB | GPU 推理/训练 |
| HF safetensors (FP32) | 无 | ~7 个文件 | ~28 GB | 训练（不推荐） |
| GGUF Q2_K | 2bit | 1 个文件 | ~2.7 GB | 低端设备 |
| GGUF Q4_K_M | 4bit | 1 个文件 | ~4.5 GB | **最佳平衡** |
| GGUF Q8_0 | 8bit | 1 个文件 | ~8.5 GB | 高精度本地推理 |
| LoRA Adapter | - | 2 个文件 | ~20 MB | 微调产物 |

以 **70B 模型**为例：

| 格式 | 总大小 | 能跑在什么设备上 |
|------|:-----:|----------------|
| HF FP16 | ~140 GB | 多卡 A100 集群 |
| GGUF Q4_K_M | ~40 GB | 单张 A100 / Mac Studio 128GB |
| GGUF Q2_K | ~25 GB | Macbook Pro M3 Max |

> **关键规律**：量化等级每降一档，内存/硬盘需求减半左右。

---

## 11. 实用工具

### huggingface-cli

下载 Hugging Face 模型：

```bash
# 下载整个模型目录
huggingface-cli download Qwen/Qwen2.5-7B-Instruct \
    --local-dir ./models/Qwen2.5-7B-Instruct

# 只下载 GGUF 文件
huggingface-cli download Qwen/Qwen2.5-7B-Instruct-GGUF \
    --local-dir ./models/Qwen2.5-7B-GGUF \
    --include "*-Q4_K_M.gguf"
```

### llama.cpp 转换工具链

| 工具 | 作用 |
|------|------|
| `convert_hf_to_gguf.py` | HF 格式 → GGUF |
| `convert_llama_ggml_to_gguf.py` | 旧 GGML → 新 GGUF |
| `quantize` | 量化已经转好的 GGUF 文件 |

```bash
# 先转成 FP16 GGUF
python convert_hf_to_gguf.py \
    --outfile model-fp16.gguf \
    --outtype f16 \
    ./model-dir/

# 再量化
./quantize model-fp16.gguf model-Q4_K_M.gguf q4_K_M
```

### 查看 GGUF 文件信息

```bash
# 用 llama.cpp 的 infill 命令
./llama-cli --model model.gguf --in-file /dev/null --n-predict 0

# 或者用 Python
pip install gguf
python -c "
from gguf import GGUFReader
reader = GGUFReader('model.gguf')
print(f'Architecture: {reader.fields[\"general.architecture\"].parts[0].decode()}')
print(f'Parameter count: {reader.fields[\"general.file_type\"]}')
"
```

---

## 12. 完整工作流

从训练到部署，一个典型的微调项目路径：

```
Step 1: 训练 LoRA
│
├── 准备数据
├── 用 Unsloth / TRL 训练 LoRA
├── 保存 adapter → ./my-lora-adapter/
│
Step 2: 合并（如果需要部署到 Ollama）
│
├── 加载基础模型
├── 加载 adapter
├── merge_and_unload()
├── 保存完整模型 → ./my-merged-model/
│
Step 3: 转换 GGUF（如果想在本地跑）
│
├── convert_hf_to_gguf.py
├── 量化 → my-model-Q4_K_M.gguf
│
Step 4: 部署
│
├── 方案 A：Ollama
│   ├── 创建 Modelfile
│   ├── ollama create my-model -f Modelfile
│   └── ollama run my-model
│
├── 方案 B：llama.cpp 直接跑
│   └── ./llama-cli -m my-model-Q4_K_M.gguf -p "你好"
│
├── 方案 C：vLLM（GPU 服务）
│   └── vllm serve ./my-merged-model/
│
└── 方案 D：Hugging Face 推理（GPU）
    ├── 上传到 Hugging Face Hub
    └── 用 Inference API 调用
```

### 快速决策表

| 你的需求 | 推荐方案 |
|---------|---------|
| 只做实验、对比 | 保留 LoRA adapter 即可 |
| 部署到生产 GPU 服务 | 合并 + 上传 HF Hub |
| 部署到个人 Mac / 笔记本 | 合并 + 转 GGUF + Ollama |
| 分享给开源社区 | 上传 adapter + 合并后模型 |
| 压到最小体积 | 转 GGUF Q2_K |
| 质量优先 | HF FP16 或 GGUF Q8_0 |

---

## 13. 存储实践

### 硬盘占用示例

假设你同时在做 5 个微调实验：

```
项目目录/
├── base-model/                    # 基础模型（共用）
│   └── Qwen2.5-7B-Instruct/       → 14 GB
│
├── experiments/
│   ├── exp-1-lora/                → 20 MB（adapter）
│   ├── exp-2-lora/                → 20 MB
│   ├── exp-3-lora/                → 20 MB
│   ├── exp-4-lora/                → 20 MB
│   └── exp-5-lora/                → 20 MB
│
├── merged-models/
│   ├── exp-1-merged/              → 14 GB
│   ├── exp-2-merged/              → 14 GB
│   └── exp-3-merged/              → 14 GB
│
└── gguf-models/
    ├── exp-1-Q4_K_M.gguf          → 4.5 GB
    └── exp-2-Q4_K_M.gguf          → 4.5 GB
```

**关键策略**：

- 基础模型**只存一份**
- 实验阶段：只存 adapter（20 MB），不存合并模型
- 上线阶段：只对要上线的那一版做合并 + 转换
- GGUF 可以根据需要删除，随时可以从 HF 格式再转

> **不要每个实验都保存完整的合并模型**，硬盘会迅速爆炸。5 个实验的合并模型就是 70GB。

---

## 14. 本课总结

- **Checkpoint** = 训练过程中每隔 N 步保存的模型快照，包含权重 + 配置 + 优化器状态
- **safetensors** = 当前推荐的权重格式，安全、快速、支持分片
- **.bin（PyTorch）** = 旧格式，用 pickle 序列化，有安全风险
- **Adapter** = LoRA 微调产物，只有几十 MB，需要搭配基础模型使用
- **GGUF** = 专为本地推理设计的单一文件格式，支持量化、CPU 友好
- **合并（merge）** = 把 LoRA 权重写入基础模型，产生一个完整的新模型
- **HF → GGUF** = 用 llama.cpp 的 convert_hf_to_gguf.py 转换
- **全流程** = 训练 LoRA → 保存 adapter → 合并 → 转 GGUF → 部署到 Ollama
- 存储策略：实验阶段只存 adapter，上线阶段才做合并

---

## 15. 心智模型

> **模型文件就像一套乐高玩具。**

- **基础模型** = 基础套装（几千块积木，占地方）
- **Adapter** = 一小包补充零件（几块钱，不占地方）
- **合并后模型** = 基础套装 + 补充零件拼好后（完整作品）
- **GGUF** = 拼好的作品被真空打包（方便运输、存放）

你在实验阶段可以：
- 多买几包补充零件（不同 adapter）
- 随时换着用
- 不占地方

在上线阶段才：
- 选定一包零件
- 拼到基础套装里
- 真空包装（转 GGUF）
- 送到展示柜（部署）

---

## 16. 初学者常见错误

### 错误 1：混淆 checkpoint 和最终模型

❌ "checkpoint-2000 是最后一步，肯定最好。"

✅ 验证 loss 最低的那个 checkpoint 才是最好的，不一定是最后一个。

### 错误 2：以为 adapter 是独立模型

❌ "我有个 adapter 文件，直接加载出来用。"

✅ Adapter 需要先加载基础模型，再加载 adapter。

### 错误 3：把 .bin 文件直接当成模型文件

❌ "model.bin 就是整个模型。"

✅ 模型需要 config.json 和 tokenizer 文件一起才能用。

### 错误 4：全部实验都保存合并模型

❌ 5 个实验 × 14GB = 70GB，硬盘没了。

✅ 实验阶段只保存 adapter（20MB 每个）。确定上线哪个再做合并 + 转换。

### 错误 5：以为 GGUF 只能用在 CPU

❌ "GGUF 是给慢 CPU 用的。"

✅ GGUF 支持 GPU 加速（通过 llama.cpp 的 Metal/CUDA backend），而且量化后的模型在 GPU 上可能跑得更快。

### 错误 6：直接下载 GGUF 然后想在上面微调

❌ "下载了 GGUF 模型，怎么跑不了训练？"

✅ GGUF 是推理格式，不是训练格式。训练请用 Hugging Face 的 safetensors 格式。

---

## 17. 小练习

1. 在 Hugging Face 上找一个 7B 模型，下载到本地，观察目录结构
2. 用 `llama.cpp` 的 `convert_hf_to_gguf.py` 转成 GGUF，对比文件数量变化
3. 查看 config.json，找到 hidden_size、num_hidden_layers、vocab_size 的值
4. 找一个 LoRA adapter（比如 Hugging Face 上的某个 LoRA 模型），查看 adapter_config.json
5. 用 `peft` 库加载 adapter 到基础模型上，对比加载前后的回答

---

## 18. 小项目

**目标**：完成一次完整的"训练 → 合并 → 转换 → 部署"流程。

**步骤**：

1. 用 Unsloth 或 TRL 对 Qwen2.5-1.5B 做一次 LoRA 微调

```python
from transformers import AutoModelForCausalLM
from peft import PeftModel

# 假设你已经训练好了 adapter
# 现在合并
base_model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen2.5-1.5B-Instruct",
    torch_dtype="float16"
)
model = PeftModel.from_pretrained(base_model, "./my-adapter")
merged = model.merge_and_unload()
merged.save_pretrained("./my-merged-model")
```

2. 使用 llama.cpp 转换 GGUF

```bash
python convert_hf_to_gguf.py \
    --outfile my-model-f16.gguf \
    --outtype f16 \
    ./my-merged-model/

# 量化
./quantize my-model-f16.gguf my-model-Q4_K_M.gguf q4_K_M
```

3. 用 Ollama 部署

```bash
# 创建 Modelfile
echo "FROM ./my-model-Q4_K_M.gguf" > Modelfile

# 创建模型
ollama create my-custom-model -f Modelfile

# 运行
ollama run my-custom-model "讲个笑话"
```

完成后，你就掌握了从训练到部署的完整工具链。

---

## 下一课

[第 14 课：RAG 基础](./14-rag-basics)
