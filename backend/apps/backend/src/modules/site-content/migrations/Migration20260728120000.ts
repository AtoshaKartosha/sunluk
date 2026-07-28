import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260728120000 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table if not exists "site_content" ("id" text not null, "locale" text not null, "overrides" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_content_pkey" primary key ("id"));');
    this.addSql('create unique index if not exists "IDX_site_content_locale_unique" on "site_content" ("locale") where deleted_at is null;');
    this.addSql('create index if not exists "IDX_site_content_deleted_at" on "site_content" ("deleted_at") where deleted_at is null;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "site_content" cascade;');
  }
}
