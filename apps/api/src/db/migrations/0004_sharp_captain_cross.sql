CREATE TYPE "public"."invoice_method" AS ENUM('payos', 'momo');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('paid', 'pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'basic', 'advanced', 'professional', 'enterprise');--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"period" varchar(16) NOT NULL,
	"amount_vnd" integer NOT NULL,
	"method" "invoice_method" NOT NULL,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_amount_vnd_check" CHECK ("invoice"."amount_vnd" >= 0),
	CONSTRAINT "invoice_period_check" CHECK ("invoice"."period" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trace_batch" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "invoice_org_id_idx" ON "invoice" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "invoice_org_id_period_idx" ON "invoice" USING btree ("org_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_org_id_unique_idx" ON "subscription" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "subscription_tier_idx" ON "subscription" USING btree ("tier");