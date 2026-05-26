# 第 11 课：LoRA 和 Adapter Tuning

> 本课目标：理解什么是 LoRA，为什么它让微调变得"人人都能负担"，以及如何用 LoRA 在不修改大模型全部参数的前提下，低成本地定制模型行为。

---

## 1. 先说结论

微调大模型（fine-tuning）效果很好，但**成本高得吓人**。

拿 Llama-3-70B 来说，它有 700 亿个参数。如果全部参数都更新，光是保存训练中的状态就需要 300GB+ 显存——相当于 4 张 A100（80GB）GPU。一次训练下来，电费加算力成本轻松上万。

**LoRA（Low-Rank Adaptation，低秩适配）** 完全改变了这件事。

它的核心思想是：

> **不动模型原有的参数，而是在旁边加几块"小积木"，只训练这些积木。**

这些小积木只占原模型参数的 0.1%~1%。最终你得到的不是一个新的大模型，而是一个只有几 MB 到几十 MB 的小文件——**一个 adapter（适配器）**。

想要不同能力？训练不同的 adapter。切换能力就像换积木一样简单。

现在的开源生态中，**99% 的微调都是 LoRA 微调**。全参数微调只有大公司和研究机构才会做。

---

## 2. 生活类比

### 类比 1：给房子装修

**全参数微调（Full Fine-Tuning）** = 把房子拆了重建。

你改了承重墙、换了地基、重新布线。装修完，房子确实变成了你想要的风格——但整个过程又贵又慢，还要搬家，而且再也回不到原来的样子了。

**LoRA** = 直接在墙上挂装饰品。

你不需要动任何原结构。今天挂一幅画，明天换个窗帘，后天贴个壁纸。每次改动很小、很快、很便宜。而且想换风格的时候，摘下旧装饰、挂上新装饰就行。

LoRA 训练出的 adapter，就是那块"装饰品"。

### 类比 2：给你的手机装 App

手机出厂时自带操作系统（基础模型）。系统本身很庞大，你不能每天改系统代码。

但你可以装 App（adapter）：

- 装个微信 = 社交能力 adapter
- 装个支付宝 = 支付能力 adapter
- 装个导航 = 路线规划能力 adapter

每个 App 体积很小（几 MB 到几百 MB），互不冲突，想用哪个开哪个。

全参数微调就像你非要自己编译一个定制版操作系统——不是不行，但正常人不会这么干。

---

## 3. LoRA 的核心思想

### 3.1 矩阵的"秩"是什么？

LoRA 的名字里有个关键词——**低秩（Low-Rank）**。

先理解一个概念：**矩阵的秩（rank）**。

矩阵可以理解为一张表格。矩阵的"秩"粗略来说就是这张表格里**独立信息的多少**。

- 高秩矩阵 = 信息密集的表格
- 低秩矩阵 = 信息稀疏的表格，可以用更小的表格来近似

关键发现（来自 LoRA 论文，2021）：大模型微调时，参数的变化量（ΔW）是一个**低秩矩阵**。

什么意思？

> 当你微调大模型时，真正需要"学习的新知识"其实很少。不需要动全部 700 亿参数——只需要在一个很小的子空间里做调整就够了。

### 3.2 LoRA 的具体操作

传统的全参数微调：

```text
原始权重 W（700 亿参数）
         ↓
学习变化量 ΔW（也是 700 亿参数大小）
         ↓
新权重 W_new = W + ΔW
```

每次训练都要计算和存储 700 亿个梯度——极贵。

LoRA 的做法：

```text
原始权重 W → 冻结不动（不更新）

在旁边加两个小矩阵 A 和 B：

W 的形状是 d × d（比如 4096 × 4096）
A 的形状是 d × r（比如 4096 × 8）
B 的形状是 r × d（比如 8 × 4096）

其中 r 远小于 d（r = 8、16、64 等）

A × B 的结果形状也是 d × d，和 W 一样

最终计算：h = Wx + ABx
           ↑原始  ↑新增的 LoRA 分支
```

AB 两个小矩阵加起来才 `d×r + r×d = 2×d×r` 个参数，而原矩阵有 `d×d` 个参数。

