export type SupabaseError = {
  message: string
  code: string
  details: null
  hint: null
} | null

export type SupabaseSingleResult<T = unknown> = {
  data: T | null
  error: SupabaseError
}

export type SupabaseArrayResult<T = unknown> = {
  data: T[] | null
  error: SupabaseError
}

export type SupabaseCountResult = {
  count: number | null
  data: null
  error: SupabaseError
}

export type SupabaseMockResult = SupabaseSingleResult | SupabaseArrayResult | SupabaseCountResult

/**
 * Clés disponibles pour configurer les réponses mock.
 *
 * Format : "table:operation"
 *
 * Opérations :
 *   select:single  → .from(t).select().eq().single()
 *   select:many    → .from(t).select().eq()            (tableau direct)
 *   select:count   → .from(t).select('*', { count: 'exact', head: true }).eq()
 *   insert:single  → .from(t).insert({}).select().single()
 *   insert         → .from(t).insert({})               (sans .single())
 *   delete         → .from(t).delete().eq()
 *   update:single  → .from(t).update({}).eq().single()
 *   update         → .from(t).update({}).eq()
 *
 * Exemples :
 *   'vinyls:select:single'
 *   'follows:select:many'
 *   'follows:select:count'
 *   'posts:insert:single'
 *   'post_likes:delete'
 */
export type SupabaseMockResponses = Partial<
  Record<string, SupabaseMockResult | SupabaseMockResult[]>
>

type QueryOperation =
  | 'select:many'
  | 'select:single'
  | 'select:count'
  | 'insert'
  | 'insert:single'
  | 'delete'
  | 'update'
  | 'update:single'

/**
 * Simule le query builder de Supabase.
 * Chaînable, thenable — se comporte comme un PostgrestFilterBuilder.
 */
class QueryBuilder implements PromiseLike<SupabaseMockResult> {
  private _table: string
  private _responses: SupabaseMockResponses
  private _operation: QueryOperation = 'select:many'

  constructor(table: string, responses: SupabaseMockResponses) {
    this._table = table
    this._responses = responses
  }

  // ─── Opérations principales ──────────────────────────────────────────────

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    // Si on est déjà en mode insert/update (ex: .insert({}).select().single()),
    // on ne change pas l'opération — on reste en mode "insert" pour que
    // single() la transforme en "insert:single"
    if (this._operation !== 'insert' && this._operation !== 'update') {
      this._operation = options?.count === 'exact' ? 'select:count' : 'select:many'
    }
    return this
  }

  insert(_data: unknown) {
    this._operation = 'insert'
    return this
  }

  delete() {
    this._operation = 'delete'
    return this
  }

  update(_data: unknown) {
    this._operation = 'update'
    return this
  }

  // ─── Filtres (ignorés dans le mock, retournent this) ─────────────────────

  eq(_column?: string, _value?: unknown) {
    return this
  }
  neq(_column?: string, _value?: unknown) {
    return this
  }
  in(_column?: string, _values?: unknown[]) {
    return this
  }
  not(_column?: string, _op?: string, _value?: unknown) {
    return this
  }
  or(_filters?: string) {
    return this
  }
  order(_column?: string, _options?: unknown) {
    return this
  }
  limit(_count?: number) {
    return this
  }
  range(_from?: number, _to?: number) {
    return this
  }
  lt(_column?: string, _value?: unknown) {
    return this
  }
  lte(_column?: string, _value?: unknown) {
    return this
  }
  gt(_column?: string, _value?: unknown) {
    return this
  }
  gte(_column?: string, _value?: unknown) {
    return this
  }
  ilike(_column?: string, _pattern?: unknown) {
    return this
  }
  is(_column?: string, _value?: unknown) {
    return this
  }

  // ─── Terminaux ───────────────────────────────────────────────────────────

  /**
   * .single() → change l'opération en :single et résout immédiatement.
   * Utilisé pour : select:single, insert:single, update:single
   */
  single(): Promise<SupabaseMockResult> {
    if (this._operation === 'select:many') {
      this._operation = 'select:single'
    } else if (this._operation === 'insert') {
      this._operation = 'insert:single'
    } else if (this._operation === 'update') {
      this._operation = 'update:single'
    }
    return this._resolve()
  }

  /**
   * Implémentation PromiseLike — permet d'awaiter directement la chaîne
   * sans appeler .single() (cas array, delete, count).
   */
  then<TResult1 = SupabaseMockResult, TResult2 = never>(
    onfulfilled?: ((value: SupabaseMockResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._resolve().then(onfulfilled, onrejected)
  }

  // ─── Résolution ──────────────────────────────────────────────────────────

  private _resolve(): Promise<SupabaseMockResult> {
    const key = `${this._table}:${this._operation}`
    const configured = this._responses[key]

    if (Array.isArray(configured)) {
      // Consomme les réponses séquentiellement, reste sur la dernière
      const result = configured.length > 1 ? configured.shift()! : configured[0]
      return Promise.resolve(result)
    }

    const response = configured ?? this._getDefault()
    return Promise.resolve(response)
  }

  /**
   * Valeurs par défaut raisonnables quand la clé n'est pas configurée dans
   * le test. Évite les crashes pour les appels "collatéraux" (ex: comptage
   * de likes dans un feed, alors qu'on teste uniquement la création de post).
   */
  private _getDefault(): SupabaseMockResult {
    switch (this._operation) {
      case 'select:count':
        return { count: 0, data: null, error: null }
      case 'select:many':
        return { data: [], error: null }
      case 'select:single':
        return {
          data: null,
          error: { message: 'Row not found', code: 'PGRST116', details: null, hint: null },
        }
      case 'insert':
      case 'insert:single':
      case 'delete':
      case 'update':
      case 'update:single':
        return { data: null, error: null }
    }
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────

const createClient = (responses: SupabaseMockResponses) => ({
  from: (table: string) => new QueryBuilder(table, responses),
})

/**
 * Mock du SupabaseService NestJS.
 * Expose getClient() et getClientWithAuth() — tous deux retournent
 * le même client mocké (RLS ignoré en test).
 */
export const createSupabaseServiceMock = (responses: SupabaseMockResponses) => ({
  getClient: jest.fn(() => createClient(responses)),
  getClientWithAuth: jest.fn((_token: string) => createClient(responses)),
})
