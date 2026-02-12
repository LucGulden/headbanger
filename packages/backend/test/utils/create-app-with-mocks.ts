import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { SupabaseService } from '../../src/common/database/supabase.service'
import { RedisService } from '../../src/redis/redis.service'
import { createSupabaseServiceMock, SupabaseMockResponses } from '../mocks/supabase.mock'
import { createRedisServiceMock } from '../mocks/redis.mock'

export async function createAppWithSupabaseMock(responses: SupabaseMockResponses): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SupabaseService)
    .useValue(createSupabaseServiceMock(responses))
    .overrideProvider(RedisService)
    .useValue(createRedisServiceMock())
    .compile()

  const app = moduleFixture.createNestApplication()
  await app.init()
  return app
}
