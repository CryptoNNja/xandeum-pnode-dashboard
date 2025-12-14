const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
const content = fs.readFileSync('.env.local', 'utf-8');
console.log(content);