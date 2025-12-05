import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostImagesTable1764960184717 implements MigrationInterface {
    name = 'CreatePostImagesTable1764960184717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "post_images" ("id" uuid NOT NULL, "post_id" uuid NOT NULL, "image_url" character varying NOT NULL, "s3_key" character varying NOT NULL, "order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_32fe67d8cdea0e7536320d7c454" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "post_images" ADD CONSTRAINT "FK_cbea080987be6204e913a691aea" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_images" DROP CONSTRAINT "FK_cbea080987be6204e913a691aea"`);
        await queryRunner.query(`DROP TABLE "post_images"`);
    }

}
