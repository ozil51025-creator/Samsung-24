import { eq } from "drizzle-orm";
import { GetAdminSiteSettingsResponse } from "@workspace/api-zod";
import { adminSiteSettingsTable, db } from "@workspace/db";

export const defaultSiteSettings = {
  brandName: "samsung", currencyCode: "UGX", mtnMobileMoneyNumber: "", airtelMobileMoneyNumber: "",
  payeeName: "", supportHandle: "kalljem", telegramUrl: "https://t.me/kalljem", termsAndConditions: "",
  minimumDepositUgx: 30000, minimumWithdrawalUgx: 3000, signupBonusUgx: 5000, dailyCheckinBonusUgx: 500,
  withdrawalFeePercent: 0, referralCommissionLevel1Percent: 35, referralCommissionLevel2Percent: 2,
  referralCommissionLevel3Percent: 1, maximumPlanReturnMultiple: 4, maximumWithdrawalsPerMemberPerDay: 0,
  limitWithdrawalsToHours: false, withdrawalWindowStart: "08:00", withdrawalWindowEnd: "17:00",
  requireReferralCode: false,
  allowedWebsiteDomains: "samsung-24.onrender.com\nsamnshfjfhddkagv.it.com\nwww.samnshfjfhddkagv.it.com",
  maintenanceMode: false,
  maintenanceMessage: "We’re performing maintenance. Please check back shortly.",
  showOpeningCountdown: false, openingDateTime: null, showAnnouncement: false,
  announcementTitle: "", announcementMessage: "",
};

export async function readSiteSettings() {
  const [row] = await db.select({ settings: adminSiteSettingsTable.settings })
    .from(adminSiteSettingsTable)
    .where(eq(adminSiteSettingsTable.id, "default"))
    .limit(1);

  const storedSettings = row?.settings;
  const mergedSettings =
    storedSettings && typeof storedSettings === "object" && !Array.isArray(storedSettings)
      ? { ...defaultSiteSettings, ...storedSettings }
      : defaultSiteSettings;

  const configuredDomains = mergedSettings.allowedWebsiteDomains;
  const normalizeDomains = (value: unknown): string[] => {
    const domains = Array.isArray(value)
      ? value.filter((domain): domain is string => typeof domain === "string")
      : typeof value === "string"
        ? value.split(/[\n,]/)
        : [];

    return domains.map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  };

  const normalizedSettings = {
    ...mergedSettings,
    allowedWebsiteDomains: [...new Set([
      ...normalizeDomains(defaultSiteSettings.allowedWebsiteDomains),
      ...normalizeDomains(configuredDomains),
    ])].join("\n"),
  };

  return GetAdminSiteSettingsResponse.parse(normalizedSettings);
}
