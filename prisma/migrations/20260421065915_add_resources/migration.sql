-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_name_key" ON "ResourceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_slug_key" ON "ResourceCategory"("slug");

-- CreateIndex
CREATE INDEX "ResourceCategory_sortOrder_idx" ON "ResourceCategory"("sortOrder");

-- CreateIndex
CREATE INDEX "Resource_categoryId_idx" ON "Resource"("categoryId");

-- CreateIndex
CREATE INDEX "Resource_sortOrder_idx" ON "Resource"("sortOrder");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: categories (idempotent; skips if a row already exists)
INSERT INTO "ResourceCategory" ("id", "name", "slug", "sortOrder") VALUES
  ('cat_community', 'Community', 'community', 1),
  ('cat_humanitarian', 'Humanitarian', 'humanitarian', 2),
  ('cat_antiwar', 'Anti-war', 'antiwar', 3),
  ('cat_legal', 'Know your rights', 'legal', 4),
  ('cat_indigenous', 'Indigenous', 'indigenous', 5),
  ('cat_fund', 'Mutual aid', 'fund', 6),
  ('cat_press', 'Press', 'press', 7)
ON CONFLICT ("id") DO NOTHING;

-- Seed: existing resources from app/contact/page.tsx
INSERT INTO "Resource" ("id", "name", "description", "url", "cta", "sortOrder", "categoryId", "updatedAt") VALUES
  ('res_mayday_space', 'Mayday Space', 'A home for movements, social justice activism, and community events in Brooklyn.', 'https://maydayspace.org/', 'maydayspace.org', 1, 'cat_community', CURRENT_TIMESTAMP),
  ('res_save_project_reach', 'Save Project Reach', 'Raising funds to help empower young people and marginalized communities.', 'https://www.instagram.com/saveprojectreach/', '@saveprojectreach', 2, 'cat_community', CURRENT_TIMESTAMP),
  ('res_atlanta_solidarity_fund', 'Atlanta Solidarity Fund', 'Bails out activists arrested for participating in social justice movements and helps them access lawyers.', 'https://secure.actblue.com/donate/atlanta-solidarity-fund', 'contribute', 3, 'cat_fund', CURRENT_TIMESTAMP),
  ('res_medical_aid_palestinians', 'Medical Aid for Palestinians', 'Urgent medical aid for Palestinians in Gaza, the West Bank, and refugee camps across the region.', 'https://linktr.ee/MedicalAidforPalestinians', 'map.org.uk', 4, 'cat_humanitarian', CURRENT_TIMESTAMP),
  ('res_unrwa', 'UNRWA', 'UN relief agency providing assistance, protection, and advocacy for Palestinian refugees across Gaza and the region.', 'https://www.unrwa.org/', 'unrwa.org', 5, 'cat_humanitarian', CURRENT_TIMESTAMP),
  ('res_pcrf', 'Palestine Children''s Relief Fund', 'Humanitarian medical relief for children in Palestine and the Middle East. Charity Navigator 4-star rated for 12+ years.', 'https://www.pcrf.net/', 'pcrf.net', 6, 'cat_humanitarian', CURRENT_TIMESTAMP),
  ('res_heal_palestine', 'HEAL Palestine', '501(c)(3) delivering humanitarian, educational, and medical aid to Gaza.', 'https://www.healpalestine.org/', 'healpalestine.org', 7, 'cat_humanitarian', CURRENT_TIMESTAMP),
  ('res_meca', 'Middle East Children''s Alliance', 'Humanitarian aid, children''s programs, and advocacy rooted in Palestine and the broader region.', 'https://www.mecaforpeace.org/', 'mecaforpeace.org', 8, 'cat_humanitarian', CURRENT_TIMESTAMP),
  ('res_jvp', 'Jewish Voice for Peace', 'Jewish anti-occupation organizing for Palestinian liberation and ending US complicity in apartheid.', 'https://www.jewishvoiceforpeace.org/', 'jewishvoiceforpeace.org', 9, 'cat_community', CURRENT_TIMESTAMP),
  ('res_codepink', 'CODEPINK', 'Grassroots anti-war organization opposing US militarism, sanctions, and foreign intervention.', 'https://www.codepink.org/', 'codepink.org', 10, 'cat_antiwar', CURRENT_TIMESTAMP),
  ('res_quincy', 'Quincy Institute', 'Foreign-policy think tank advocating for restraint, diplomacy, and an end to endless war.', 'https://quincyinst.org/', 'quincyinst.org', 11, 'cat_antiwar', CURRENT_TIMESTAMP),
  ('res_immigrant_defense', 'Immigrant Defense Project', 'Community defense, legal resources, and trainings to help people defend their rights against ICE and in immigration proceedings.', 'https://www.immigrantdefenseproject.org/', 'immigrantdefenseproject.org', 12, 'cat_legal', CURRENT_TIMESTAMP),
  ('res_nilc', 'National Immigration Law Center', 'Defends and advances the rights of low-income immigrants through policy, litigation, and organizing.', 'https://www.nilc.org/', 'nilc.org', 13, 'cat_legal', CURRENT_TIMESTAMP),
  ('res_chirla', 'CHIRLA', 'Coalition for Humane Immigrant Rights — deportation defense, know-your-rights education, and community organizing.', 'https://www.chirla.org/', 'chirla.org', 14, 'cat_legal', CURRENT_TIMESTAMP),
  ('res_raices', 'RAICES', 'Free and low-cost legal services for immigrants, refugees, and asylum seekers across Texas and beyond.', 'https://www.raicestexas.org/', 'raicestexas.org', 15, 'cat_legal', CURRENT_TIMESTAMP),
  ('res_ndn_collective', 'NDN Collective', 'Indigenous-led organization building Indigenous power through organizing, advocacy, philanthropy, and movement-building. Home of the LANDBACK campaign.', 'https://ndncollective.org/', 'ndncollective.org', 16, 'cat_indigenous', CURRENT_TIMESTAMP),
  ('res_narf', 'Native American Rights Fund', 'Nonprofit law firm dedicated to defending the rights of Native American tribes, organizations, and individuals nationwide.', 'https://narf.org/', 'narf.org', 17, 'cat_indigenous', CURRENT_TIMESTAMP),
  ('res_first_nations', 'First Nations Development Institute', 'Native-led nonprofit strengthening Native American economies and communities through grantmaking, advocacy, and technical assistance.', 'https://www.firstnations.org/', 'firstnations.org', 18, 'cat_indigenous', CURRENT_TIMESTAMP),
  ('res_lakota_law', 'Lakota People''s Law Project', 'Advocacy, legal action, and direct organizing to protect Lakota and Indigenous rights — from MMIW to treaty rights to sacred lands.', 'https://www.lakotalaw.org/', 'lakotalaw.org', 19, 'cat_indigenous', CURRENT_TIMESTAMP),
  ('res_democracy_now', 'Democracy Now!', 'Independent daily news program — war and peace, environment, and social justice movements worldwide.', 'https://www.democracynow.org/', 'democracynow.org', 20, 'cat_press', CURRENT_TIMESTAMP),
  ('res_intercept', 'The Intercept', 'Investigative, adversarial journalism holding the powerful accountable.', 'https://theintercept.com/', 'theintercept.com', 21, 'cat_press', CURRENT_TIMESTAMP),
  ('res_mondoweiss', 'Mondoweiss', 'News and analysis covering Palestine, Israel, and the broader movement for justice.', 'https://mondoweiss.net/', 'mondoweiss.net', 22, 'cat_press', CURRENT_TIMESTAMP),
  ('res_electronic_intifada', 'The Electronic Intifada', 'Palestinian-led publication reporting on the struggle for Palestinian freedom and equality.', 'https://electronicintifada.net/', 'electronicintifada.net', 23, 'cat_press', CURRENT_TIMESTAMP),
  ('res_jacobin', 'Jacobin', 'Leading voice on the American left — politics, economics, and culture from a socialist perspective.', 'https://jacobin.com/', 'jacobin.com', 24, 'cat_press', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
