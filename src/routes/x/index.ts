import { Elysia } from "elysia";
import * as handlers from "./handlers";
import * as routes from "./routes";

export function xScrapeRoutes() {
  return new Elysia().post(
    "/api/x/draw/init",
    handlers.handleInitDraw,
    routes.InitDrawRoute,
  );
}

export function xRoutes() {
  return new Elysia()
    .post("/api/x/verify", handlers.handleVerifyCandidate, routes.VerifyCandidateRoute)
    .get("/api/x/draw/status/:id", handlers.handleDrawStatus, routes.DrawStatusRoute)
    .post("/api/x/draw/save", handlers.handleSaveDraw, routes.SaveDrawRoute)
    .get("/api/x/giveaways/history", handlers.handleHistory, routes.HistoryRoute)
    .get("/api/x/giveaways/tweet/:tweetId", handlers.handleTweetHistory, routes.TweetHistoryRoute)
    .get("/api/x/giveaways/leaderboard", handlers.handleLeaderboard, routes.LeaderboardRoute);
}
