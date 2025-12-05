import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const webpush = require('web-push');

import fs from 'fs';

const vapidKeys = webpush.generateVAPIDKeys();

fs.writeFileSync('vapid.json', JSON.stringify(vapidKeys, null, 2));
console.log('Keys written to vapid.json');
