export const users = [
  { id: 1, username: 'alice', full_name: 'Alice Johnson', role: 'student', email: 'alice@example.com', avatar_url: '', college_name: 'GNITS' },
  { id: 2, username: 'bob', full_name: 'Bob Kumar', role: 'club_president', email: 'bob@example.com', avatar_url: '', college_name: 'GNITS' },
];

export const events = [
  {
    id: 101,
    title: 'Freshers Social Night',
    description: 'Welcome party with music and food',
    image_url: 'https://picsum.photos/seed/101/800/600',
    date: new Date(Date.now() + 86400000).toISOString(),
    location: 'Main Auditorium',
    category: 'Social',
    created_by: 2,
    organizer_name: 'Computer Science Club',
    registration_count: 12,
    comment_count: 3,
    views: 40,
    qr_code: null,
    capacity: 200,
    privacy: 'social',
    college_code: 'GNITS',
    pass: null,
    google_form_url: 'https://forms.gle/example'
  },
  {
    id: 102,
    title: 'Workshop: Intro to React',
    description: 'Hands-on React workshop',
    image_url: 'https://picsum.photos/seed/102/800/600',
    date: new Date(Date.now() + 3*86400000).toISOString(),
    location: 'Lab 3',
    category: 'Workshop',
    created_by: 2,
    organizer_name: 'Dev Club',
    registration_count: 5,
    comment_count: 1,
    views: 20,
    qr_code: null,
    capacity: 50,
    privacy: 'social',
    college_code: 'GNITS',
    pass: null,
    google_form_url: null
  }
];

export const registrations = [
  { user_id: 1, event_id: 101, status: 'registered' }
];

export const likes = [
  { user_id: 1, event_id: 101 }
];

export const roleRequests = [
  {
    id: 1,
    requester_id: 1,
    requester_name: 'Alice Johnson',
    target_user_id: 2,
    target_name: 'Bob Kumar',
    requested_role: 'club_member',
    status: 'pending',
    club_id: null,
    club_name: null,
    created_at: new Date().toISOString()
  }
];

export default { users, events, registrations, likes, roleRequests };
