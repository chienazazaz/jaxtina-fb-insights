import { getClient } from "./api.service";
import { MODELS, PIPELINE, RequestParams } from "./pipeline.const";
import { getAdsInsights } from "./ad-insights";
import { getModelData } from "./generic-models";


export const getModel = ({ pipeline_group, model_name }: RequestParams) => {
  const modelsGroup = MODELS[pipeline_group];
  return modelsGroup.get(model_name, modelsGroup.config);
};

export const getData = async (
  { pipeline_group, config }: RequestParams,
  model: PIPELINE
) => {
  try {
    const client = await getClient();
  let data;
  switch (pipeline_group) {
    case "ads":
      data = getAdsInsights(client, config, model);
      break;
    default:
      data = getModelData(client, config, model);
  }

  return data;
  } catch(error) {
    throw error
  }
  
};
