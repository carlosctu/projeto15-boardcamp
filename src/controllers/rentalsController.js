import connection from "../database/db.js";
import { rentalsOrderBy } from "./orderByController.js";

async function getRentals(req, res) {
  const { order, desc } = req.query;
  const query = req.query;
  let rental;
  if (Object.keys(query).length != 0 && !order) {
    try {
      if (Object.keys(query)[0] == "gameId") {
        rental = await connection.query(
          `SELECT r.*, json_build_object('id', c.id, 'name', c.name) AS "customer",  
              json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', ca.name) AS "game"
              FROM rentals r
              INNER JOIN games g on g.id = "gameId"
              INNER JOIN customers c on c.id = "customerId"
              INNER JOIN categories ca on ca.id = g."categoryId"
              WHERE "gameId" = $1;`,
          [Object.values(query)[0]]
        );
      } else {
        rental = await connection.query(
          `SELECT r.*, json_build_object('id', c.id, 'name', c.name) AS "customer",  
              json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', ca.name) AS "game"
              FROM rentals r
              INNER JOIN games g on g.id = "gameId"
              INNER JOIN customers c on c.id = "customerId"
              INNER JOIN categories ca on ca.id = g."categoryId"
              WHERE "customerId" = $1;`,
          [Object.values(query)[0]]
        );
      }
      return res.status(200).send(rental.rows);
    } catch (error) {
      console.log(error);
      return res.sendStatus(404);
    }
  }
  try {
    if (order) {
      rental = await rentalsOrderBy(order, desc);
    } else {
      rental = await connection.query(
        `SELECT r.*, json_build_object('id', c.id, 'name', c.name) AS "customer",  
            json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', ca.name) AS "game"
            FROM rentals r
            INNER JOIN games g on g.id = "gameId"
            INNER JOIN customers c on c.id = "customerId"
            INNER JOIN categories ca on ca.id = g."categoryId";`
      );
    }
    return res.status(200).send(rental.rows);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function createRental(req, res) {
  const { customerId, gameId, daysRented } = req.body;
  const todayDate = new Date();
  const gameInfo = res.locals.gameInfo;
  const gameAvailability = gameInfo.stockTotal;
  const originalPrice = gameInfo.pricePerDay * daysRented;
  try {
    connection.query(
      `INSERT INTO rentals
          ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
           VALUES ($1, $2, $3, $4, null, $5, null);`,
      [customerId, gameId, todayDate, daysRented, originalPrice]
    );
    connection.query(`UPDATE games SET "stockTotal" = $1 WHERE id = $2;`, [
      gameAvailability - 1,
      gameId,
    ]);
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function returnRental(req, res) {
  const { id } = req.params;
  const rentalInfo = res.locals.rentalExists;
  const todayDate = new Date();
  let delayFee = null;
  try {
    if (rentalInfo.returnDate != null)
      return res.status(400).send("Jogo já devolvido!");

    const gameInfo = await connection.query(
      "SELECT * from games WHERE id = $1",
      [rentalInfo.gameId]
    );
    const stockTotal = gameInfo.rows[0].stockTotal;
    const pricePerDay = gameInfo.rows[0].pricePerDay;
    const daysRented = rentalInfo.daysRented;
    const returnDate = rentalInfo.rentDate;
    const daysDiff = (todayDate - returnDate) / (1000 * 24 * 60 * 60);

    if (daysDiff > daysRented) {
      delayFee = Math.round((daysDiff - daysRented) * pricePerDay);
    }

    await connection.query(
      `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3;`,
      [todayDate, delayFee, id]
    );
    await connection.query(
      `UPDATE games SET "stockTotal" = $1 WHERE id = $2;`,
      [stockTotal + 1, rentalInfo.gameId]
    );

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function deleteRental(req, res) {
  const { id } = req.params;
  const rentalInfo = res.locals.rentalExists;
  try {
    if (rentalInfo.returnDate == null)
      return res.status(400).send("Jogo não devolvido!");
    connection.query("DELETE FROM rentals WHERE id = $1", [id]);
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
}

export { getRentals, createRental, returnRental, deleteRental };
