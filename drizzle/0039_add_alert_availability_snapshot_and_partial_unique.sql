CREATE TABLE "alert_availability_snapshot" (
	"accommodation_id" bigint PRIMARY KEY NOT NULL,
	"available_count" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_job" DROP CONSTRAINT "alert_job_unique";--> statement-breakpoint
ALTER TABLE "alert_availability_snapshot" ADD CONSTRAINT "alert_availability_snapshot_accommodation_id_accommodation_accommodation_id_fk" FOREIGN KEY ("accommodation_id") REFERENCES "public"."accommodation_accommodation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_job_unsent_unique" ON "alert_job" USING btree ("user_id","student_alert_id","accommodation_id") WHERE "alert_job"."status" <> 'sent';