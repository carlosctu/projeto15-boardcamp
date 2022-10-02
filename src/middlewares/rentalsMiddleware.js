import { rentalsSchema } from "../schemas/rentalsSchema.js";
import connection from "../database/db.js";

export function rentalsValidationMiddleware(req, res, next) {
  let validation;
  validation = rentalsSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }
  next();
}

export async function rentalExistMiddleware(req, res, next) {
  const { id } = req.params;
  let rentalExists;
  try {
    rentalExists = await connection.query(
      "SELECT * FROM rentals WHERE id = $1",
      [id]
    );
    if (rentalExists.rowCount == 0) return res.sendStatus(404);
  } catch (error) {
    console.log(error);
  }
  res.locals.rentalExists = rentalExists.rows[0];
  next();
}

export async function validateNewRentalMiddleware(req, res, next) {
  const { customerId, gameId } = req.body;
  let gameInfo;
  try {
    const userExists = await connection.query(
      "SELECT * FROM customers WHERE id = $1;",
      [customerId]
    );
    gameInfo = await connection.query("SELECT * FROM games WHERE id = $1;", [
      gameId,
    ]);
    const gameAvailability = gameInfo.rows[0].stockTotal;

    if (gameInfo.rowCount == 0 || userExists.rowCount == 0)
      return res.sendStatus(400);
    if (gameAvailability == 0)
      return res.status(400).send("Não há jogos disponiveis!");
  } catch (error) {
    console.log(error);
  }
  res.locals.gameInfo = gameInfo.rows[0];
  next();
}
