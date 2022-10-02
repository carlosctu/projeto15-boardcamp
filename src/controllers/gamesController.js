import connection from "../database/db.js";
import { gamesOrderBy } from "./orderByController.js";

async function getGames(req, res) {
  const { order, desc } = req.query;
  const { name } = req.query;
  let games;
  try {
    if (order) {
      games = await gamesOrderBy(order, desc);
    } else {
      if (name) {
        games = await connection.query(
          `SELECT categories.name AS "categoryName", games.* 
               FROM categories INNER JOIN games ON categories.id = games."categoryId"
               WHERE games."name" ILIKE $1;`,
          [`${name}%`]
        );
      } else {
        games = await connection.query(
          `SELECT categories.name AS "categoryName", games.* 
             FROM categories INNER JOIN games ON categories.id = games."categoryId"`
        );
      }
    }
    return res.status(200).send(games.rows);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function createGames(req, res) {
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;

  try {
    const gameExists = await connection.query(
      "SELECT * FROM games WHERE name = $1;",
      [name]
    );
    if (gameExists.rowCount != 0)
      return res.status(409).send("Jogo já existe!");

    const categoryExists = await connection.query(
      "SELECT * FROM categories WHERE id = $1;",
      [categoryId]
    );
    if (categoryExists.rowCount == 0) {
      return res.status(400).send("Categoria inexistente!");
    }
    connection.query(
      `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay")
           values ($1, $2, $3, $4, $5);`,
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

export { getGames, createGames };
