CREATE TABLE "upload" (
	"id" uuid PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"uploader_id" text,
	"size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "upload" ADD CONSTRAINT "upload_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "upload_uploader_created_idx" ON "upload" USING btree ("uploader_id","created_at");