CREATE TABLE "device_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"previous_status" boolean,
	"new_status" boolean,
	"action_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"android_id" varchar(255) NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "devices_android_id_unique" UNIQUE("android_id")
);
--> statement-breakpoint
ALTER TABLE "device_history" ADD CONSTRAINT "device_history_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;