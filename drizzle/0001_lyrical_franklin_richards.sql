CREATE TABLE "disabled_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"android_id" varchar(255) NOT NULL,
	"original_created_at" timestamp NOT NULL,
	"was_approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"expires_at" timestamp,
	"disabled_at" timestamp DEFAULT now() NOT NULL,
	"disabled_by" varchar(255),
	"disable_reason" text,
	"original_notes" text,
	CONSTRAINT "disabled_devices_android_id_unique" UNIQUE("android_id")
);
