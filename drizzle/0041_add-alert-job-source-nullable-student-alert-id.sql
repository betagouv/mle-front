CREATE TYPE "public"."alert_job_source" AS ENUM('alert', 'favorite');--> statement-breakpoint
DROP INDEX "alert_job_active_unique";--> statement-breakpoint
ALTER TABLE "alert_job" ALTER COLUMN "student_alert_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "alert_job" ADD COLUMN "source" "alert_job_source" DEFAULT 'alert' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_job_alert_active_unique" ON "alert_job" USING btree ("user_id","student_alert_id","accommodation_id") WHERE "alert_job"."source" = 'alert' AND ("alert_job"."status" = 'pending' OR ("alert_job"."status" = 'failed' AND "alert_job"."attempts" < 3));--> statement-breakpoint
CREATE UNIQUE INDEX "alert_job_favorite_active_unique" ON "alert_job" USING btree ("user_id","accommodation_id") WHERE "alert_job"."source" = 'favorite' AND ("alert_job"."status" = 'pending' OR ("alert_job"."status" = 'failed' AND "alert_job"."attempts" < 3));