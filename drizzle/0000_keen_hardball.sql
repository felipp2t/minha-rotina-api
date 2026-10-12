CREATE TABLE "habit_goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"participant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"normalized_name" varchar(100) NOT NULL,
	"daily_target" integer NOT NULL,
	"unit" text NOT NULL,
	"start_date" date NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "habit_goals_name_check" CHECK (length(btrim("habit_goals"."name")) > 0 and "habit_goals"."name" = btrim("habit_goals"."name")),
	CONSTRAINT "habit_goals_normalized_name_check" CHECK ("habit_goals"."normalized_name" = lower(btrim("habit_goals"."name"))),
	CONSTRAINT "habit_goals_daily_target_check" CHECK ("habit_goals"."daily_target" > 0),
	CONSTRAINT "habit_goals_unit_check" CHECK ("habit_goals"."unit" in ('ML', 'MINUTES', 'REPETITIONS'))
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "participants_email_unique" UNIQUE("email"),
	CONSTRAINT "participants_name_check" CHECK (length(btrim("participants"."name")) > 0 and "participants"."name" = btrim("participants"."name")),
	CONSTRAINT "participants_email_check" CHECK (length("participants"."email") > 0 and "participants"."email" = lower(btrim("participants"."email")))
);
--> statement-breakpoint
CREATE TABLE "practice_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"goal_id" uuid NOT NULL,
	"date" date NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "practice_records_quantity_check" CHECK ("practice_records"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "habit_goals" ADD CONSTRAINT "habit_goals_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_records" ADD CONSTRAINT "practice_records_goal_id_habit_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."habit_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "habit_goals_active_unique" ON "habit_goals" USING btree ("participant_id","normalized_name","unit") WHERE "habit_goals"."closed_at" is null;--> statement-breakpoint
CREATE INDEX "practice_records_goal_date_index" ON "practice_records" USING btree ("goal_id","date","id");