当 d=4096, r=8 时：

- 原矩阵：4096 × 4096 ≈ 1678 万个参数
- LoRA 矩阵：4096×8 + 8×4096 ≈ 6.5 万个参数
- **减少到约 0.4%**

### 3.3 训练完以后

训练完成后，你**不保存原模型的任何参数**（因为它们没变化）。

你只保存 A 和 B 这两个小矩阵——这就是一个 **adapter（适配器文件）**。

使用时，要么把 AB 合并回 W（推理时无额外开销），要么在推理时动态计算 Wx + ABx。

> 两种方式推理速度几乎一样，但都只占极少的额外存储。

---

## 4. LoRA 的三个关键超参数

### 4.1 Rank（秩，r）

这是最重要的参数。它决定了 LoRA 的"容量"。

| r 值 | 效果 | 适用场景 |
|------|------|---------|
| r = 1~4 | 极轻量调整，容量小 | 简单风格迁移，小规模数据 |
| r = 8~16 | 平衡的默认值 | 大多数微调任务（推荐） |
| r = 32~64 | 容量较大 | 复杂任务、数据量较大时 |
| r = 128+ | 接近全微调容量 | 领域适配，但显存需求也上升 |

经验法则：

- 先试 r=8，看效果
- 如果模型学得不够好，把 r 翻倍试试
- r 不是越大越好——r 太大可能让 LoRA 退化（反而不如小 r）

### 4.2 Alpha（α）

LoRA 的计算公式：

```text
h = Wx + (α / r) × ABx
```

α 控制 LoRA 分支的**缩放比例**。α/r 是缩放系数。

- α 越大，LoRA 分支的贡献越大，学习速度越快
- α 太小，模型可能学不动

常见设置：

- 如果 r=8，α 常用 16 或 32（α/r = 2~4）
- 如果 r=16，α 常用 16 或 32（α/r = 1~2）
- 一般建议 α = 2r

不必太纠结这个参数。大部分框架有默认值，效果差异不大。

### 4.3 Target Modules（目标模块）

LoRA 不需要加到模型的所有层上。你可以选择"给模型的哪些部分加小积木"。

大模型的 Transformer 中有这些主要模块：

| 模块 | 含义 | 是否推荐 LoRA |
|------|------|-------------|
| Q (Query) | 查询矩阵 | ✅ 强烈推荐 |
| K (Key) | 键矩阵 | ✅ 推荐 |
| V (Value) | 值矩阵 | ✅ 强烈推荐 |
| O (Output) | 输出投影 | ⚠️ 可选 |
| MLP 层 | 前馈网络 | ⚠️ 可选 |
| Embedding | 词嵌入 | ❌ 很少用 |
| LM Head | 输出头部 | ❌ 很少用 |

实践经验：

- 基础版：只 LoRA 到 Q 和 V
- 进阶版：LoRA 到 Q、K、V、O（效果更好）
- 完整版：再加 MLP 层（效果最好但成本也增加）

```python
# 以 Hugging Face PEFT 为例
from peft import LoraConfig

config = LoraConfig(
    r=16,                       # 秩
    lora_alpha=32,              # 缩放因子
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    # 有些框架也支持 "gate_proj", "up_proj", "down_proj"（MLP 层）
    lora_dropout=0.05,          # 防止过拟合
    bias="none",                # 不训练偏置项
)
```

---

## 5. 什么是 Adapter？

当你训练完 LoRA，得到的是一个很小的权重文件——**adapter**。

### 5.1 Adapter 长什么样？

以 Hugging Face PEFT 为例，训练完成后目录结构：

```text
lora-adapter/
├── adapter_config.json     # 配置信息（r, alpha, target_modules 等）
├── adapter_model.safetensors  # 权重文件（几 MB 到几十 MB）
├── README.md               # 可选
└── tokenizer_config.json   # 可选
```

**对比：**

