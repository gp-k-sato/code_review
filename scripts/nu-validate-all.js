// npm run nu:dir -- html/xxx/xxx のように使う想定

const { glob } = require('glob');

const targetDir = process.argv[2] || 'html'; // 引数なければ html 全体

const pattern = `${targetDir.replace(/\/$/, '')}/**/*.html`;
const files = glob.sync(pattern, { nodir: true });