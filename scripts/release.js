import fs from 'fs';
import path from 'path';

// 获取当前时间戳
const timestamp = Date.now();
const releasesDir = './releases';

const releaseMain = () => {
  checkReleasesDir();
  clearOldReleases();
  checkLatestFile();
  copyMainToReleases();
  console.log('发布完成！');
};

// 如果 releases 文件夹下超过 10 个文件，则删除最老的版本
const clearOldReleases = () => {
  const MAX_RELEASES = 10;
  const files = fs
    .readdirSync(releasesDir)
    .filter((file) => file.endsWith('.js') && file !== 'latest.js')
    .map((file) => ({
      name: file,
      time: (() => {
        const match = file.match(/^(\d+)\.js$/);
        return match ? Number(match[1]) : 0;
      })(),
    }))
    .sort((a, b) => a.time - b.time);

  if (files.length > MAX_RELEASES) {
    const needDelete = files.length - MAX_RELEASES;
    for (let i = 0; i < needDelete; i++) {
      const filePath = path.join(releasesDir, files[i].name);
      fs.unlinkSync(filePath);
      console.log(`已删除最老的版本：${files[i].name}`);
    }
  }
};

// 检查releases文件夹是否存在，如果不存在则创建
const checkReleasesDir = () => {
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir);
  }
};

const checkLatestFile = () => {
  // 检查是否存在latest.js，如果存在则使用时间戳重命名
  const latestPath = path.join(releasesDir, 'latest.js');
  if (fs.existsSync(latestPath)) {
    const newPath = path.join(releasesDir, `${timestamp}.js`);
    fs.renameSync(latestPath, newPath);
    console.log(`已将 latest.js 重命名为 ${timestamp}.js`);
  }
};

const copyMainToReleases = () => {
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
};

releaseMain();
