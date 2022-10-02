import express from "express";
import * as rentalsController from "../controllers/rentalsController.js";
import {
  rentalExistMiddleware,
  rentalsValidationMiddleware,
  validateNewRentalMiddleware,
} from "../middlewares/rentalsMiddleware.js";

const rentalsRouter = express.Router();

rentalsRouter.get("/rentals", rentalsController.getRentals);
rentalsRouter.post(
  "/rentals",
  rentalsValidationMiddleware,
  validateNewRentalMiddleware,
  rentalsController.createRental
);
rentalsRouter.post(
  "/rentals/:id/return",
  rentalExistMiddleware,
  rentalsController.returnRental
);
rentalsRouter.delete(
  "/rentals/:id",
  rentalExistMiddleware,
  rentalsController.deleteRental
);

export default rentalsRouter;
