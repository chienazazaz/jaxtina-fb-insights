import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import ndjson from "ndjson";
import sha256 from "sha256";
import { chunk } from "lodash";

import { createLoadStream, createTasks } from "../gcloud";
import { BUSINESSES, PERSONAL_AD_ACCOUNTS } from "./facebook.const";

import { getBusinessObjects } from "./api.service";
import { getData, getModel } from "./insights.service";
import { MODELS, RequestParams } from "./pipeline.const";

dayjs.extend(utc);

export const runPipeline = async ({
  config,
  model_name,
  pipeline_group,
}: RequestParams) => {
  try {
    const model = getModel({ config, model_name, pipeline_group });

    const {stream,ids} = await getData({ config, model_name, pipeline_group }, model);

    const result = await pipeline(
      stream,
      new Transform({
        objectMode: true,
        transform: (row, _, callback) => {
          callback(null, {
            ...model.transform(row),
            id: sha256(
              JSON.stringify({
                id: row.id || config.id,
                since: config.since,
                until: config.until,
              })
            ),
            _batched_at: dayjs().toISOString(),
          });
        },
      }),
      ndjson.stringify(),
      createLoadStream({
        table: `p_${model_name}__${dayjs().format("YYYYMMDD")}`,
        schema: [...model.schema, { name: "_batched_at", type: "TIMESTAMP" }],
      })
    ).then(() => true);

    if (!result) {
      throw new Error("Failed to run pipeline");
    }
    // console.log(`Pipeline ${model_name} completed successfully`);

    if (model.dependencies) {
      // console.log("Creating dependent tasks");
      const dep_tasks = await Promise.all(
        MODELS[pipeline_group]!.dependencies!.map((d) =>
          createPipelineTasks({
            ...config,
            pipeline_group: d,
            type: "pages",
            dep_ids: ids,
          })
        )
      );

      return { success: result, tasks: dep_tasks };
    }

    return { success: result };
  } catch (error) {
    // console.error(JSON.stringify(error));
    throw error;
  }
};

export type CreatePipelineTasksOptions = {
  since?: string;
  until?: string;
  type: "ad_accounts" | "pages";
  pipeline_group: keyof typeof MODELS;
  dep_ids?: Record<string,any>[];
};

export const createPipelineTasks = async ({
  since,
  until,
  type,
  pipeline_group,
  dep_ids,
}: CreatePipelineTasksOptions) => {
  try {
    if (dep_ids) {

      const chunks = chunk(dep_ids, 50);

      const configs = chunks.flatMap((c,i) => MODELS[pipeline_group].models.map((model_name) => ({
        index:i,
        since,
        until,
        model_name,
        pipeline_group,
        params: c,
      })));
      // console.log("create task configs if dependencies: ", configs.length)

      return createTasks(configs, (task) => [type, task.model_name, task.index].join("-"));
    }

    const businessObjs = await Promise.all(
      Object.values(BUSINESSES).map((id) => getBusinessObjects(type, { id }))
    ).then((obj) => [...obj.flat()]);

    if(type === "ad_accounts") {
      businessObjs.push(
        ...Object.entries(PERSONAL_AD_ACCOUNTS).map(([k, v]) => ({
          id: `act_${v}`,
          account_id: v,
          name: k,
        }))
      )
    }
  
    const configs = MODELS[pipeline_group].models
      .map((model_name) => {
        return businessObjs.map((obj) => ({
          ...obj,
          since,
          until,
          model_name,
          pipeline_group,
        }));
      })
      .flat();
    // console.log("create task configs if not dependencies")

    return createTasks(configs, (task) => [type, task.model_name].join("-"));
  } catch (error) {
    throw error;
  }
};
