import dayjs from "dayjs";
import { MODELS_CONFIG } from "../facebook.const";

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "status",
  "created_time",
  "updated_time",
  "account_id",
  "campaign{id,name}",
  "adset{id,name}",
  "effective_status",
  "conversion_domain",
  "adcreatives{body,id}",
];

export const CAMPAIGN_MODELS_CONFIG: MODELS_CONFIG = {
  campaigns: {
    edge: ["ads"],
    fields: CAMPAIGN_FIELDS,
    fields_type: "fields",
    params_config: {
      filtering: [
        {
          field: "campaign.updated_time",
          operator: "GREATER_THAN",
          value: dayjs().startOf('D').unix(),
        },
      ],
    },
  },
};
