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
         WHERE LOWER (games."name") LIKE $1;`,
        [`${name.toLowerCase()}%`]
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

server.listen(4000, () => {
  console.log("Magic happens on port 4000");
});
