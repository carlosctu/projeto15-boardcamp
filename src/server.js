import pg from "pg";
import express, { query } from "express";
import cors from "cors";
import joi from "joi";
import dayjs from "dayjs";

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
         WHERE games."name" ILIKE $1;`,
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

const customerSchema = joi.object({
  name: joi.string().required(),
  phone: joi.string().min(10).max(11).required(),
  cpf: joi
    .string()
    .pattern(/^[0-9]+$/)
    .min(11)
    .max(11)
    .required(),
  birthday: joi.string().required(),
});

server.get("/customers", async (req, res) => {
  const { cpf } = req.query;
  let customers;
  try {
    if (cpf) {
      customers = await connection.query(
        "SELECT * FROM customers WHERE cpf LIKE $1;",
        [`${cpf.toLowerCase()}%`]
      );
    } else {
      customers = await connection.query("SELECT * FROM customers;");
    }
    return res.status(200).send(customers.rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});
server.get("/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await connection.query(
      "SELECT * FROM customers WHERE id = $1;",
      [id]
    );
    if (customer.rowCount == 0) return res.sendStatus(404);
    return res.status(200).send(customer.rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});
server.post("/customers", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  let validation;
  validation = customerSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }

  try {
    const cpfExists = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1;",
      [cpf]
    );
    if (cpfExists.rowCount != 0) return res.sendStatus(409);

    connection.query(
      "INSERT INTO customers (name, phone, cpf, birthday) values ($1, $2, $3, $4);",
      [name, phone, cpf, birthday]
    );
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});
server.put("/customers/:id", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  const { id } = req.params;
  if (!id) return res.sendStatus(404);

  let validation;
  validation = customerSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }

  try {
    await connection.query(
      "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;",
      [name, phone, cpf, birthday, id]
    );
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});

const rentalsSchema = joi.object({
  customerId: joi.number().required(),
  gameId: joi.number().required(),
  daysRented: joi.number().positive().required(),
});

server.get("/rentals", async (req, res) => {
  let rental;
  const query = req.query;

  if (query) {
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
    rental = await connection.query(
      `SELECT r.*, json_build_object('id', c.id, 'name', c.name) AS "customer",  
      json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', ca.name) AS "game"
      FROM rentals r
      INNER JOIN games g on g.id = "gameId"
      INNER JOIN customers c on c.id = "customerId"
      INNER JOIN categories ca on ca.id = g."categoryId";`
    );
    return res.status(200).send(rental.rows);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});
server.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;
  const todayDate = new Date();
  let validation;
  validation = rentalsSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((error) => error.message);
    return res.status(400).send(errors);
  }

  try {
    const userExists = await connection.query(
      "SELECT * FROM customers WHERE id = $1;",
      [customerId]
    );
    const gameInfo = await connection.query(
      "SELECT * FROM games WHERE id = $1;",
      [gameId]
    );
    const gameAvailability = gameInfo.rows[0].stockTotal;

    if (gameInfo.rowCount == 0 || userExists.rowCount == 0)
      return res.sendStatus(400);
    if (gameAvailability == 0)
      return res.status(400).send("Não há jogos disponiveis!");

    const originalPrice = gameInfo.rows[0].pricePerDay * daysRented;

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
    return res.sendStatus(404);
  }
});
server.post("/rentals/:id/return", async (req, res) => {
  const { id } = req.params;
  const todayDate = new Date();
  try {
    const rentalExists = await connection.query(
      "SELECT * FROM rentals WHERE id = $1",
      [id]
    );
    if (rentalExists.rowCount == 0) return res.sendStatus(404);
    if (rentalExists.rows[0].returnDate != null)
      return res.status(400).send("Jogo já devolvido!");
    const returnDate = rentalExists.rows[0].rentDate;
    const diff = (todayDate - returnDate) / (1000 * 24 * 60 * 60);
    //const lea = data.split('T')[0];
    console.log(rentalExists.rows[0].rentDate);
    console.log(todayDate);
    console.log(diff);
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});
server.delete("/rentals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const rentalExists = await connection.query(
      "SELECT * FROM rentals WHERE id = $1",
      [id]
    );

    if (rentalExists.rowCount == 0) return res.sendStatus(404);
    if (rentalExists.rows[0].returnDate == null)
      return res.status(400).send("Jogo não devolvido!");

    connection.query("DELETE FROM rentals WHERE id = $1", [id]);
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(404);
  }
});
server.listen(4000, () => {
  console.log("Magic happens on port 4000");
});
