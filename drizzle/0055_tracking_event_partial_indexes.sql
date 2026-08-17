DROP INDEX "tracking_event_type_created_idx";--> statement-breakpoint
DROP INDEX "tracking_event_department_created_idx";--> statement-breakpoint
DROP INDEX "tracking_event_accommodation_created_idx";--> statement-breakpoint
DROP INDEX "tracking_event_owner_created_idx";--> statement-breakpoint
CREATE INDEX "tracking_event_department_created_idx" ON "tracking_event" USING btree ("department_id","created_at") WHERE "tracking_event"."department_id" is not null;--> statement-breakpoint
CREATE INDEX "tracking_event_accommodation_created_idx" ON "tracking_event" USING btree ("accommodation_id","created_at") WHERE "tracking_event"."accommodation_id" is not null;--> statement-breakpoint
CREATE INDEX "tracking_event_owner_created_idx" ON "tracking_event" USING btree ("owner_id","created_at") WHERE "tracking_event"."owner_id" is not null;