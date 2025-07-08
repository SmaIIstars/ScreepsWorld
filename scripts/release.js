import fs from 'fs';
import path from 'path';

// 获取当前时间戳
const timestamp = Date.now();

// 检查releases文件夹是否存在，如果不存在则创建
const releasesDir = './releases';
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir);
}

// 检查是否存在latest.js，如果存在则使用时间戳重命名
const latestPath = path.join(releasesDir, 'latest.js');
if (fs.existsSync(latestPath)) {
  const newPath = path.join(releasesDir, `${timestamp}.js`);
  fs.renameSync(latestPath, newPath);
  console.log(`已将 latest.js 重命名为 ${timestamp}.js`);
}

// 将当前output中的main.js复制到releases中并重命名为latest.js
const sourcePath = './output/main.js';
const targetPath = path.join(releasesDir, 'latest.js');

if (fs.existsSync(sourcePath)) {
  fs.copyFileSync(sourcePath, targetPath);
  console.log('已将 output/main.js 复制为 releases/latest.js');
} else {
  console.error('错误：找不到 output/main.js 文件');
  process.exit(1);
}

console.log('发布完成！');
