// For pages router (pages/index.js) or app router (app/page.js)

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to the Door Knocking Tracker</h1>
      <p>
        Manage your door knocking activities effortlessly. Track your visits,
        record notes, and update statuses all in one place.
      </p>
      <Link href="/tracker">
        <a style={{
          display: 'inline-block',
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#0070f3',
          color: '#fff',
          borderRadius: '5px',
          textDecoration: 'none'
        }}>
          Go to Tracker
        </a>
      </Link>
    </div>
  );
}