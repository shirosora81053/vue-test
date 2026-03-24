/**
 * タイムスタンプを YYYY-MM-DD HH:mm:ss 形式に手動でフォーマットする
 * @param {string} ts - ISO 8601形式のタイムスタンプ文字列
 * @returns {string} フォーマットされた文字列
 */
export const formatManually = (ts: string): string => {
  const date = new Date(ts)

  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }

  // 各パーツを取得
  const Y = date.getFullYear()
  const M = ('0' + (date.getMonth() + 1)).slice(-2)
  const D = ('0' + date.getDate()).slice(-2)
  const H = ('0' + date.getHours()).slice(-2)
  const m = ('0' + date.getMinutes()).slice(-2)
  const s = ('0' + date.getSeconds()).slice(-2)

  return `${Y}-${M}-${D} ${H}:${m}:${s}`
}

/**
 * 指定された文字数のランダムな英数字文字列を生成します。
 * @param length 生成する文字列の文字数
 * @returns 生成されたランダムな文字列
 */
export function generateRandomString(length: number): string {
  // 使用する文字のプール（大文字、小文字、数字）
  const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789'

  let result: string = ''

  // 指定された文字数だけループ
  for (let i = 0; i < length; i++) {
    // charsの中からランダムなインデックスを計算
    const randomIndex: number = Math.floor(Math.random() * chars.length)

    // 選択された文字を結果に追加
    result += chars.charAt(randomIndex)
  }

  return result
}
