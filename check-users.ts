import db from './src/db.js';

const users = db.prepare('SELECT id, username, role FROM users').all();
console.log('Users:', users);
