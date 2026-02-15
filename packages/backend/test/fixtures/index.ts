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

export const artistDbFixture = {
  id: 'artist-1',
  name: 'The Beatles',
  image_url: 'https://example.com/beatles.jpg',
  spotify_id: 'spotify-123',
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export const albumJoinFixture = {
  id: 'album-1',
  title: 'Test Album',
  cover_url: null,
  year: 2020,
  album_artists: [artistJoinFixture],
}

/** Vinyles associés à un album (pour GET /albums/:id) */
export const albumVinylsFixture = [
  {
    id: 'vinyl-1',
    title: 'Test Vinyl (UK Press)',
    cover_url: null,
    year: 2020,
    country: 'UK',
    catalog_number: 'CAT-001',
    vinyl_artists: [],
  },
]

/** Album sans artistes → déclenche le fallback "Artiste inconnu" */
export const albumNoArtistsFixture = {
  id: 'album-no-artists',
  title: 'Mystery Album',
  cover_url: null,
  year: 2000,
  album_artists: [],
}

export const albumArtistsDbFixture = [
  {
    position: 1,
    album: [
      {
        id: 'album-1',
        title: 'Abbey Road',
        cover_url: null,
        year: 1969,
        album_artists: [
          {
            position: 1,
            artist: [{ id: 'artist-1', name: 'The Beatles', image_url: null }],
          },
        ],
      },
    ],
  },
]

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

/** Post avec vinyl_artists peuplé (couvre les lignes 221-233 et branche false de 239) */
export const postWithVinylArtistDbFixture = {
  id: 'post-2',
  user_id: TEST_USER_ID,
  vinyl_id: 'vinyl-1',
  type: 'collection_add',
  created_at: '2024-01-01T00:00:00.000Z',
  user: [{ uid: TEST_USER_ID, username: 'testuser', photo_url: null }],
  vinyl: [
    {
      ...vinylJoinFixture,
      vinyl_artists: [
        { position: 1, artist: [{ id: 'artist-1', name: 'Test Artist', image_url: null }] },
      ],
    },
  ],
}

/** Post sans aucun artiste → fallback "Artiste inconnu" (ligne 255) */
export const postWithNoArtistDbFixture = {
  id: 'post-3',
  user_id: TEST_USER_ID,
  vinyl_id: 'vinyl-1',
  type: 'collection_add',
  created_at: '2024-01-01T00:00:00.000Z',
  user: [{ uid: TEST_USER_ID, username: 'testuser', photo_url: null }],
  vinyl: [
    {
      ...vinylJoinFixture,
      vinyl_artists: [],
      album: [
        {
          id: 'album-1',
          title: 'Test Album',
          cover_url: null,
          album_artists: [],
        },
      ],
    },
  ],
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

/** Notification avec post (pour tester transformNotificationData branch post) */
export const notificationWithPostDbFixture = {
  id: 'notif-post-1',
  type: 'post_like',
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
  post: [
    {
      id: 'post-id-00000000-0000-0000-0000-000000000001',
      vinyl_id: 'vinyl-1',
      vinyl: [
        {
          id: 'vinyl-1',
          title: 'Test Vinyl',
          cover_url: null,
          vinyl_artists: [{ position: 1, artist: [{ name: 'Test Artist' }] }],
          album: [
            {
              id: 'album-1',
              title: 'Test Album',
              album_artists: [{ position: 1, artist: [{ name: 'Test Artist' }] }],
            },
          ],
        },
      ],
    },
  ],
  comment: null,
}

/** Notification avec commentaire (pour tester transformNotificationData branch comment) */
export const notificationWithCommentDbFixture = {
  id: 'notif-comment-1',
  type: 'post_comment',
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
  comment: [{ id: 'comment-id-00000000-0000-0000-0000-000000000001', content: 'Super vinyle !' }],
}

/** Résultat d'un insert:single notification (pour tester createNotification) */
export const notificationCreateDbFixture = {
  id: 'notif-new-1',
  type: 'post_like',
  read: false,
  created_at: '2024-01-01T00:00:00.000Z',
  actor: [
    {
      uid: TEST_USER_ID,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      photo_url: null,
    },
  ],
  post: [{ id: 'post-id-00000000-0000-0000-0000-000000000001', vinyl_id: 'vinyl-1' }],
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
