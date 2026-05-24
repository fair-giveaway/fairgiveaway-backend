import { redis } from "../../db";

const REDIS_TTL = 900; // 15-minute session window

export async function storeDrawSession(
  drawId: string,
  tweetId: string,
  mode: string,
  participants: string[],
  hostUsername: string,
  hostAvatarUrl?: string
): Promise<void> {
  const tasks = [
    redis.set(`draw:${drawId}`, JSON.stringify(participants), {
      ex: REDIS_TTL,
    }),
    redis.set(`draw:${drawId}:mode`, mode, { ex: REDIS_TTL }),
    redis.set(`draw:${drawId}:tweetId`, tweetId, { ex: REDIS_TTL }),
    redis.set(`draw:${drawId}:hostUsername`, hostUsername, { ex: REDIS_TTL }),
  ];
  if (hostAvatarUrl) {
    tasks.push(
      redis.set(`draw:${drawId}:hostAvatarUrl`, hostAvatarUrl, {
        ex: REDIS_TTL,
      }),
    );
  }
  await Promise.all(tasks);
}

export async function clearDrawSession(drawId: string): Promise<void> {
  await Promise.all([
    redis.del(`draw:${drawId}`),
    redis.del(`draw:${drawId}:mode`),
    redis.del(`draw:${drawId}:tweetId`),
    redis.del(`draw:${drawId}:hostUsername`),
    redis.del(`draw:${drawId}:hostAvatarUrl`),
  ]);
}

export async function loadActiveSession(id: string) {
  const [raw, mode, tweetId, hostUsername, hostAvatarUrl] = await Promise.all([
    redis.get(`draw:${id}`),
    redis.get(`draw:${id}:mode`),
    redis.get(`draw:${id}:tweetId`),
    redis.get(`draw:${id}:hostUsername`),
    redis.get(`draw:${id}:hostAvatarUrl`),
  ]);
  if (!raw) return null;

  const participants = typeof raw === "string" ? JSON.parse(raw) : raw;
  return {
    participants,
    mode,
    tweetId,
    hostUsername,
    hostAvatarUrl,
    drawId: id,
  };
}
