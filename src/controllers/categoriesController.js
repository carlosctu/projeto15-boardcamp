import connection from "../database/db.js";
import { defaultOrderBy } from "./orderByController.js";

async function getCategories(req, res) {
  const { order, desc } = req.query;
  let categories;
  try {
    if (order) {
      categories = await defaultOrderBy("categories", order, desc);
    } else {
      categories = await connection.query("SELECT * FROM categories;");
    }
    return res.status(200).send(categories.rows);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function createCategory(req, res) {
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
  }
  return res.sendStatus(404);
}
export { getCategories, createCategory };
