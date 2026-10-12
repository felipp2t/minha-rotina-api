import { sql } from "drizzle-orm";
import { check, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

// Stores participants and guarantees normalized, unique email addresses.
export const participants = pgTable(
	"participants",
	{
		id: uuid("id").primaryKey(),
		name: varchar("name", { length: 100 }).notNull(),
		email: text("email").notNull().unique("participants_email_unique"),
	},
	(table) => [
		check(
			"participants_name_check",
			sql`length(btrim(${table.name})) > 0 and ${table.name} = btrim(${table.name})`,
		),
		check(
			"participants_email_check",
			sql`length(${table.email}) > 0 and ${table.email} = lower(btrim(${table.email}))`,
		),
	],
);
