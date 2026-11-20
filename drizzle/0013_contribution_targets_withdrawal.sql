ALTER TYPE "public"."log_action" ADD VALUE 'withdraw';--> statement-breakpoint
ALTER TABLE "contribution" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "contribution" ADD COLUMN "withdrawn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_target_id_contribution_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."contribution"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contribution_target_idx" ON "contribution" USING btree ("target_id");