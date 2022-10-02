import connection from "../database/db.js";

export async function defaultOrderBy(table, order, desc) {
  let data;
  if (desc == "true") {
    data = await connection.query(
      `SELECT * FROM ${table} ORDER BY ${order} DESC;`
    );
  } else {
    data = await connection.query(
      `SELECT * FROM ${table} order by ${order} ASC;`
    );
  }
  return data;
}

export async function gamesOrderBy(order, desc) {
  let data;
  if (desc == "true") {
    data = await connection.query(
      `SELECT categories.name AS "categoryName", games.* 
               FROM categories INNER JOIN games ON categories.id = games."categoryId" ORDER BY ${order} DESC;`
    );
  } else {
    data = await connection.query(
      `SELECT categories.name AS "categoryName", games.* 
        FROM categories INNER JOIN games ON categories.id = games."categoryId" ORDER BY ${order} ASC;`
    );
  }
  return data;
}

export async function rentalsOrderBy(order, desc) {
  let data;
  if (desc == "true") {
    data = await connection.query(
      `SELECT r.*, json_build_object('id', c.id, 'name', c.name) AS "customer",  
        json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', ca.name) AS "game"
        FROM rentals r
        INNER JOIN games g on g.id = "gameId"
        INNER JOIN customers c on c.id = "customerId"
        INNER JOIN categories ca on ca.id = g."categoryId" ORDER BY "${order}" DESC;`
    );
  } else {
    data = await connection.query(
      `SELECT r.*, json_build_object('id', c.id, 'name', c.name) AS "customer",  
        json_build_object('id', g.id, 'name', g.name, 'categoryId', g."categoryId", 'categoryName', ca.name) AS "game"
        FROM rentals r
        INNER JOIN games g on g.id = "gameId"
        INNER JOIN customers c on c.id = "customerId"
        INNER JOIN categories ca on ca.id = g."categoryId" ORDER BY "${order}" ASC;`
    );
  }
  return data;
}
