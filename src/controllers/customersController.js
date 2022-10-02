import connection from "../database/db.js";
import { defaultOrderBy } from "./orderByController.js";

async function getCustomers(req, res) {
  const { order, desc } = req.query;
  const { cpf } = req.query;
  let customers;
  try {
    if (order) {
      customers = await defaultOrderBy("customers", order, desc);
    } else {
      if (cpf) {
        customers = await connection.query(
          "SELECT * FROM customers WHERE cpf LIKE $1;",
          [`${cpf}%`]
        );
      } else {
        customers = await connection.query("SELECT * FROM customers;");
      }
    }
    return res.status(200).send(customers.rows);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function getCustomerById(req, res) {
  const { id } = req.params;
  try {
    const customer = await connection.query(
      "SELECT * FROM customers WHERE id = $1;",
      [id]
    );
    if (customer.rowCount == 0) return res.sendStatus(404);
    return res.status(200).send(customer.rows[0]);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

async function createCustomer(req, res) {
  const { name, phone, cpf, birthday } = req.body;

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
  }
  return res.sendStatus(404);
}

async function updateCustomer(req, res) {
  const { name, phone, cpf, birthday } = req.body;
  const { id } = req.params;

  const cpfExists = await connection.query(
    "SELECT * FROM customers WHERE id = $1;",
    [id]
  );
  if (cpfExists.rowCount == 0) return res.sendStatus(404);
  if (cpf != cpfExists.rows[0].cpf) return res.sendStatus(409);
  try {
    await connection.query(
      "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;",
      [name, phone, cpf, birthday, id]
    );
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
  }
  return res.sendStatus(404);
}

export { getCustomers, getCustomerById, createCustomer, updateCustomer };
