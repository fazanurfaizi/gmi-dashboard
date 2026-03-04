import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '~~/server/database/schema'
import type { H3Event } from 'h3'

// const sqlite = new Database('sqlite.db')

export const useDrizzle = (event: H3Event): DrizzleD1Database<typeof schema> =>  {
    const dbBinding = event.context.cloudflare.env.DB
    return drizzle(dbBinding, { schema })
}

export type Db = ReturnType<typeof useDrizzle>

export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]