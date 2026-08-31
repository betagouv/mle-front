ALTER TABLE "owner" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "owner" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "owner" ADD CONSTRAINT "owner_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;