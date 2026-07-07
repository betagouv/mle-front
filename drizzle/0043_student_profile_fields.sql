CREATE TYPE "public"."scholarship_status" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "birthdate" date;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "scholarship_status" "scholarship_status";