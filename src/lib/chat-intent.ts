import { extractQueryChars } from '@/lib/search-query'

export type ChatIntent =
  | { type: 'lookup'; chars: string; series?: string }
  | { type: 'lookup_reject'; message: string }
  | { type: 'chat' }

const SINGLE_CHAR_RE = /^[\u4e00-\u9fff]$/
const HOW_TO_WRITE_RE = /(怎么写|写法|如何写|咋写)/
const CHU_CONTEXT_RE = /(楚简|楚文字|楚文)/
const GREETING_TEXT_SET = new Set([
  '你好',
  '您好',
  '嗨',
  '哈喽',
  '在吗',
  '在不在',
  '早上好',
  '中午好',
  '下午好',
  '晚上好',
  '谢谢',
  '感谢',
])

/**
 * 分流规则：
 * 1) 查字一次只允许 1 个汉字
 * 2) 若是“多个字 + 怎么写 + 楚简/楚文字” => 直接固定提示
 */
export function detectChatIntent(userText: string): ChatIntent {
  const text = userText.trim()
  if (!text) return { type: 'chat' }

  if (GREETING_TEXT_SET.has(text)) {
    return { type: 'chat' }
  }

  const extracted = extractQueryChars(text)

  if (SINGLE_CHAR_RE.test(text)) {
    return { type: 'lookup', chars: text }
  }

  if (extracted) {
    if (extracted.chars.length > 1 && HOW_TO_WRITE_RE.test(text) && CHU_CONTEXT_RE.test(text)) {
      return {
        type: 'lookup_reject',
        message: '抱歉，一次仅能查询一个字，请输入单个文字查询它在楚简中的写法',
      }
    }

    if (extracted.chars.length === 1) {
      return { type: 'lookup', chars: extracted.chars, series: extracted.series }
    }

    return { type: 'chat' }
  }

  return { type: 'chat' }
}
