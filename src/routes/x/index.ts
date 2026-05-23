import { Elysia } from "elysia";
import * as handlers from "./handlers";
import * as schemas from "./schemas";

export function xScrapeRoutes() {
  return new Elysia().post(
    "/api/x/draw/init",
    handlers.handleInitDraw,
    schemas.InitDrawRoute,
  );
}

export function xRoutes() {
  return new Elysia()
    .post("/api/x/verify", handlers.handleVerifyCandidate, schemas.VerifyCandidateRoute)
    .get("/api/x/draw/status/:id", handlers.handleDrawStatus, schemas.DrawStatusRoute)
    .post("/api/x/draw/save", handlers.handleSaveDraw, schemas.SaveDrawRoute)
    .get("/api/x/giveaways/history", handlers.handleHistory, schemas.HistoryRoute)
    .get("/api/x/giveaways/tweet/:tweetId", handlers.handleTweetHistory, schemas.TweetHistoryRoute)
    .get("/api/x/giveaways/leaderboard", handlers.handleLeaderboard, schemas.LeaderboardRoute);
}
