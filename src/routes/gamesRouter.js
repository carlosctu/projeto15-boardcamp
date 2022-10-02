import express from "express";
import * as gamesController from "../controllers/gamesController.js";
import { gamesMiddleware } from "../middlewares/gamesMiddleware.js";

const gamesRouter = express.Router();

gamesRouter.get("/games", gamesController.getGames);
gamesRouter.post("/games", gamesMiddleware, gamesController.createGames);

export default gamesRouter;
