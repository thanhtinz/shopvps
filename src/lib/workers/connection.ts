// BullMQ connection config
export const redisConnection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
} as const;
