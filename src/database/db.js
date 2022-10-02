import pg from "pg";
import dotenv from "dotenv";

const { Pool } = pg;
//dotenv.config();

const connection = new Pool({
host: "localhost",
port: 5432,
user: "postgres",
password: "123456",
database: "postgres",
});
//const connection = new Pool({
 // connectionString: process.env.DATABASE_URL,
//});

export default connection;
