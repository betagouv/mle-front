ALTER TABLE "contact_request" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contact_request" ADD COLUMN "anonymized_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "contact_request_purge_idx" ON "contact_request" USING btree ("created_at") WHERE "contact_request"."anonymized_at" is null;