import pg from "pg";
import express from "express";
import cors from "cors";
import joi from "joi";

const { Pool } = pg;
const server = express();
server.use(express.json());
server.use(cors());

const connection = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "123456",
  database: "postgres",
});

server.get("/categories", async (req, res) => {
  try {
    const categories = await connection.query("SELECT * FROM categories;");

    res.status(200).send(categories.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(404);
  }
});

server.post("/categories", async (req, res) => {
  const { name } = req.body;

  if (!name) return res.sendStatus(400);

  try {
    const nameExists = await connection.query(
      "SELECT * FROM categories WHERE name = $1;",
      [name]
    );
    if (nameExists.rowCount != 0) return res.sendStatus(409);

    connection.query("INSERT INTO categories (name) values ($1);", [name]);
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.sendStatus(404);
  }
});

const gamesSchema = joi.object({
  name: joi.string().required(),
  image: joi.string().required(),
  stockTotal: joi.number().positive().required(),
  categoryId: joi.number().required(),
  pricePerDay: joi.number().positive().required(),
});

server.get("/games", async (req, res) => {
  const { name } = req.query;
  let games;
  try {
    if (name) {
      games = await connection.query(
        `SELECT categories.name AS "categoryName", games.* 
         FROM categories INNER JOIN games ON categories.id = games."categoryId"
         WHERE games."name" LIKE $1;`,
        [`${name}%`]
      );
    } else {
      games = await connection.query(
        `SELECT categories.name AS "categoryName", games.* 
       FROM categories INNER JOIN games ON categories.id = games."categoryId"`
      );
    }
    res.status(200).send(games.rows);
  } catch (error) {
    console.log(error);
    res.sendStatus(404);
  }
});

server.post("/games", async (req, res) => {
  let validation;
  const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
  validation = gamesSchema.validate(req.body, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }

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
    return res.sendStatus(404);
  }
});

server.listen(4000, () => {
  console.log("Magic happens on port 4000");
});
