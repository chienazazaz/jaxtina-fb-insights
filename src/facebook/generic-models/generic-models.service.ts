import axios from "axios";
import { Readable } from "node:stream";

import { PIPELINE, PipelineConfig, PipelineData } from "../pipeline.const";
import { FacebookResponse } from "../facebook.const";
import {
  BUSINESS_MODELS_CONFIG,
  PAGE_MODELS_CONFIG,
  POST_MODELS_CONFIG,
} from "./";

export const getModelData = async (
  client: axios.AxiosInstance,
  config: PipelineConfig,
  model: PIPELINE
): Promise<PipelineData> => {
  const stream = new Readable({ objectMode: true, read: () => {} });

  const ids: Record<string, any>[] = [];

  const request_configs = model.config(config);

  const _getData = async (
    { params, ...cf }: axios.AxiosRequestConfig,
    after?: string
  ) => {
    const data = await client
      .request<FacebookResponse>({ ...cf, params: { ...params, after } })
      .then((res) => res.data);

    data.data.map(({ access_token, ...r }: any) => {
      stream.push(r);
      ids.push({
        id: r.id,
        access_token: access_token || params.access_token,
        is_reel: Boolean(r.permalink_url?.match(/reel/g)),
      });
    });

    data.paging?.cursors?.after
      ? await _getData({ params, ...cf }, data.paging?.cursors?.after)
      : undefined;
  };
  for await (const c of request_configs as axios.AxiosRequestConfig[]) {
    // console.log(c);
    await _getData(c);
  }

  stream.push(null);

  return { stream, ids };
};

export const generateModel = (
  name: string,
  model_config:
    | typeof PAGE_MODELS_CONFIG
    | typeof POST_MODELS_CONFIG
    | typeof BUSINESS_MODELS_CONFIG
): PIPELINE => {
  return {
    name,
    schema: [
      { name: "data", type: "JSON" },
      { name: "id", type: "STRING" },
    ],
    config: ({ id, params, ...g_params }: PipelineConfig, after?: string) => {
      const configs = params
        ? model_config[name].edge
            .map((e) =>
              params.map((p) => {
                const fields = [...model_config[name].fields]
                if (!p.is_reel && name ==='post_insights') {
                  fields.push(
                    ...[
                      "post_video_view_time_by_age_bucket_and_gender",
                      "post_video_view_time_by_region_id",
                    ]
                  );
                }
                // if(p.is_reel) {console.log(fields)}
                return {
                  url: `${p.id}/${e}`,
                  method: "GET",
                  params: {
                    ...g_params,
                    ...p,
                    [model_config[name].fields_type]: fields.join(","),
                    ...model_config[name]?.params_config,
                    after,
                  },
                };
              })
            )
            .flat()
        : model_config[name].edge.map((e) => ({
            url: `${id}/${e}`,
            method: "GET",
            params: {
              ...g_params,
              [model_config[name].fields_type]:
                model_config[name].fields.join(","),
              ...model_config[name]?.params_config,
              after,
            },
          }));
      return configs;
    },
    transform: (data: axios.AxiosResponse["data"]) => {
      return { data };
    },
    dependencies: model_config[name]?.dependencies,
  };
};
