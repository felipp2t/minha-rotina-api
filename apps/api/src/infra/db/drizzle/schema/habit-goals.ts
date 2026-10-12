import { sql } from "drizzle-orm";
import {
	check,
	date,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { participants } from "./participants.js";

// Stores daily goals and prevents duplicate goals that have not been closed.
export const habitGoals = pgTable(
	"habit_goals",
	{
		id: uuid("id").primaryKey(),
		participantId: uuid("participant_id")
			.notNull()
			.references(() => participants.id),
		name: varchar("name", { length: 100 }).notNull(),
		normalizedName: varchar("normalized_name", { length: 100 }).notNull(),
		dailyTarget: integer("daily_target").notNull(),
		unit: text("unit", { enum: ["ML", "MINUTES", "REPETITIONS"] }).notNull(),
		startDate: date("start_date", { mode: "string" }).notNull(),
		closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" }),
	},
	(table) => [
		check(
			"habit_goals_name_check",
			sql`length(btrim(${table.name})) > 0 and ${table.name} = btrim(${table.name})`,
		),
		check(
			"habit_goals_normalized_name_check",
			sql`${table.normalizedName} = lower(btrim(${table.name}))`,
		),
		check("habit_goals_daily_target_check", sql`${table.dailyTarget} > 0`),
		check(
			"habit_goals_unit_check",
			sql`${table.unit} in ('ML', 'MINUTES', 'REPETITIONS')`,
		),
		uniqueIndex("habit_goals_active_unique")
			.on(table.participantId, table.normalizedName, table.unit)
			.where(sql`${table.closedAt} is null`),
	],
);
