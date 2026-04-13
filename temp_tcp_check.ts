import fs from 'fs';
import net from 'net';
import { URL } from 'url';

const env = fs.readFileSync('c:/Users/vyshn/Downloads/festora/.env', 'utf8')
  .split(/\r?\n/)
  .find(line => line.startsWith('DATABASE_URL='));
if (!env) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}
const dbUrl = env.split('=')[1];
const u = new URL(dbUrl);
const port = u.port ? Number(u.port) : 5432;
const socket = new net.Socket();
socket.setTimeout(10000);
socket.on('error', err => {
  console.log('socket error', err.message);
  process.exit(0);
});
socket.on('timeout', () => {
  console.log('socket timeout');
  process.exit(0);
});
socket.connect(port, u.hostname, () => {
  console.log('connected');
  socket.end();
  process.exit(0);
});
