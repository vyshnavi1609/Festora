import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'campus_events.db'));

console.log('=== REGISTERED USERS ===');
const users = db.prepare('SELECT id, username, email, phone_number, full_name, role, college_name, roll_no, avatar_url FROM users ORDER BY id').all();

console.log('Total users:', users.length);
console.log('');

users.forEach((user, index) => {
  console.log(index + 1 + '.', user.full_name, '(@' + user.username + ')');
  console.log('   Role:', user.role);
  console.log('   College:', user.college_name || 'Not specified');
  console.log('   Roll No:', user.roll_no || 'Not specified');
  console.log('   Email:', user.email || 'Not provided');
  console.log('   Phone:', user.phone_number || 'Not provided');
  console.log('   Avatar:', user.avatar_url ? 'Yes' : 'No');
  console.log('');
});

db.close();