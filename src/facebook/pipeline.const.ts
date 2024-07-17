import axios from "axios";
import { Readable } from "node:stream";


import { generateAdModel, AD_MODELS_CONFIG } from "./ad-insights";
import {
  generateModel,
  BUSINESS_MODELS_CONFIG,
  PAGE_MODELS_CONFIG,
  POST_MODELS_CONFIG,
  CAMPAIGN_MODELS_CONFIG,
} from "./generic-models";
import { MODELS_CONFIG, MODEL_CONFIG } from "./facebook.const";

export type PipelineData = {
  stream: Readable,
  ids?: Record<string, any>[]
}


export type PIPELINE = Partial<Pick<MODEL_CONFIG, "dependencies">> & {
  name: string;
  config: (
    params: PipelineConfig,
    after?: string
  ) => axios.AxiosRequestConfig | axios.AxiosRequestConfig[];
  transform: (data: axios.AxiosResponse["data"]) => Record<string, any>;
  schema: Record<string, any>[];
  dependencies?: string[];
};

export type PipelineConfig = {
  id?: string;
  since?: string;
  until?: string;
  name?: string;
  access_token?: string;
  is_reel?: boolean;
  params?: PipelineConfig[];
};

export type RequestParams = {
  pipeline_group: keyof typeof MODELS;
  config: PipelineConfig;
  model_name: string;
};

type MODELS_TEMPLATE = {
  get: Function;
  config: MODELS_CONFIG;
  models: string[];
  dependencies?: string[];
};

export const MODELS: Record<string, MODELS_TEMPLATE> = {
  business: {
    get: generateModel,
    models: Object.keys(BUSINESS_MODELS_CONFIG),
    config: BUSINESS_MODELS_CONFIG,
    dependencies: ["pages"],
  },
  ads: {
    get: generateAdModel,
    models: Object.keys(AD_MODELS_CONFIG),
    config: AD_MODELS_CONFIG,
  },
  // campaigns: {
  //   get: generateModel,
  //   models: Object.keys(CAMPAIGN_MODELS_CONFIG),
  //   config: CAMPAIGN_MODELS_CONFIG,
  // },
  pages: {
    get: generateModel,
    models: Object.keys(PAGE_MODELS_CONFIG),
    config: PAGE_MODELS_CONFIG,
    dependencies: ["posts"],
  },
  posts: {
    get: generateModel,
    models: Object.keys(POST_MODELS_CONFIG),
    config: POST_MODELS_CONFIG,
  },
};
