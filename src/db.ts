import mongoose from 'mongoose';
import { Redis } from '@upstash/redis';

// ── MongoDB ──────────────────────────────────────────────

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

const winnerSchema = new mongoose.Schema(
  {
    username: { type: String },
    type: { type: String, enum: ['primary', 'secondary'] },
    status: { type: String, enum: ['verified', 'failed'], default: 'verified' },
  },
  { _id: false }
);

const giveawaySchema = new mongoose.Schema(
  {
    // UUID supplied externally as drawId
    _id: { type: String },
    tweetId: { type: String, required: true },
    hostUsername: { type: String, required: true },
    platform: { type: String, default: 'X' },
    mode: { type: String, required: true },
    totalParticipants: { type: Number, required: true },
    winners: [winnerSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const Giveaway = mongoose.model('Giveaway', giveawaySchema);

// ── Upstash Redis ────────────────────────────────────────

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
