-- CreateServiceTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateSpecialistFnsTable
CREATE TABLE "specialist_fns" (
    "id" TEXT NOT NULL,
    "specialistId" TEXT NOT NULL,
    "fnsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specialist_fns_pkey" PRIMARY KEY ("id")
);

-- CreateSpecialistServiceTable
CREATE TABLE "specialist_services" (
    "id" TEXT NOT NULL,
    "specialistId" TEXT NOT NULL,
    "fnsId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specialist_services_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
ALTER TABLE "services" ADD CONSTRAINT "services_name_key" UNIQUE ("name");
ALTER TABLE "specialist_fns" ADD CONSTRAINT "specialist_fns_specialistId_fnsId_key" UNIQUE ("specialistId", "fnsId");
ALTER TABLE "specialist_services" ADD CONSTRAINT "specialist_services_specialistId_fnsId_serviceId_key" UNIQUE ("specialistId", "fnsId", "serviceId");

-- Add foreign key constraints
ALTER TABLE "specialist_fns" ADD CONSTRAINT "specialist_fns_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "specialist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "specialist_fns" ADD CONSTRAINT "specialist_fns_fnsId_fkey" FOREIGN KEY ("fnsId") REFERENCES "ifns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "specialist_services" ADD CONSTRAINT "specialist_services_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "specialist_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "specialist_services" ADD CONSTRAINT "specialist_services_fnsId_fkey" FOREIGN KEY ("fnsId") REFERENCES "ifns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "specialist_services" ADD CONSTRAINT "specialist_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "specialist_fns_specialistId_idx" ON "specialist_fns"("specialistId");
CREATE INDEX "specialist_fns_fnsId_idx" ON "specialist_fns"("fnsId");
CREATE INDEX "specialist_services_specialistId_idx" ON "specialist_services"("specialistId");
CREATE INDEX "specialist_services_fnsId_idx" ON "specialist_services"("fnsId");
CREATE INDEX "specialist_services_serviceId_idx" ON "specialist_services"("serviceId");

-- Seed the 3 predefined services
INSERT INTO "services" ("id", "name") VALUES
    ('svc_vyezd', 'Выездная проверка'),
    ('svc_kameral', 'Камеральная проверка'),
    ('svc_operative', 'Отдел оперативного контроля')
ON CONFLICT ("name") DO NOTHING;

-- Migrate existing data: for each specialist with fnsDepartmentsData,
-- create SpecialistFns and SpecialistService rows from the JSON blob.
-- This is a best-effort migration that matches FNS office names to ifns rows.
INSERT INTO "specialist_fns" ("id", "specialistId", "fnsId")
SELECT
    CONCAT('migrated_sf_', sp."id", '_', i."id"),
    sp."id",
    i."id"
FROM "specialist_profiles" sp,
     json_array_elements(sp."fnsDepartmentsData") AS fns_entry,
     "ifns" i
WHERE sp."fnsDepartmentsData" IS NOT NULL
  AND i."name" = fns_entry->>'office'
ON CONFLICT ("specialistId", "fnsId") DO NOTHING;

-- Migrate services per FNS from fnsDepartmentsData
-- Only migrate services that match the 3 predefined service names
INSERT INTO "specialist_services" ("id", "specialistId", "fnsId", "serviceId")
SELECT DISTINCT
    CONCAT('migrated_ss_', sp."id", '_', i."id", '_', s."id"),
    sp."id",
    i."id",
    s."id"
FROM "specialist_profiles" sp,
     json_array_elements(sp."fnsDepartmentsData") AS fns_entry,
     json_array_elements(fns_entry->'departments') AS dept_name,
     "ifns" i,
     "services" s
WHERE sp."fnsDepartmentsData" IS NOT NULL
  AND i."name" = fns_entry->>'office'
  AND s."name" = dept_name
ON CONFLICT ("specialistId", "fnsId", "serviceId") DO NOTHING;
