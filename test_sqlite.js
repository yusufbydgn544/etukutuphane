import { createRequire } from 'module';
const require = createRequire(import.meta.url);
try {
    const sqlite3 = require('sqlite3');
    console.log('sqlite3 imported successfully');
} catch (e) {
    console.error('sqlite3 failed:', e);
}