| | 完整模型 | LoRA Adapter |
|--|---------|-------------|
| 文件大小 | 50GB~300GB | 2MB~100MB |
| 参数量 | 70 亿~7000 亿 | 几百万~几千万 |
| 训练需要 | 多张 GPU | 1 张消费级 GPU |
| 切换成本 | 重新下载几百 GB | 几 MB 到几百 MB |

### 5.2 使用 Adapter

```python
from peft import PeftModel
from transformers import AutoModelForCausalLM

# 1. 加载基础模型（一次加载，永久复用）
base_model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")

# 2. 加载 LoRA adapter
model = PeftModel.from_pretrained(base_model, "./my-lora-adapter")

# 3. 推理（和正常使用完全一样）
output = model.generate("用户：什么是 LoRA？")
```

你可以在同一个基础模型上叠加不同的 adapter：

```python
# 切换成另一个 adapter（秒级完成）
model.load_adapter("./my-other-adapter")

# 或者同时加载多个，切换使用
model.load_adapter("./code-adapter", adapter_name="code")
model.load_adapter("./chat-adapter", adapter_name="chat")

# 推理时选择
model.set_adapter("code")   # 切到代码能力
model.set_adapter("chat")   # 切到聊天能力
```

---

## 6. LoRA 的实际好处

### 6.1 显存节省

| 对比项 | 全参数微调（70B 模型） | LoRA 微调（70B 模型） |
|-------|---------------------|---------------------|
| 需要多少显存 | ~320GB（4 张 A100） | ~80GB（1 张 A100） |
| 梯度存储 | 700 亿个梯度 | 几百~几千万个梯度 |
| 优化器状态（Adam） | 1400 亿个参数 | 几千万个参数 |
| 最小可行 GPU | 8×A100 或 4×H100 | 1×RTX 4090（24GB） |

> **对产品经理来说：** 全参数微调 70B 需要 4 万美元/次（云 GPU），LoRA 只需要几千元。

### 6.2 训练速度

- LoRA 训练速度比全参数微调快 **3~10 倍**
- 因为只更新极少参数，前向和反向传播的计算量都大大减少

### 6.3 存储和分发

- 一个 70B 的全参数微调模型 = 140GB
- 一个对应的 LoRA adapter = 10MB~50MB
- 分发 50MB 文件和分发 140GB 文件的成本不是一个数量级

### 6.4 多能力共存

这是 LoRA 的隐藏优势——**你不用为每个任务保留一个完整模型**。

```text
基础模型（70GB） + LoRA 适配器（每个 50MB）
         ↓
你可以存 100 个 adapter 只占 5GB
而 100 个全微调模型要 7TB
```

---

## 7. 组合多个 LoRA Adapter

### 7.1 场景切换

这是 LoRA 最实用的场景之一：

你有一个客服机器人。

- 早上高峰期，需要**快速回复能力** → 切换到 `fast-reply-adapter`
- 遇到技术问题，需要**专业知识** → 切换到 `tech-support-adapter`
- 用户情绪激动，需要**安抚话术** → 切换到 `empathy-adapter`
- 下班后，变成**闲聊模式** → 切换到 `casual-chat-adapter`

所有这些切换都在同一台服务器上完成，**不需要加载不同的模型**。

### 7.2 LoRA 融合（Merging）

你也可以把多个 adapter 合并到一起：

```python
# 1. 分别训练 code adapter 和 knowledge adapter
# 2. 合并它们
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained("base-model")
model = PeftModel.from_pretrained(base, "code-adapter")
model.add_adapter("knowledge", "knowledge-adapter")

# 合并两个 adapter
model.add_weighted_adapter(
    adapters=["code", "knowledge"],
    weights=[0.7, 0.3],  # 可以调节权重
    combination_type="linear",
    adapter_name="merged"
)
```

这有什么用？微调模型时，你可能在不同阶段、不同数据上训练了不同的 adapter，最后把它们合并成一个"全能 adapter"。

### 7.3 权重插值

你甚至可以混合不同 adapter 的能力比例：

```python
# 80% 写作能力 + 20% 编程能力
model.add_weighted_adapter(
    adapters=["writing", "coding"],
    weights=[0.8, 0.2],
    combination_type="linear",
    adapter_name="writing-plus-code"
)
```

