/**
 * 简 → 繁 转换模块
 * 使用 opencc-js（Open Chinese Convert）完整简繁体字典，覆盖全部常用汉字
 */

import * as opencc from 'opencc-js';

// 单例转换器（避免每次都初始化）
let _converter: ((text: string) => string) | null = null;

function getConverter(): (text: string) => string {
  if (!_converter) {
    _converter = opencc.Converter({ from: 'cn', to: 'tw' });
  }
  return _converter;
}

/**
 * 将字符串中的简体字转为繁体字
 * 返回 null 如果与原字符串相同（不需要额外查询）
 */
export function toTraditional(str: string): string | null {
  try {
    const converter = getConverter();
    const result = converter(str);
    return result !== str ? result : null;
  } catch {
    return null;
  }
}

export default toTraditional;
