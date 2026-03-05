import { Redis } from 'ioredis';

let pubClient: Redis;
let subClient: Redis;

export async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  pubClient = new Redis(url);
  subClient = pubClient.duplicate();

  pubClient.on('connect', () => console.log('✅ Redis connected'));
  pubClient.on('error', (err) => console.error('❌ Redis error:', err));
}

export function getRedisClients() {
  if (!pubClient || !subClient) throw new Error('Redis not initialized');
  return { pubClient, subClient };
}