---

## 8. LoRA 变体

LoRA 是 2021 年的工作，之后出现了很多改进版本。这里简要介绍几个重要的：

### 8.1 AdaLoRA（自适应 LoRA）

普通 LoRA 给所有层分配相同的 r（比如都 r=16）。

但实际上一层的"重要程度"是不同的。有些层只需要 r=2 就够，有些层需要 r=64。

**AdaLoRA** 的核心：自动为不同层分配不同的秩。

- 重要层 → 分配更大的 r
- 不重要层 → 分配更小的 r，甚至 r=0（直接关掉）

结果：**在相同总参数量下，效果更好**。因为把"预算"分配到了真正需要的地方。

### 8.2 DoRA（Weight-Decomposed Low-Rank Adaptation）

DoRA 的思路更巧妙。

它先观察全参数微调实际发生了什么变化，发现：

> 全参数微调的改变，可以分解为两部分：
> 1. **方向改变**——投影矩阵旋转
> 2. **幅度改变**——向量长度的缩放

DoRA 把这两部分的训练分开：

- 用 LoRA 学习**方向变化**
- 单独学习一个**幅度向量**

结果是：DoRA 在 r 更小的情况下，能达到和更大 r 的 LoRA 相同的效果。

简单说：**同样的效果，DoRA 用更少的参数**。

### 8.3 QLoRA（量化 LoRA）

这个会在第 12 课详细讲。先知道：

QLoRA = LoRA + 模型量化（4-bit / 8-bit）

效果：一个 70B 模型的全参数微调需要 320GB 显存 → QLoRA 只需要 48GB（1 张 A100 搞定）。

### 8.4 LoRA 变体对比

| 变体 | 核心改进 | 何时使用 |
|------|---------|---------|
| LoRA（标准） | 基础版本 | 大多数场景，推荐第一个试 |
| AdaLoRA | 自动分配 rank | 不知道 r 怎么设时 |
| DoRA | 方向和幅度分开学 | 小 r 想要好效果时 |
| QLoRA | 量化 + LoRA | GPU 不够时（消费级显卡） |
| rsLoRA | 改进初始化方法 | r 很大（>256）时 |

> 作为初学者，**先学标准 LoRA 就够了**。变体是在你遇到具体问题（显存不够、效果不够好）时再研究的。

---

## 9. 什么时候用 LoRA，什么时候需要全参数微调？

### 9.1 LoRA 效果好的场景

| 场景 | 原因 | 建议 |
|------|------|------|
| 风格调整 | 知识没变，表达方式变了 | ✅ LoRA 足够 |
| 格式约束（JSON/代码） | 模式简单，数据充足 | ✅ LoRA 足够 |
| 特定领域术语 | 领域知识可以用已有知识组合 | ✅ LoRA 足够 |
| 对话风格（客服/导师） | 主要是口吻和模式 | ✅ LoRA 足够 |
| 小规模数据（<1000 条） | 全参数会过拟合 | ✅ LoRA 更好 |

### 9.2 LoRA 效果不够，需要全参数微调的场景

| 场景 | 原因 | 建议 |
|------|------|------|
| 学习全新知识 | LoRA 容量有限，学不进新事实 | ⚠️ 尝试大 r 或全参数 |
| 多任务同时学习 | LoRA 的低秩假设可能限制多任务表现 | ⚠️ 考虑大 r 或 DoRA |
| 需要最高的单任务性能 | 竞赛级追求 | ⚠️ 全参数上限更高 |
| 数据量极大（>100 万条） | LoRA 可能成为瓶颈 | ⚠️ 全参数 |
| 非常长的上下文 | LoRA 在长上下文场景下效果可能下降 | ⚠️ 需要验证 |

### 9.3 实际建议

> **先从 LoRA 开始，99% 的情况够用。万一不够，尝试增大 r 或改用 DoRA。全参数微调应该是最后的选择。**

现实中大多数公司：

- 70% 的微调用 LoRA（或 QLoRA）
- 20% 用 QLoRA（因为 GPU 不够）
- 10% 才用全参数（且通常是 7B~13B 的小模型）

