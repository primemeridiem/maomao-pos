CREATE TABLE "sale" (
	"id" text PRIMARY KEY NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_item" (
	"id" text PRIMARY KEY NOT NULL,
	"sale_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_sale_id_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item" ADD CONSTRAINT "sale_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_createdAt_idx" ON "sale" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "saleItem_saleId_idx" ON "sale_item" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "saleItem_productId_idx" ON "sale_item" USING btree ("product_id");