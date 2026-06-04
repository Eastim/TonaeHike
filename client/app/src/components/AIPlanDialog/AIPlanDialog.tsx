import { useEffect, useRef, useState } from 'react'
import { X, Send, Sparkles, LoaderCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

interface AIPlanDialogProps {
  open: boolean
  onClose: () => void
  initialReasoning: string
  sessionVersion: number
  onAdjust: (feedback: string) => Promise<void>
}

const sanitizeDialogText = (text: string) => text
  .replace(/[*`#~_]/g, '')
  .replace(/[•●◦▪◆◇·]/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

export function AIPlanDialog({ open, onClose, initialReasoning, sessionVersion, onAdjust }: AIPlanDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !initialReasoning) {
      return
    }

    setMessages([
      {
        role: 'assistant',
        content: sanitizeDialogText(`我已经为您规划好了行程。

规划思路：
${initialReasoning}

如果您希望我按预算、节奏、偏好景点类型或餐饮口味继续优化，请直接告诉我。`),
      },
    ])
  }, [sessionVersion, initialReasoning, open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim() || isAdjusting) {
      return
    }

    const userMessage = sanitizeDialogText(input)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsAdjusting(true)

    try {
      await onAdjust(userMessage)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '好的，我已经根据您的反馈调整了行程。请查看左侧最新安排。如果还要继续细化，我可以继续优化。',
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `抱歉，调整行程时出现了问题：${error instanceof Error ? error.message : '未知错误'}。请重试。`,
        },
      ])
    } finally {
      setIsAdjusting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative flex h-[620px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif' }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">智能旅行规划助手</h2>
                <p className="text-xs text-slate-500">可继续对话优化行程</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={[
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'max-w-[82%] rounded-2xl px-4 py-3 text-[15px] leading-7 tracking-[0.01em]',
                      message.role === 'user'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-100 text-slate-900',
                    ].join(' ')}
                  >
                    <div className="whitespace-pre-wrap">{sanitizeDialogText(message.content)}</div>
                  </div>
                </div>
              ))}
              {isAdjusting ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    正在根据您的反馈优化行程...
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：预算更省一些、减少步行、增加人文景点..."
                disabled={isAdjusting}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isAdjusting}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