---

## 10. 多 Adapter 的工程化

当你有几十个 adapter 需要同时服务时，需要考虑工程架构。

### 10.1 基础方案：加载后切换

```python
# 一个基础模型 + 多个 adapter 轮换
base_model = AutoModelForCausalLM.from_pretrained("base")

# 全在内存中，使用切换
adapters = {
    "customer-service": PeftModel.from_pretrained(base_model, "./cs-adapter"),
    "tech-support": PeftModel.from_pretrained(base_model, "./tech-adapter"),
    "sales": PeftModel.from_pretrained(base_model, "./sales-adapter"),
}

# 请求来了，判断场景后切换
adapters[scene].generate(prompt)
```

优势：切换快（毫秒级）
劣势：所有 adapter 占内存，数量多时压力大

### 10.2 中级方案：按需加载

```python
# adapter 存在磁盘，用时才加载
adapter_paths = {
    "cs": "./adapters/cs",
    "tech": "./adapters/tech",
}

# 请求时动态加载
def serve(scene, prompt):
    base = get_cached_base_model()
    adapter = PeftModel.from_pretrained(base, adapter_paths[scene])
    return adapter.generate(prompt)
```

优势：内存低
劣势：每次加载有几秒延迟

### 10.3 高级方案：Punica / S-LoRA 架构

这是一种专门为多 adapter 设计的推理系统：

- 基础模型常驻 GPU
- adapter 按需从 CPU 拷贝到 GPU 内存
- 同一个 Batch 里可以混合多个 adapter 的请求

简单来说：

```text
请求 A（场景：客服）      \
请求 B（场景：技术）       →  同一批处理，不同 adapter
请求 C（场景：技术）      /
         ↓
GPU 同时加载了客服和技术两个 adapter
一次性处理 A、B、C 三个请求
```

这种架构适合大规模的 SaaS 服务——比如一个企业 SaaS 有 1000 个租户，每个租户一个 adapter，但仍然可以在同一批 GPU 中高效运行。

---

## 11. 本课总结

- **LoRA** 是给大模型微调时，不加修改原参数，在旁边挂上"小积木"（低秩矩阵）来学习新能力的方法
- LoRA 的核心是**低秩分解**——两个小矩阵 A×B 近似替代一个巨大的 ΔW
- LoRA 的三大超参数：**r**（容量大小）、**α**（缩放比例）、**target_modules**（作用在哪层）
- 训练完成后得到的是很小的 **adapter 文件**（几 MB~几十 MB），不是完整的大模型
- LoRA 的好处：**显存省 3~10 倍、训练快 3~10 倍、存储省 1000+ 倍**
- 多个 adapter 可以**共存和切换**，甚至可以按照权重合并
- 变体：**AdaLoRA**（自动分配 r）、**DoRA**（方向和幅度分开）、**QLoRA**（量化版）
- LoRA 适合风格调整、格式约束、特定领域；全参数微调适合学习全新知识、追求极致性能
- **先试 LoRA，99% 的情况够用**

---

## 12. 心智模型

> LoRA 不是重新盖房子，而是在房子里添置家具。

你的基础模型（房子）已经足够好了。它懂语法、有知识、会推理。

但每套房子缺的东西不一样：

- 缺一个书桌 → 训练一个写作 adapter
- 缺一个厨房 → 训练一个代码 adapter
- 缺一张沙发 → 训练一个闲聊 adapter

你不需要拆掉房子来加这些功能。买家具就行。

每个家具（adapter）都很小、很便宜、随时可以换。你甚至可以在同一个客厅里摆不同风格的椅子，今天坐这把，明天坐那把。

**这就是 LoRA 的本质——让微调从"盖房子"变成"买家具"。**

---

## 13. 初学者常见错误

### 错误 1：忘记冻结基础模型

LoRA 的核心是"只训练小矩阵，不碰原参数"。

但如果没有正确设置，你可能会意外地更新了原模型的参数——那跟全参数微调一样贵了。

✅ 正确写法：

