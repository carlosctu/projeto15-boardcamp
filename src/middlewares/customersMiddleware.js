import { customerSchema } from "../schemas/customerSchema.js";

export function customerMiddleware(req, res, next) {
  let validation;
  validation = customerSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }
  next();
}
