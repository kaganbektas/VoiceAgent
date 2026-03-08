-- Seed data for VoiceAgent - Tenant 1 (Elit Kuaför Salonu)

-- Update Tenant 1 with business details
UPDATE "Tenants" SET
    "BusinessName" = 'Elit Kuaför Salonu',
    "BusinessType" = 'Kuaför / Berber',
    "Description" = 'İstanbul''da 15 yıllık tecrübesiyle hizmet veren profesyonel kuaför salonu. Bayan ve erkek saç kesimi, saç boyama, cilt bakımı ve manikür-pedikür hizmetleri sunuyoruz.',
    "Address" = 'Bağdat Caddesi No:123, Kadıköy, İstanbul',
    "Phone" = '+905359358128',
    "WebsiteUrl" = 'https://elitkuafor.com',
    "Timezone" = 'Europe/Istanbul',
    "Language" = 'tr',
    "GreetingMessage" = 'Merhaba, Elit Kuaför Salonu''na hoş geldiniz! Size nasıl yardımcı olabilirim?'
WHERE "Id" = 1;

-- Delete existing business hours for tenant 1, then insert Turkish-style hours
DELETE FROM "BusinessHours" WHERE "TenantId" = 1;

INSERT INTO "BusinessHours" ("TenantId", "DayOfWeek", "OpenTime", "CloseTime", "IsClosed") VALUES
(1, 1, '09:00', '19:00', false),
(1, 2, '09:00', '19:00', false),
(1, 3, '09:00', '19:00', false),
(1, 4, '09:00', '19:00', false),
(1, 5, '09:00', '19:00', false),
(1, 6, '09:00', '18:00', false),
(1, 0, '00:00', '00:00', true);

-- Delete existing services, then insert
DELETE FROM "ServiceTypes" WHERE "TenantId" = 1;

INSERT INTO "ServiceTypes" ("TenantId", "Name", "Duration", "Price", "IsActive") VALUES
(1, 'Erkek Saç Kesimi', 30, 250, true),
(1, 'Bayan Saç Kesimi', 45, 400, true),
(1, 'Saç Boyama', 90, 800, true),
(1, 'Sakal Tıraşı', 20, 150, true),
(1, 'Cilt Bakımı', 60, 500, true),
(1, 'Manikür', 30, 200, true),
(1, 'Fön', 30, 200, true);

-- Delete existing FAQs, then insert
DELETE FROM "Faqs" WHERE "TenantId" = 1;

INSERT INTO "Faqs" ("TenantId", "Question", "Answer", "Category", "IsActive", "CreatedAt") VALUES
(1, 'Randevu almadan gelebilir miyim?', 'Randevusuz da gelebilirsiniz ancak randevulu müşterilerimize öncelik veriyoruz. Yoğun saatlerde bekleme süresi olabilir.', 'genel', true, NOW()),
(1, 'Ödeme yöntemleriniz nelerdir?', 'Nakit, kredi kartı ve banka kartı ile ödeme kabul ediyoruz.', 'ödeme', true, NOW()),
(1, 'Park yeri var mı?', 'Evet, binamızın altında ücretsiz otopark mevcuttur.', 'konum', true, NOW()),
(1, 'İptal ve değişiklik politikanız nedir?', 'Randevunuzu en az 2 saat öncesinden iptal veya değiştirmenizi rica ederiz.', 'genel', true, NOW());
