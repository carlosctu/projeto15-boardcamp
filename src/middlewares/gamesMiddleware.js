import { gamesSchema } from "../schemas/gamesSchema.js";

export function gamesMiddleware(req, res, next) {
  let validation;
  validation = gamesSchema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }
  next();
}
