
const ACCOUNT_DIMENSIONS = ["account_name", "account_id"];

const CAMPAIGN_DIMENSIONS = ["campaign_name", "campaign_id"];

const ADSET_DIMENSIONS = ["adset_name", "adset_id"];

const AD_DIMENSIONS = ["ad_name", "ad_id"];

export const AD_METRICS = [
  "clicks",
  "cpc",
  "cpm",
  "ctr",
  "impressions",
  "reach",
  "spend",
  "action_values",
  "actions",
  "cost_per_action_type",
  "cost_per_unique_action_type",
];

export const AD_LEVEL_CONFIGS = {
  account: ACCOUNT_DIMENSIONS,
  campaign: [...ACCOUNT_DIMENSIONS, ...CAMPAIGN_DIMENSIONS],
  adset: [...ACCOUNT_DIMENSIONS, ...CAMPAIGN_DIMENSIONS, ...ADSET_DIMENSIONS],
  ad: [
    ...ACCOUNT_DIMENSIONS,
    ...CAMPAIGN_DIMENSIONS,
    ...ADSET_DIMENSIONS,
    ...AD_DIMENSIONS,
  ],
};

export const AD_MODELS_CONFIG: Record<string, any> = {
    account_insights: {
        level: "account",
    },
    ad_insights: {
        level: "ad"
    },
    age_gender_demographic: {
        level: "campaign",
        breakdowns: "age,gender"
    },
    region_demographic: {
        level: "campaign",
        breakdowns: "region"
    }
}