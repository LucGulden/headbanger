import { TEST_USER_ID, TEST_USER_ID_2 } from '../mocks/auth.mock'

// ─── Users ────────────────────────────────────────────────────────────────────

export const dbUserFixture = {
  uid: TEST_USER_ID,
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  photo_url: null,
  bio: null,
}

export const dbUserFixture2 = {
  uid: TEST_USER_ID_2,
  username: 'testuser2',
  first_name: 'Test',
  last_name: 'User2',
  photo_url: null,
  bio: null,
}

// ─── Artists ──────────────────────────────────────────────────────────────────

export const artistJoinFixture = {
  position: 1,
  artist: [{ id: 'artist-1', name: 'Test Artist', image_url: null }],
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export const albumJoinFixture = {
  id: 'album-1',
  title: 'Test Album',
  cover_url: null,
  year: 2020,
  album_artists: [artistJoinFixture],
}

// ─── Vinyls ───────────────────────────────────────────────────────────────────

/** Résultat de la requête vinyls:select:single (getById) */
export const vinylDbFixture = {
  id: 'vinyl-1',
  title: 'Test Vinyl',
  cover_url: null,
  year: 2020,
  label: 'Test Label',
  catalog_number: 'CAT-001',
  country: 'FR',
  format: 'LP',
  vinyl_artists: [artistJoinFixture],
  albums: albumJoinFixture,
}

/** Résultat d'un vinyl dans un join posts / user_vinyls */
export const vinylJoinFixture = {
  id: 'vinyl-1',
  title: 'Test Vinyl',
  cover_url: null,
  year: 2020,
  country: 'FR',
  catalog_number: 'CAT-001',
  album_id: 'album-1',
  vinyl_artists: [],
  album: [
    {
      id: 'album-1',
      title: 'Test Album',
      cover_url: null,
      album_artists: [artistJoinFixture],
    },
  ],
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export const postDbFixture = {
  id: 'post-1',
  user_id: TEST_USER_ID,
  vinyl_id: 'vinyl-1',
  type: 'collection_add',
  created_at: '2024-01-01T00:00:00.000Z',
  user: [{ uid: TEST_USER_ID, username: 'testuser', photo_url: null }],
  vinyl: [vinylJoinFixture],
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentDbFixture = {
  id: 'comment-1',
  user_id: TEST_USER_ID,
  post_id: 'post-1',
  content: 'Super vinyle !',
  created_at: '2024-01-01T00:00:00.000Z',
  user: [{ uid: TEST_USER_ID, username: 'testuser', photo_url: null }],
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationDbFixture = {
  id: 'notif-1',
  type: 'new_follower',
  read: false,
  created_at: '2024-01-01T00:00:00.000Z',
  actor: [
    {
      uid: TEST_USER_ID_2,
      username: 'testuser2',
      first_name: 'Test',
      last_name: 'User2',
      photo_url: null,
    },
  ],
  post: null,
  comment: null,
}

// ─── User Vinyls ──────────────────────────────────────────────────────────────

export const userVinylDbFixture = {
  id: 'uv-1',
  added_at: '2024-01-01T00:00:00.000Z',
  release_id: 'vinyl-1',
  vinyls: [
    {
      id: 'vinyl-1',
      title: 'Test Vinyl',
      cover_url: null,
      year: 2020,
      country: 'FR',
      catalog_number: 'CAT-001',
      vinyl_artists: [artistJoinFixture],
    },
  ],
}
