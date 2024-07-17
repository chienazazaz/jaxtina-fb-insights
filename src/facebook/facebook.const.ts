export const API_VERSION = "v19.0"
export const BASE_URL = "https://graph.facebook.com"

export const BUSINESSES = JSON.parse(process.env.BUSINESSES || "{}");;

export const PERSONAL_AD_ACCOUNTS = JSON.parse(process.env.PERSONAL_AD_ACCOUNTS || "{}");

export type FacebookResponse = {
    data: Record<string, any>[];
    paging: { cursors: { after: string }; next: string };
  };

  export type FacebookBatchResponse = {
    code: number;
    body: string
  };

export type MODEL_CONFIG = {
    edge: string[];
    fields: string[];
    fields_type: "fields" | "metric";
    get_fields?: string[],
    dependencies?: string[];
    params_config?: Record<string, any>;
}

export type MODELS_CONFIG = {
    [key: string]: MODEL_CONFIG
}