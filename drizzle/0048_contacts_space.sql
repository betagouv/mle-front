CREATE TYPE "public"."owner_contact_mode" AS ENUM('none', 'contacts', 'dossier_facile');--> statement-breakpoint
CREATE TABLE "contact_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"accommodation_slug" varchar(255) NOT NULL,
	"apartment_type" text,
	"status" text DEFAULT 'a_contacter' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_request_user_id_accommodation_slug_unique" UNIQUE("user_id","accommodation_slug")
);
--> statement-breakpoint
ALTER TABLE "dossier_facile_application" ALTER COLUMN "status" SET DEFAULT 'a_moderer';--> statement-breakpoint
-- Backfill: statuts de candidature vers le nouveau vocabulaire
UPDATE "dossier_facile_application" SET "status" = CASE "status"
  WHEN 'pending' THEN 'a_moderer'
  WHEN 'accepted' THEN 'a_contacter'
  WHEN 'rejected' THEN 'non_retenu'
  ELSE "status"
END;--> statement-breakpoint
ALTER TABLE "owner" ADD COLUMN "contact_mode" "owner_contact_mode" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_request" ADD CONSTRAINT "contact_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_request_accommodation_slug_idx" ON "contact_request" USING btree ("accommodation_slug");--> statement-breakpoint
-- Backfill: mode de contact depuis l'ancien booléen (avant son DROP)
UPDATE "owner" SET "contact_mode" = 'dossier_facile' WHERE "accept_dossier_facile_applications" = true;--> statement-breakpoint
ALTER TABLE "owner" DROP COLUMN "accept_dossier_facile_applications";