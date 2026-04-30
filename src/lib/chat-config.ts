/** 豆包聊天网关（浏览器直连；密钥仅在云函数内）。构建时可覆盖完整 URL（含 path）。 */
export const CHAT_API_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL ||
  'https://1401656251-k2w165bd2z.ap-guangzhou.tencentscf.com/chat'
