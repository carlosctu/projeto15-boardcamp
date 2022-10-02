import express from "express";
import * as categoriesController from "../controllers/categoriesController.js";

const categoriesRouter = express.Router();

categoriesRouter.get("/categories", categoriesController.getCategories);
categoriesRouter.post("/categories", categoriesController.createCategory);

export default categoriesRouter;
