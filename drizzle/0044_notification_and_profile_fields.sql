CREATE TYPE "public"."scholarship_status" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "similar_accommodation_alerts_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "favorite_alerts_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "birthdate" date;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "scholarship_status" "scholarship_status";