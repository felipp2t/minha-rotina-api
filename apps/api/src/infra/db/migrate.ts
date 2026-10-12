import { openDatabase } from "./database.js";

const database = await openDatabase();
await database.close();
