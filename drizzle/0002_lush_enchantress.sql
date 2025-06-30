ALTER TABLE "device_history" DROP CONSTRAINT "device_history_device_id_devices_id_fk";
--> statement-breakpoint
ALTER TABLE "device_history" ADD CONSTRAINT "device_history_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;