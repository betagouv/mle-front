ALTER TABLE "contact_request" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "contact_request_guest_email_idx" ON "contact_request" USING btree (lower("email")) WHERE "contact_request"."user_id" is null;--> statement-breakpoint
CREATE INDEX "contact_request_ip_hash_created_at_idx" ON "contact_request" USING btree ("ip_hash","created_at");