-- Replace cursor-sort indexes with deterministic tie-breaker coverage.
DROP INDEX "Vehicle_userId_createdAt_idx";
DROP INDEX "Vehicle_userId_status_createdAt_idx";
CREATE INDEX "Vehicle_userId_createdAt_id_idx" ON "Vehicle"("userId", "createdAt", "id");
CREATE INDEX "Vehicle_userId_name_id_idx" ON "Vehicle"("userId", "name", "id");
CREATE INDEX "Vehicle_userId_status_createdAt_id_idx" ON "Vehicle"("userId", "status", "createdAt", "id");
CREATE INDEX "Vehicle_userId_status_name_id_idx" ON "Vehicle"("userId", "status", "name", "id");

-- Support dashboard completion windows and bounded vehicle/batch read models.
CREATE INDEX "ProcessingJob_userId_status_completedAt_vehicleId_idx" ON "ProcessingJob"("userId", "status", "completedAt", "vehicleId");
CREATE INDEX "ProcessingJob_userId_vehicleId_createdAt_id_idx" ON "ProcessingJob"("userId", "vehicleId", "createdAt", "id");
CREATE INDEX "ProcessingJob_userId_vehicleId_status_completedAt_id_idx" ON "ProcessingJob"("userId", "vehicleId", "status", "completedAt", "id");
CREATE INDEX "ProcessingJob_vehicleId_batchRequestHash_displayOrder_id_idx" ON "ProcessingJob"("vehicleId", "batchRequestHash", "displayOrder", "id");
