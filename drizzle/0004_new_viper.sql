CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"post_id" serial NOT NULL,
	"platforms" text NOT NULL,
	"image_url" text,
	"post_preview" text NOT NULL,
	"published_at" timestamp NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
