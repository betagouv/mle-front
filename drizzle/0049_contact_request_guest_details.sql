ALTER TABLE "contact_request" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_request" ADD COLUMN "firstname" text;--> statement-breakpoint
ALTER TABLE "contact_request" ADD COLUMN "lastname" text;--> statement-breakpoint
ALTER TABLE "contact_request" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "contact_request" ADD COLUMN "phone" text;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_request_guest_email_accommodation_unique" ON "contact_request" USING btree ("accommodation_id",lower("email")) WHERE "contact_request"."user_id" is null;