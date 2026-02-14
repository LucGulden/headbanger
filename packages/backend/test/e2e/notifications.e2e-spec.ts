import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from '../utils/create-app-with-mocks'
import {
  notificationDbFixture,
  notificationWithPostDbFixture,
  notificationWithCommentDbFixture,
  notificationCreateDbFixture,
} from '../fixtures'
import { TEST_USER_ID, TEST_USER_ID_2 } from '../mocks/auth.mock'
import { EventsService } from '../../src/events/events.service'

// ─── Constantes ───────────────────────────────────────────────────────────────

const POST_ID = 'post-id-00000000-0000-0000-0000-000000000001'
const COMMENT_ID = 'comment-id-00000000-0000-0000-0000-000000000001'

describe('Notifications E2E', () => {
  let app: INestApplication

  afterEach(async () => {
    if (app) await app.close()
  })

  // ─── GET /notifications ──────────────────────────────────────────────────────

  describe('GET /notifications', () => {
    it("retourne les notifications de l'utilisateur (200)", async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': { data: [notificationDbFixture], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications').expect(200)

      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('id', 'notif-1')
      expect(res.body[0]).toHaveProperty('type', 'new_follower')
      expect(res.body[0]).toHaveProperty('read', false)
      expect(res.body[0].actor).toHaveProperty('username', 'testuser2')
    })

    it('retourne un tableau vide si aucune notification (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': { data: [], error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications').expect(200)

      expect(res.body).toEqual([])
    })

    it('accepte les query params limit et lastCreatedAt (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': { data: [], error: null },
        },
      })

      await request(app.getHttpServer())
        .get('/notifications?limit=5&lastCreatedAt=2024-01-01T00:00:00.000Z')
        .expect(200)
    })

    it('500 → erreur Supabase sur getNotifications (ligne 72)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/notifications').expect(500)
    })

    it('retourne une notification avec post et vinyl (branches 255-309)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': {
            data: [notificationWithPostDbFixture],
            error: null,
          },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications').expect(200)

      expect(res.body[0]).toHaveProperty('type', 'post_like')
      expect(res.body[0].post).toHaveProperty('vinylId', 'vinyl-1')
      expect(res.body[0].post.vinyl).toHaveProperty('title', 'Test Vinyl')
      expect(res.body[0].post.vinyl).toHaveProperty('artist', 'Test Artist')
    })

    it('retourne une notification avec commentaire (branche comment ligne 309)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:many': {
            data: [notificationWithCommentDbFixture],
            error: null,
          },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications').expect(200)

      expect(res.body[0].comment).toHaveProperty('content', 'Super vinyle !')
    })
  })

  // ─── GET /notifications/unread-count ─────────────────────────────────────────

  describe('GET /notifications/unread-count', () => {
    it('retourne le nombre de notifications non lues (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:count': { count: 3, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications/unread-count').expect(200)

      expect(res.body).toEqual({ count: 3 })
    })

    it('retourne 0 si toutes les notifications sont lues (200)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:count': { count: 0, data: null, error: null },
        },
      })

      const res = await request(app.getHttpServer()).get('/notifications/unread-count').expect(200)

      expect(res.body).toEqual({ count: 0 })
    })

    it('500 → erreur Supabase sur getUnreadCount (ligne 90)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:count': {
            count: null,
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).get('/notifications/unread-count').expect(500)
    })
  })

  // ─── PUT /notifications/mark-all-read ────────────────────────────────────────

  describe('PUT /notifications/mark-all-read', () => {
    it('marque toutes les notifications comme lues (200)', async () => {
      app = await createTestApp()

      const res = await request(app.getHttpServer()).put('/notifications/mark-all-read').expect(200)

      expect(res.body).toEqual({ success: true })
    })

    it("émet 'notification:read-all' après markAllAsRead (ligne 106)", async () => {
      app = await createTestApp()
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).put('/notifications/mark-all-read').expect(200)

      expect(emitSpy).toHaveBeenCalledWith(
        TEST_USER_ID,
        'notification:read-all',
        expect.objectContaining({ userId: TEST_USER_ID }),
      )
    })

    it('500 → erreur Supabase sur markAllAsRead (ligne 106)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:update': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).put('/notifications/mark-all-read').expect(500)
    })
  })

  // ─── deleteByLike — via DELETE /post-likes/:postId ────────────────────────────
  //
  // L'utilisateur authentifié (TEST_USER_ID) unlike un post.
  // NotificationsService lit la notif (actor_id=TEST_USER_ID, post_id=POST_ID)
  // avant de la supprimer, puis émet vers notification.user_id si read=false.

  describe('DELETE /post-likes/:postId → deleteByLike', () => {
    it("émet 'notification:deleted' si la notification est non lue (read: false)", async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: false },
            error: null,
          },
          'notifications:delete': { data: null, error: null },
          'post_likes:delete': { data: null, error: null },
          'post_likes:select:count': { count: 1, data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/post-likes/${POST_ID}`).expect(200)

      expect(emitSpy).toHaveBeenCalledWith(
        TEST_USER_ID_2,
        'notification:deleted',
        expect.objectContaining({ type: 'post_like' }),
      )
    })

    it("n'émet PAS si la notification est déjà lue (read: true)", async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: true },
            error: null,
          },
          'notifications:delete': { data: null, error: null },
          'post_likes:delete': { data: null, error: null },
          'post_likes:select:count': { count: 1, data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/post-likes/${POST_ID}`).expect(200)

      expect(emitSpy).not.toHaveBeenCalled()
    })

    it("n'émet PAS si aucune notification n'existe (PGRST116)", async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:single': {
            data: null,
            error: { message: 'No rows', code: 'PGRST116', details: null, hint: null },
          },
          'notifications:delete': { data: null, error: null },
          'post_likes:delete': { data: null, error: null },
          'post_likes:select:count': { count: 0, data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/post-likes/${POST_ID}`).expect(200)

      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('500 → erreur Supabase sur delete notification like (ligne 332)', async () => {
      app = await createTestApp({
        supabase: {
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: false },
            error: null,
          },
          'notifications:delete': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
          'post_likes:delete': { data: null, error: null },
          'post_likes:select:count': { count: 0, data: null, error: null },
        },
      })

      await request(app.getHttpServer()).delete(`/post-likes/${POST_ID}`).expect(500)
    })
  })

  // ─── deleteByComment — via DELETE /comments/:commentId ───────────────────────
  //
  // L'utilisateur authentifié (TEST_USER_ID) supprime son propre commentaire.
  // NotificationsService lit la notif (comment_id=COMMENT_ID)
  // puis émet vers notification.user_id si read=false.

  describe('DELETE /comments/:commentId → deleteByComment', () => {
    it("émet 'notification:deleted' si la notification de commentaire est non lue", async () => {
      app = await createTestApp({
        supabase: {
          // CommentsService vérifie la propriété du commentaire avant de supprimer
          'comments:select:single': {
            data: { id: COMMENT_ID, user_id: TEST_USER_ID, post_id: POST_ID },
            error: null,
          },
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: false },
            error: null,
          },
          'notifications:delete': { data: null, error: null },
          'comments:delete': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/comments/${COMMENT_ID}`).expect(200)

      expect(emitSpy).toHaveBeenCalledWith(
        TEST_USER_ID_2,
        'notification:deleted',
        expect.objectContaining({ type: 'post_comment', commentId: COMMENT_ID }),
      )
    })

    it("n'émet PAS si la notification de commentaire est déjà lue", async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:single': {
            data: { id: COMMENT_ID, user_id: TEST_USER_ID, post_id: POST_ID },
            error: null,
          },
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: true },
            error: null,
          },
          'notifications:delete': { data: null, error: null },
          'comments:delete': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/comments/${COMMENT_ID}`).expect(200)

      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('500 → erreur Supabase sur delete notification commentaire (ligne 348)', async () => {
      app = await createTestApp({
        supabase: {
          'comments:select:single': {
            data: { id: COMMENT_ID, user_id: TEST_USER_ID, post_id: POST_ID },
            error: null,
          },
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: false },
            error: null,
          },
          'notifications:delete': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
          'comments:delete': { data: null, error: null },
        },
      })

      await request(app.getHttpServer()).delete(`/comments/${COMMENT_ID}`).expect(500)
    })
  })

  // ─── deleteByFollow — via DELETE /follows/:userId ─────────────────────────────
  //
  // L'utilisateur authentifié (TEST_USER_ID) se désabonne de TEST_USER_ID_2.
  // NotificationsService lit la notif (actor_id=TEST_USER_ID, user_id=TEST_USER_ID_2)
  // puis émet vers TEST_USER_ID_2 si read=false.

  describe('DELETE /follows/:userId → deleteByFollow', () => {
    it("émet 'notification:deleted' si la notification de follow est non lue", async () => {
      app = await createTestApp({
        supabase: {
          'follows:delete': { data: null, error: null },
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: false },
            error: null,
          },
          'notifications:delete': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/follows/${TEST_USER_ID_2}`).expect(200)

      expect(emitSpy).toHaveBeenCalledWith(
        TEST_USER_ID_2,
        'notification:deleted',
        expect.objectContaining({ type: 'new_follower' }),
      )
    })

    it("n'émet PAS si la notification de follow est déjà lue", async () => {
      app = await createTestApp({
        supabase: {
          'follows:delete': { data: null, error: null },
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: true },
            error: null,
          },
          'notifications:delete': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/follows/${TEST_USER_ID_2}`).expect(200)

      expect(emitSpy).not.toHaveBeenCalled()
    })

    it("n'émet PAS si aucune notification de follow n'existe (PGRST116)", async () => {
      app = await createTestApp({
        supabase: {
          'follows:delete': { data: null, error: null },
          'notifications:select:single': {
            data: null,
            error: { message: 'No rows', code: 'PGRST116', details: null, hint: null },
          },
          'notifications:delete': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).delete(`/follows/${TEST_USER_ID_2}`).expect(200)

      expect(emitSpy).not.toHaveBeenCalled()
    })

    it('500 → erreur Supabase sur delete notification follow (ligne 366)', async () => {
      app = await createTestApp({
        supabase: {
          'follows:delete': { data: null, error: null },
          'notifications:select:single': {
            data: { user_id: TEST_USER_ID_2, read: false },
            error: null,
          },
          'notifications:delete': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
        },
      })

      await request(app.getHttpServer()).delete(`/follows/${TEST_USER_ID_2}`).expect(500)
    })
  })

  // ─── createNotification — via POST /post-likes/:postId ────────────────────
  //
  // PostLikesService.likePost appelle NotificationsService.createNotification
  // après avoir inséré le like. On vérifie les branches de createNotification.

  describe('POST /post-likes/:postId → createNotification', () => {
    it("émet 'notification:new' quand la notification est créée (lignes 161-164)", async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:select:count': { count: 0, data: null, error: null },
          'posts:select:single': {
            data: { id: POST_ID, user_id: TEST_USER_ID_2, vinyl_id: 'vinyl-1' },
            error: null,
          },
          'notifications:insert:single': {
            data: notificationCreateDbFixture,
            error: null,
          },
          'post_likes:insert': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).post(`/post-likes/${POST_ID}`).expect(201)

      expect(emitSpy).toHaveBeenCalledWith(
        TEST_USER_ID_2,
        'notification:new',
        expect.objectContaining({ type: 'post_like' }),
      )
    })

    it("n'émet PAS si insert retourne 23505 duplicate key (ligne 157)", async () => {
      app = await createTestApp({
        supabase: {
          'post_likes:select:count': { count: 0, data: null, error: null },
          'posts:select:single': {
            data: { id: POST_ID, user_id: TEST_USER_ID_2, vinyl_id: 'vinyl-1' },
            error: null,
          },
          'notifications:insert:single': {
            data: null,
            error: { message: 'duplicate key', code: '23505', details: null, hint: null },
          },
          'post_likes:insert': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).post(`/post-likes/${POST_ID}`).expect(201)

      expect(emitSpy).not.toHaveBeenCalled()
    })

    it("n'émet PAS et ne propage pas l'erreur si createNotification échoue (code != 23505, ligne 157)", async () => {
      // PostLikesService catch l'erreur createNotification silencieusement
      app = await createTestApp({
        supabase: {
          'post_likes:select:count': { count: 0, data: null, error: null },
          'posts:select:single': {
            data: { id: POST_ID, user_id: TEST_USER_ID_2, vinyl_id: 'vinyl-1' },
            error: null,
          },
          'notifications:insert:single': {
            data: null,
            error: { message: 'DB error', code: '500', details: null, hint: null },
          },
          'post_likes:insert': { data: null, error: null },
        },
      })
      const emitSpy = jest.spyOn(app.get(EventsService), 'emitToUser').mockImplementation(() => {})

      await request(app.getHttpServer()).post(`/post-likes/${POST_ID}`).expect(201)

      expect(emitSpy).not.toHaveBeenCalled()
    })
  })
})
