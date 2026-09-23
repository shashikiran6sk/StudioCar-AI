-- An optional name a person gives a processing batch, such as a QA test
-- reference. It is stored on every job of the batch, identifies the studio
-- version the batch produces, and never changes the treatment. Existing jobs
-- stay unlabelled, so their versions keep their current identity.
ALTER TABLE "ProcessingJob" ADD COLUMN "batchLabel" VARCHAR(120);