```python
# 冻结所有基础参数
for param in model.parameters():
    param.requires_grad = False
# 只有 LoRA 层会训练
```

大部分框架（Hugging Face PEFT）会自动处理冻结，但理解这个原理很重要。

### 错误 2：r 越大效果越好

新手常犯：r=64 肯定比 r=8 好。

实际上 r 不是线性提升的。

- r=8 如果能搞定，r=64 可能效果一样甚至更差
- 更大的 r 需要更多的训练数据
- 大 r 还增加了过拟合风险

✅ 正确做法：从 r=8 开始，验证集上评估。效果不够再翻倍试。

### 错误 3：LoRA 到所有层

有些框架默认会 LoRA 到所有层（包括 embedding、lm_head 等）。

但 embedding 层通常是 50k+ 词汇表大小，LoRA 到这层成本高、收益低。

✅ 正确做法：只 LoRA 到注意力层（Q、K、V、O），必要时加 MLP。

### 错误 4：期望 LoRA 学到全新知识

LoRA 是在"调整模型的已有知识"。

如果你想让模型学一种它完全没见过的概念（比如你公司内部的产品细节），LoRA 可能不够。这时候需要：

- 全参数微调
- 或者先用 RAG 把知识放进 prompt，再用 LoRA 优化回答风格

### 错误 5：多个 adapter 混合训练

不要试图在一个训练任务里同时训练多个 adapter。

每个 adapter 应该独立训练（不同的数据、不同的 r、不同的 target modules）。

如果要混合使用，训练完后再做合并（见第 7 节的 weight merging）。

### 错误 6：低估 α 和 r 的搭配

记住公式：`h = Wx + (α/r) × ABx`

如果 r 从 8 改成 64，但 α 没跟着改，那 LoRA 分支的缩放比例 α/r 会从 4 变成 0.5，可能学不动。

✅ 建议保持 α = 2r 的经验法则。

---

## 14. 小练习

打开 Hugging Face，找一个 LoRA adapter 看看：

1. 访问 https://huggingface.co/models 并搜索 "lora"
2. 随机挑一个 adapter（建议选一个流行的，比如基于 Llama 或 Mistral 的）
3. 读 `adapter_config.json`，找出：
   - r 是多少？
   - α 是多少？
   - target_modules 有哪些？
4. 看看 adapter 的权重文件大小（几 MB？）
5. 读它的 README，训练数据是什么样的？

回答这三个问题：

- 为什么这个 adapter 的 r 设成了这个值？你觉得合理吗？
- 如果把 r 翻倍，预计效果会更好还是更差？为什么？
- 这个 adapter 能做什么？和基础模型比有什么变化？

---

## 15. 小项目

用 LoRA 亲手微调一个小模型。

**准备：**

- Python 环境
- Hugging Face 的 `peft` 和 `transformers` 库
- 一张 GPU（没有的话用 Google Colab 免费版也行）

**步骤：**

1. 选用一个小模型（比如 `Qwen2.5-1.5B-Instruct` 或 `SmolLM2-1.7B-Instruct`）

2. 写 LoRA 配置：

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
)

model = get_peft_model(model, lora_config)

# 查看可训练参数
model.print_trainable_parameters()
# 应该输出类似：trainable params: 2.1M || all params: 1.5B || trainable%: 0.14
```

3. 准备 20 条训练数据。要求模型始终以某种特定风格回答（比如"用一句话回答，不要超过 50 个字"）。

4. 运行微调（10 分钟应该就能跑完一个小实验）。

5. 微调前后对比：
   - 问同样的问题，看回答是否有风格变化
   - 原来的模型可能写一大段，微调后应该变成简短风格

6. 保存 adapter：

```python
model.save_pretrained("./my-first-lora-adapter")
```

7. 再看看目录大小：

```bash
du -sh ./my-first-lora-adapter/
# 应该只有几 MB
```

**扩展挑战：**

- 训练第二个 adapter（"详细回答风格"），和第一个 adapter 对比切换效果
- 试试合并两个 adapter，看能不能得到一个"中间风格"

---

## 下一课

[第 12 课：QLoRA 和量化](./12-qlora-quantization)
