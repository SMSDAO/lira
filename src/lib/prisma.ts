/**
 * Prisma Client instance for LIRA application
 * Uses singleton pattern to prevent multiple instances in development
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

type MockModel = Record<string, (args?: Record<string, unknown>) => Promise<unknown>>;

function getMockResult(method: string, args?: Record<string, unknown>): unknown {
  switch (method) {
    case 'findMany':
    case 'groupBy':
      return [];
    case 'findFirst':
    case 'findUnique':
      return null;
    case 'create':
    case 'update':
      return args?.data ?? {};
    case 'upsert':
      return args?.create ?? {};
    case 'deleteMany':
      return { count: 0 };
    case 'count':
      return 0;
    case 'aggregate':
      return { _sum: {}, _avg: {}, _count: 0, _min: {}, _max: {} };
    default:
      return {};
  }
}

function createMockModel(): MockModel {
  return new Proxy({} as MockModel, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return async (args?: Record<string, unknown>) => getMockResult(prop, args);
    },
  });
}

function isDbOfflineError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const name = (err as { name?: string }).name ?? '';
  const code = (err as { code?: string }).code ?? '';
  const msg = (err as { message?: string }).message ?? '';
  return (
    name === 'PrismaClientInitializationError' ||
    name === 'PrismaClientRustPanicError' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1003' ||
    code === 'ECONNREFUSED' ||
    /can't reach database server|econnrefused|connection refused|database .* does not exist|authentication failed/i.test(msg)
  );
}

function createResilientPrisma(): PrismaClient {
  let dbOffline = !process.env.DATABASE_URL;
  let realClient: PrismaClient | null = null;

  if (!dbOffline) {
    try {
      realClient = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    } catch {
      dbOffline = true;
      console.warn('[AI Studio] Database not connected — using mock');
    }
  } else {
    console.warn('[AI Studio] Database not connected — using mock');
  }

  const mockModel = createMockModel();

  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (prop === 'then' || typeof prop === 'symbol') return undefined;
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {
          if (dbOffline || !realClient) return;
          try {
            await (realClient[prop] as () => Promise<void>)();
          } catch (err) {
            if (isDbOfflineError(err)) {
              dbOffline = true;
              console.warn('[AI Studio] Database offline — using mock fallback');
            } else {
              throw err;
            }
          }
        };
      }
      if (prop === '$transaction') {
        return async (ops: Array<Promise<unknown>> | ((client: PrismaClient) => Promise<unknown>)) => {
          if (dbOffline || !realClient) {
            if (typeof ops === 'function') return ops(prisma);
            return Promise.all(ops);
          }
          try {
            return await realClient.$transaction(ops as never);
          } catch (err) {
            if (isDbOfflineError(err)) {
              dbOffline = true;
              console.warn('[AI Studio] Database offline — using mock fallback');
              if (typeof ops === 'function') return ops(prisma);
              return Promise.all(ops);
            }
            throw err;
          }
        };
      }
      if (prop === '$queryRaw' || prop === '$executeRaw') {
        return async (...args: unknown[]) => {
          if (dbOffline || !realClient) return [];
          try {
            return await (realClient[prop] as (...a: unknown[]) => Promise<unknown>)(...args);
          } catch (err) {
            if (isDbOfflineError(err)) {
              dbOffline = true;
              return [];
            }
            throw err;
          }
        };
      }

      if (dbOffline || !realClient) {
        return mockModel;
      }

      const realModel = (realClient as unknown as Record<string, unknown>)[prop as string];
      if (!realModel || typeof realModel !== 'object') {
        return mockModel;
      }

      return new Proxy(realModel as MockModel, {
        get(modelTarget, methodProp) {
          if (typeof methodProp !== 'string') return undefined;
          const fn = modelTarget[methodProp];
          if (typeof fn !== 'function') return fn;
          return async (args?: Record<string, unknown>) => {
            if (dbOffline) return getMockResult(methodProp, args);
            try {
              return await fn.call(modelTarget, args);
            } catch (err) {
              if (isDbOfflineError(err)) {
                dbOffline = true;
                console.warn('[AI Studio] Database offline — using mock fallback');
                return getMockResult(methodProp, args);
              }
              throw err;
            }
          };
        },
      });
    },
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma || createResilientPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
