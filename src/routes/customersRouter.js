import express from "express";
import * as customersController from "../controllers/customersController.js";
import { customerMiddleware } from "../middlewares/customersMiddleware.js";

const customersRouter = express.Router();

customersRouter.get("/customers", customersController.getCustomers);
customersRouter.get("/customers/:id", customersController.getCustomerById);
customersRouter.post(
  "/customers",
  customerMiddleware,
  customersController.createCustomer
);
customersRouter.put(
  "/customers/:id",
  customerMiddleware,
  customersController.updateCustomer
);

export default customersRouter;
