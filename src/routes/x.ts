import { Elysia, t } from 'elysia';
import { v4 as uuidv4 } from 'uuid';
import { Giveaway, redis } from '../db';
import { scrapeTweet } from '../scraper';

const REDIS_TTL = 900; // 15-minute session window

// ── Helpers ──────────────────────────────────────────────

async function storeDrawSession(
  drawId: string,
  tweetId: string,
  mode: string,
  participants: string[]
): Promise<void> {
  await Promise.all([
    redis.set(`draw:${drawId}`, JSON.stringify(participants), { ex: REDIS_TTL }),
    redis.set(`draw:${drawId}:mode`, mode, { ex: REDIS_TTL }),
    redis.set(`draw:${drawId}:tweetId`, tweetId, { ex: REDIS_TTL }),
  ]);
}

async function clearDrawSession(drawId: string): Promise<void> {
  await Promise.all([
    redis.del(`draw:${drawId}`),
    redis.del(`draw:${drawId}:mode`),
    redis.del(`draw:${drawId}:tweetId`),
  ]);
}

async function loadActiveSession(id: string) {
  const [raw, mode, tweetId] = await Promise.all([
    redis.get(`draw:${id}`),
    redis.get(`draw:${id}:mode`),
    redis.get(`draw:${id}:tweetId`),
  ]);
  if (!raw) return null;

  const participants =
    typeof raw === 'string' ? JSON.parse(raw) : raw;
  return { participants, mode, tweetId, drawId: id };
}

// ── Routes ───────────────────────────────────────────────

export function xRoutes(): Elysia {
  return new Elysia()

    // Scrape participants and open a 15-min draw session
    .post(
      '/api/x/draw/init',
      async ({ body, set }) => {
        const { tweetId, mode } = body;
        const participants = await scrapeTweet(tweetId, mode);

        if (participants.length === 0) {
          set.status = 400;
          return { error: 'No participants found for this tweet' };
        }

        const drawId = uuidv4();
        await storeDrawSession(drawId, tweetId, mode, participants);

        return { drawId, participantCount: participants.length };
      },
      {
        body: t.Object({
          tweetId: t.String(),
          mode: t.Union([t.Literal('likes'), t.Literal('reposts')]),
        }),
      }
    )

    // Check draw status — finalized (Mongo) or active (Redis)
    .get('/api/x/draw/status/:id', async ({ params, set }) => {
      const { id } = params;

      const doc = await Giveaway.findById(id);
      if (doc) {
        return { status: 'finalized', data: doc };
      }

      const session = await loadActiveSession(id);
      if (session) {
        return { status: 'active', ...session };
      }

      set.status = 404;
      return { error: 'Draw not found or expired' };
    })

    // Persist draw results to MongoDB, release Redis session
    .post(
      '/api/x/draw/save',
      async ({ body }) => {
        const { drawId, tweetId, hostUsername, mode, totalParticipants, winners } = body;

        const giveaway = new Giveaway({
          _id: drawId,
          tweetId,
          hostUsername,
          mode,
          totalParticipants,
          winners,
        });
        await giveaway.save();
        await clearDrawSession(drawId);

        return { success: true };
      },
      {
        body: t.Object({
          drawId: t.String(),
          tweetId: t.String(),
          hostUsername: t.String(),
          mode: t.String(),
          totalParticipants: t.Number(),
          winners: t.Array(
            t.Object({
              username: t.String(),
              type: t.String(),
              status: t.String(),
            })
          ),
        }),
      }
    )

    // 20 most recent finalized giveaways
    .get('/api/x/giveaways/history', async () => {
      return await Giveaway.find({ platform: 'X' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    })

    // Top 20 hosts ranked by total giveaways run
    .get('/api/x/giveaways/leaderboard', async () => {
      return await Giveaway.aggregate([
        { $match: { platform: 'X' } },
        {
          $group: {
            _id: '$hostUsername',
            totalGiveaways: { $sum: 1 },
            totalParticipants: { $sum: '$totalParticipants' },
          },
        },
        { $sort: { totalGiveaways: -1 } },
        { $limit: 20 },
      ]);
    });
}
