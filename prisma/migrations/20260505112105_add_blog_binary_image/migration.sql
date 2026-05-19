-- AlterTable
ALTER TABLE `Blog` ADD COLUMN `featuredImageData` LONGBLOB NULL,
    ADD COLUMN `featuredImageMimeType` VARCHAR(191) NULL;
