import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764882891764 implements MigrationInterface {
    name = 'InitialSchema1764882891764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "author_id" uuid NOT NULL, "is_published" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d82eb2bb2ddd7a6bfac8804d8" ON "posts" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_312c63be865c81b922e39c2475" ON "posts" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_9940eadb862fdda6a6a64a13a3" ON "posts" ("is_published") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'MODERATOR', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "email" character varying NOT NULL, "username" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "refresh_token" character varying, "refresh_token_expires_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9940eadb862fdda6a6a64a13a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_312c63be865c81b922e39c2475"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d82eb2bb2ddd7a6bfac8804d8"`);
        await queryRunner.query(`DROP TABLE "posts"`);
    }

}
