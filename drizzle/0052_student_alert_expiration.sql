ALTER TABLE "student_alert" ADD COLUMN "renewed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "student_alert" ADD COLUMN "expiry_reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "student_alert" ADD COLUMN "expired_at" timestamp with time zone;