/**
 * 与搜索页 / use-search-chat 相同的「用户输入 → 要查的字」解析。
 * 纯函数，无 IO，用于意图识别（查字 vs 走 AI）。
 */
export function extractQueryChars(textInput: string): { chars: string; series?: string } | null {
  const text = textInput.trim()
  if (!text) return null
  const semanticKeywords = ['楚简', '怎么写', '写法', '书写', '字形', '简帛', '字帖', '字库', '古文字', '篆书']
  const hasSemantic = semanticKeywords.some((keyword) => text.includes(keyword))
  if (!hasSemantic && /^[\u4e00-\u9fff]{1,3}$/.test(text)) return { chars: text }
  if (!hasSemantic) return null

  const seriesMatch = text.match(/(郭店楚简|包山楚简|清华简|上博楚简)/)
  const series = seriesMatch ? seriesMatch[1] : undefined
  const seriesChars = series ? series.replace(/[^\u4e00-\u9fff]/g, '').split('') : []
  const excludeChars = ['怎', '么', '写', '法', '字', '形', '书', '中', '在', '里', '的', '楚', '简']
  const allChineseChars = text
    .replace(/[^\u4e00-\u9fff]/g, '')
    .split('')
    .filter((char) => !seriesChars.includes(char) && !excludeChars.includes(char))
    .join('')

  if (allChineseChars.length >= 1 && allChineseChars.length <= 5) return { chars: allChineseChars, series }
  if (allChineseChars.length > 5) return { chars: allChineseChars.slice(0, 5), series }
  return null
}
