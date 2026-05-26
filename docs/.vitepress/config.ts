import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AI PM Playbook',
  description: '从产品经理到 AI 产品架构师的实战指南',
  lang: 'zh-CN',
  base: '/ai-pm-playbook/',

  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',

  head: [
    ['link', { rel: 'icon', href: '/ai-pm-playbook/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#8A2BE2' }],
  ],

  themeConfig: {
    logo: '/favicon.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '产品框架', link: '/guide/01-framework/ai-product-canvas' },
      { text: 'PRD 模板', link: '/guide/02-prd/ai-saas-prd-template' },
      { text: '案例研究', link: '/guide/03-cases/appsignal-case-study' },
      { text: 'GitHub', link: 'https://github.com/prodthinkpm/ai-pm-playbook' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '快速导航', link: '/guide/' },
            { text: 'INDEX 总索引', link: '/guide/index' },
          ],
        },
        {
          text: '📡 研究方向',
          items: [
            { text: 'AI产品经理研究与分析', link: '/guide/research/ai-pm-research-roadmap' },
            { text: '大模型与 Harness 的未来轨迹', link: '/guide/research/llm-harness-future-trajectory' },
            { text: 'Harness Engineering 入门', link: '/guide/research/harness-engineering-introduction' },
          ],
        },
        {
          text: '01 — AI 产品框架',
          items: [
            { text: 'AI 产品画布', link: '/guide/01-framework/ai-product-canvas' },
            { text: 'Agent 产品画布', link: '/guide/01-framework/agent-product-canvas' },
            { text: 'RAG 产品画布', link: '/guide/01-framework/rag-product-canvas' },
            { text: 'HITL 产品画布', link: '/guide/01-framework/human-in-the-loop-canvas' },
          ],
        },
        {
          text: '02 — PRD 模板',
          items: [
            { text: 'AI SaaS PRD', link: '/guide/02-prd/ai-saas-prd-template' },
            { text: 'Agent PRD', link: '/guide/02-prd/agent-prd-template' },
            { text: 'Coding Agent PRD', link: '/guide/02-prd/coding-agent-prd-template' },
            { text: 'RAG PRD', link: '/guide/02-prd/rag-prd-template' },
            { text: '数据平台 PRD', link: '/guide/02-prd/data-platform-prd-template' },
          ],
        },
        {
          text: '03 — 案例研究',
          items: [
            { text: '隐私政策解读 (AppSignal)', link: '/guide/03-cases/appsignal-case-study' },
            { text: '营养数据平台 (OpenFoodData)', link: '/guide/03-cases/openfooddata-case-study' },
            { text: 'Agent 操作系统 (Aurora)', link: '/guide/03-cases/aurora-agentos-case-study' },
            { text: '推理优化 (Falcon)', link: '/guide/03-cases/falcon-case-study' },
            { text: '自动驾驶数据平台', link: '/guide/03-cases/autonomous-driving-data-platform-case-study' },
          ],
        },
        {
          text: '04 — AI 评估体系',
          items: [
            { text: 'Agent 评估指标', link: '/guide/04-evaluation/agent-evaluation-metrics' },
            { text: 'LLM 输出质量', link: '/guide/04-evaluation/llm-output-quality' },
            { text: '工具调用成功率', link: '/guide/04-evaluation/tool-call-success-rate' },
            { text: '产品成功指标', link: '/guide/04-evaluation/product-success-metrics' },
          ],
        },
        {
          text: '05 — Agent 产品设计',
          items: [
            { text: 'Agent 循环', link: '/guide/05-agent-design/agent-loop' },
            { text: 'AI 工具分类与 Agent Loop', link: '/guide/05-agent-design/ai-tool-taxonomy-and-agent-loop' },
            { text: '记忆设计', link: '/guide/05-agent-design/memory-design' },
            { text: '权限与审批', link: '/guide/05-agent-design/permission-and-approval' },
            { text: '多 Agent 工作流', link: '/guide/05-agent-design/multi-agent-workflow' },
            { text: '可观测性', link: '/guide/05-agent-design/observability' },
          ],
        },
        {
          text: '06 — AI PM 职业发展',
          items: [
            { text: '成长路线图', link: '/guide/06-career/ai-pm-roadmap' },
            { text: '技能图谱', link: '/guide/06-career/ai-pm-skill-map' },
            { text: '作品集指南', link: '/guide/06-career/portfolio-building-guide' },
            { text: 'PM 实操工具包', link: '/guide/06-career/pm-toolkit' },
          ],
        },
        {
          text: '07 — 提示词工程',
          items: [
            { text: 'ChatGPT Web 产品落地手册', link: '/guide/07-prompts/chatgpt-web-zero-to-one-product-playbook' },
            { text: 'PRD Prompts', link: '/guide/07-prompts/prd-prompts' },
            { text: '用户研究 Prompts', link: '/guide/07-prompts/user-research-prompts' },
            { text: '路线图 Prompts', link: '/guide/07-prompts/roadmap-prompts' },
            { text: '评估 Prompts', link: '/guide/07-prompts/evaluation-prompts' },
          ],
        },
        {
          text: '08 — 用户研究',
          items: [
            { text: '用户研究方法论', link: '/guide/08-user-research/user-research-methods' },
            { text: 'AI 需求验证', link: '/guide/08-user-research/demand-validation' },
            { text: '用户期望管理', link: '/guide/08-user-research/expectation-management' },
          ],
        },
        {
          text: '09 — 商业化',
          items: [
            { text: 'AI 产品定价策略', link: '/guide/09-monetization/pricing-strategies' },
            { text: 'Token 经济学', link: '/guide/09-monetization/token-economics' },
            { text: 'B端 vs C端设计', link: '/guide/09-monetization/b2b-vs-consumer' },
          ],
        },
        {
          text: '10 — 安全合规',
          items: [
            { text: '内容安全与幻觉管控', link: '/guide/10-compliance/content-safety-framework' },
            { text: '数据隐私与合规', link: '/guide/10-compliance/privacy-compliance' },
            { text: '审计追踪与透明度', link: '/guide/10-compliance/ai-audit-transparency' },
            { text: 'AI 治理检查清单', link: '/guide/10-compliance/ai-governance-checklist' },
          ],
        },
        {
          text: '11 — 开发流程',
          items: [
            { text: '从 0 到 1 全流程', link: '/guide/11-dev-process/product-lifecycle-guide' },
            { text: 'Prompt 工程管理', link: '/guide/11-dev-process/prompt-management' },
            { text: 'PM 与工程师协作', link: '/guide/11-dev-process/pm-mle-collaboration' },
            { text: '模型升级与灰度策略', link: '/guide/11-dev-process/model-iteration-playbook' },
          ],
        },
        {
          text: '12 — LLM 工程与微调教程',
          items: [
            { text: '教程总览', link: '/guide/12-llm-engineering/' },
            { text: 'LLM 基础', link: '/guide/12-llm-engineering/01-llm-basics' },
            { text: 'Token 与上下文窗口', link: '/guide/12-llm-engineering/02-token-tokenization-context' },
            { text: 'Embedding 和语义搜索', link: '/guide/12-llm-engineering/03-embedding-semantic-search' },
            { text: 'Transformer 和 Attention', link: '/guide/12-llm-engineering/04-transformer-attention' },
            { text: '参数、训练和推理', link: '/guide/12-llm-engineering/05-parameters-training-inference' },
            { text: '开源模型 vs 闭源模型', link: '/guide/12-llm-engineering/06-open-source-vs-closed-source' },
            { text: 'SFT 数据集和指令微调', link: '/guide/12-llm-engineering/07-sft-datasets-instruction-tuning' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/prodthinkpm/ai-pm-playbook' },
    ],

    footer: {
      message: 'MIT License',
      copyright: 'Copyright © 2026 prodthinkpm',
    },

    editLink: {
      pattern: 'https://github.com/prodthinkpm/ai-pm-playbook/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    search: { provider: 'local' },
  },
})