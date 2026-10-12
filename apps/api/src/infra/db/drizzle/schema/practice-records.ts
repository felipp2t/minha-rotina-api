import { sql } from "drizzle-orm";
import {
	check,
	date,
	index,
	integer,
	pgTable,
	uuid,
} from "drizzle-orm/pg-core";
import { habitGoals } from "./habit-goals.js";

// Stores quantities practiced for a goal on a calendar date.
export const practiceRecords = pgTable(
	"practice_records",
	{
		id: uuid("id").primaryKey(),
		goalId: uuid("goal_id")
			.notNull()
			.references(() => habitGoals.id),
		date: date("date", { mode: "string" }).notNull(),
		quantity: integer("quantity").notNull(),
	},
	(table) => [
		check("practice_records_quantity_check", sql`${table.quantity} > 0`),
		index("practice_records_goal_date_index").on(
			table.goalId,
			table.date,
			table.id,
		),
	],
);
