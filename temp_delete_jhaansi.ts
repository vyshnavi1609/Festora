import dotenv from 'dotenv';
import { query, queryOne, execute, pool } from './src/db.ts';

dotenv.config();

async function run() {
  try {
    const user = await queryOne(`SELECT id, username FROM users WHERE LOWER(username) = LOWER($1)`, ['jhaansi']);
    if (!user) {
      console.log('User jhaansi not found');
      return;
    }
    const userId = user.id;
    console.log('Found user:', user);

    const events = await query(`SELECT id, title FROM events WHERE created_by = $1`, [userId]);
    if (events.length === 0) {
      console.log('No events found for user', userId);
    } else {
      console.log('Events to delete:', events);
      for (const ev of events) {
        console.log('Deleting event', ev.id, ev.title);
        await execute('DELETE FROM registrations WHERE event_id = $1', [ev.id]);
        await execute('DELETE FROM comments WHERE event_id = $1', [ev.id]);
        await execute('DELETE FROM likes WHERE event_id = $1', [ev.id]);
        await execute('DELETE FROM bookmarks WHERE event_id = $1', [ev.id]);
        await execute('DELETE FROM event_reminders WHERE event_id = $1', [ev.id]);
        await execute('DELETE FROM events WHERE id = $1', [ev.id]);
      }
    }

    console.log('Deleting user-related records for user', userId);
    await execute('DELETE FROM club_members WHERE user_id = $1', [userId]);
    await execute('UPDATE clubs SET president_id = NULL WHERE president_id = $1', [userId]);
    await execute('DELETE FROM club_follows WHERE user_id = $1', [userId]);
    await execute('DELETE FROM likes WHERE user_id = $1', [userId]);
    await execute('DELETE FROM bookmarks WHERE user_id = $1', [userId]);
    await execute('DELETE FROM registrations WHERE user_id = $1', [userId]);
    await execute('DELETE FROM comments WHERE user_id = $1', [userId]);
    await execute('DELETE FROM follows WHERE follower_id = $1 OR following_id = $1', [userId]);
    await execute('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await execute('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await execute('DELETE FROM reminders WHERE user_id = $1', [userId]);
    await execute('DELETE FROM event_reminders WHERE user_id = $1', [userId]);
    await execute('DELETE FROM saved_events WHERE user_id = $1', [userId]);
    await execute('DELETE FROM story_views WHERE viewer_id = $1', [userId]);
    await execute('DELETE FROM stories WHERE user_id = $1', [userId]);
    await execute('DELETE FROM activity WHERE user_id = $1 OR target_user_id = $1', [userId]);
    await execute('DELETE FROM role_requests WHERE requester_id = $1 OR target_user_id = $1', [userId]);
    await execute('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await execute('DELETE FROM users WHERE id = $1', [userId]);

    console.log('User jhaansi and their events have been deleted');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await pool.end();
  }
}

run();
