/**
 * 构建楚简字库索引脚本
 * 在 next build 之前运行，生成 public/search/search-index.json
 */
import COS from 'cos-nodejs-sdk-v5';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as opencc from 'opencc-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BUCKET = 'chujianwenzibian-1401656251';
const REGION = 'ap-guangzhou';
const SERIES_LIST = ['郭店楚简', '包山楚简', '清华简', '上博楚简'];

const cos = new COS({
  SecretId: process.env.TENCENT_COS_SECRET_ID,
  SecretKey: process.env.TENCENT_COS_SECRET_KEY,
});

function cosPromise(method, params) {
  return new Promise((resolve, reject) => {
    cos[method]({ Bucket: BUCKET, Region: REGION, ...params }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function listFiles(prefix) {
  const files = [];
  let marker = '';
  do {
    const data = await cosPromise('getBucket', {
      Prefix: prefix,
      MaxKeys: 1000,
      Marker: marker,
    });
    const contents = data.Contents || [];
    for (const item of contents) {
      if (!item.Key.endsWith('/')) {
        files.push(item.Key);
      }
    }
    marker = data.IsTruncated && data.NextMarker ? data.NextMarker : '';
  } while (marker);
  return files;
}

async function buildIndex() {
  console.log('开始构建楚简字库索引...');
  const outPath = path.join(__dirname, '..', 'public', 'search', 'search-index.json');
  if (!process.env.TENCENT_COS_SECRET_ID || !process.env.TENCENT_COS_SECRET_KEY) {
    console.log('未检测到 COS 凭证，跳过索引重建，保留现有 public/search/search-index.json');
    return;
  }

  const index = {
    version: 1,
    updatedAt: new Date().toISOString(),
    series: {},
  };

  try {
    for (const series of SERIES_LIST) {
      console.log(`  扫描 ${series}...`);
      const files = await listFiles(`${series}/`);
      console.log(`    找到 ${files.length} 个文件`);

      const charMap = new Map(); // char -> [{key, fileName, index}]
      const converter = opencc.Converter({ from: 'cn', to: 'tw' });

      for (const key of files) {
        const fileName = key.split('/').pop();
        const charPart = fileName.split('_')[0];

        for (const c of charPart) {
          if (/[\u4e00-\u9fa5]/.test(c)) {
            const parts = fileName.replace('.png', '').split('_');
            const idx = parts.length >= 3 ? parts[parts.length - 1] : '1';
            const item = { key, fileName, index: idx };

            // 简体字
            if (!charMap.has(c)) {
              charMap.set(c, []);
            }
            const existing = charMap.get(c);
            const dup = existing.find(e => e.fileName === fileName);
            if (!dup) {
              existing.push(item);
            }

            // 繁体字（如果不同）
            const trad = converter(c);
            if (trad && trad !== c) {
              if (!charMap.has(trad)) {
                charMap.set(trad, []);
              }
              const tradExisting = charMap.get(trad);
              const tradDup = tradExisting.find(e => e.fileName === fileName);
              if (!tradDup) {
                tradExisting.push(item);
              }
            }
          } 
        }
      }

      // 转为普通对象
      const seriesIndex = {};
      for (const [char, items] of charMap) {
        seriesIndex[char] = items;
      }

      index.series[series] = seriesIndex;
      console.log(`    索引了 ${Object.keys(seriesIndex).length} 个汉字`);
    }
  } catch (error) {
    if (fs.existsSync(outPath)) {
      console.warn('索引重建失败，已保留现有 public/search/search-index.json：', error?.message || error);
      return;
    }
    throw error;
  }

  // 构建全局简繁体映射（在构建时完成，前端不需要 opencc-js）
  // 这里先留空，后面可以用 opencc-js 补充

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(index), 'utf-8');

  console.log(`索引已保存到 ${outPath}`);

  // 统计
  let totalChars = 0;
  let totalFiles = 0;
  for (const series in index.series) {
    const chars = Object.keys(index.series[series]);
    totalChars += chars.length;
    totalFiles += chars.reduce((sum, c) => sum + index.series[series][c].length, 0);
  }
  console.log(`总计：${totalChars} 个汉字，${totalFiles} 个文件映射`);
}

buildIndex().catch(err => {
  console.error('构建索引失败:', err);
  process.exit(1);
});
