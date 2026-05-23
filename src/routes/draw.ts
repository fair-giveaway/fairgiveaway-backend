import { Elysia, t } from "elysia";
import { Giveaway, redis } from "../db";

const DrawSearchSchema = {
  body: t.Object(
    {
      drawId: t.String({
        description: "The UUID of the draw session to search for.",
        examples: ["550e8400-e29b-41d4-a716-446655440000"],
      }),
    },
    { description: "Search payload containing the draw session UUID." },
  ),
  response: t.Object(
    {
      found: t.Boolean({ description: "True if a draw session (active or finalized) exists." }),
      platform: t.Optional(
        t.String({ description: "Platform of the found draw (e.g. 'X'). Only present when found is true.", examples: ["X"] }),
      ),
    },
    { description: "Search result indicating whether the draw exists." },
  ),
  detail: {
    tags: ["Draw"],
    summary: "Search for a Draw Session",
    description:
      "Searches for a draw session by UUID across MongoDB (finalized) and Redis (active).\n\n" +
      "**Use case:** Routes the user to the correct draw page (active vs. history) after entering a draw ID.",
  },
};

async function handleDrawSearch({ body }: { body: { drawId: string } }) {
  const { drawId } = body;

  const doc = await Giveaway.findById(drawId);
  if (doc) {
    return { found: true, platform: doc.platform };
  }

  const cached = await redis.get(`draw:${drawId}`);
  if (cached) {
    return { found: true, platform: "X" };
  }

  return { found: false };
}

export function drawRoutes() {
  return new Elysia().post(
    "/api/draw/search",
    handleDrawSearch,
    DrawSearchSchema,
  );
}
