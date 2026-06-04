const DEEPSEEK_API_KEY = 'sk-203e54eca754483983d225fbe99e7673'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
}

interface DayPlan {
  dayIndex: number
  spots: Array<{
    name: string
    address: string
    tags?: string[]
  }>
}

interface TripPlanResponse {
  reasoning: string
  days: DayPlan[]
}

const cleanReadableText = (text: string) => text
  .replace(/[*`#~_]/g, '')
  .replace(/[•●◦▪◆◇·]/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const cleanTripPlanResponse = (plan: TripPlanResponse): TripPlanResponse => ({
  reasoning: cleanReadableText(plan.reasoning),
  days: plan.days.map((day) => ({
    ...day,
    spots: day.spots.map((spot) => ({
      ...spot,
      name: cleanReadableText(spot.name),
      address: cleanReadableText(spot.address),
      tags: spot.tags?.map(cleanReadableText),
    })),
  })),
})

class DeepSeekAIService {
  private conversationHistory: Message[] = []

  async chat(userMessage: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = []

    if (systemPrompt && this.conversationHistory.length === 0) {
      messages.push({ role: 'system', content: systemPrompt })
    }

    messages.push(...this.conversationHistory)
    messages.push({ role: 'user', content: userMessage })

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.6,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API 请求失败: ${response.statusText}`)
    }

    const data = (await response.json()) as ChatResponse
    const assistantMessage = cleanReadableText(data.choices[0].message.content)

    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage },
    )

    return assistantMessage
  }

  async generateTripPlan(params: {
    planName: string
    destination: string
    startDate: string
    endDate: string
    dayCount: number
    weather: string
  }): Promise<TripPlanResponse> {
    const systemPrompt = `你是智能旅行规划助手。请输出高可读、自然、简洁的中文。

输出要求：
1. 不要使用 Markdown 语法，不要使用星号、井号、反引号、项目符号等特殊格式符号。
2. 不要使用“*/·•●”等符号。
3. 语言要像专业旅游顾问，分段清晰，句子完整。
4. 在 reasoning 中先说明总体思路，再说明每天安排逻辑。

规划原则：
1. 根据天气安排室内外活动
2. 景点顺序尽量顺路
3. 每天 3 到 5 个点，节奏适中
4. 优先当地特色景点和美食

请以 JSON 返回，格式如下：
{
  "reasoning": "文本",
  "days": [
    {
      "dayIndex": 0,
      "spots": [
        {
          "name": "景点名称",
          "address": "详细地址（尽量完整）",
          "tags": ["标签1", "标签2"]
        }
      ]
    }
  ]
}`

    const userMessage = `请为我规划一个旅行行程：

行程名称：${params.planName}
目的地：${params.destination}
开始日期：${params.startDate}
结束日期：${params.endDate}
天数：${params.dayCount}天
天气情况：${params.weather}

请给出可直接落地的每日行程。`

    const response = await this.chat(userMessage, systemPrompt)

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法解析 AI 返回的 JSON 格式')
      }

      const parsed = JSON.parse(jsonMatch[0]) as TripPlanResponse
      return cleanTripPlanResponse(parsed)
    } catch (error) {
      throw new Error('AI 返回的格式不正确，请重试', { cause: error })
    }
  }

  async adjustPlan(userFeedback: string): Promise<TripPlanResponse> {
    const response = await this.chat(
      `${userFeedback}\n\n请根据我的反馈调整行程，并以相同 JSON 格式返回。注意文本可读性，不要使用特殊符号。`,
    )

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法解析 AI 返回的 JSON 格式')
      }

      const parsed = JSON.parse(jsonMatch[0]) as TripPlanResponse
      return cleanTripPlanResponse(parsed)
    } catch (error) {
      throw new Error('AI 返回的格式不正确，请重试', { cause: error })
    }
  }

  resetConversation(): void {
    this.conversationHistory = []
  }
}

export const deepseekAIService = new DeepSeekAIService()
