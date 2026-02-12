export type SupabaseSingleResult = { data: unknown; error: unknown }

export type SupabaseMockResponses = Record<string, SupabaseSingleResult>

export const createSupabaseMock = (responses: SupabaseMockResponses) => {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(async () => {
      const res = responses['vinyls:getById']
      return res ?? { data: null, error: 'Not mocked' }
    }),
  }
}

export const createSupabaseServiceMock = (responses: SupabaseMockResponses) => ({
  getClient: jest.fn(() => createSupabaseMock(responses)),
})
