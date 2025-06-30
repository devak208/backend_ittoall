CREATE TABLE "rejected_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"android_id" varchar(255) NOT NULL,
	"original_created_at" timestamp NOT NULL,
	"rejected_at" timestamp DEFAULT now() NOT NULL,
	"rejected_by" varchar(255),
	"rejection_reason" text,
	"original_notes" text,
	CONSTRAINT "rejected_devices_android_id_unique" UNIQUE("android_id")
);
