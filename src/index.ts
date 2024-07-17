import express from "express";
import Joi from "joi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import { runPipeline, createPipelineTasks } from "./facebook/pipeline.service";
import { MODELS } from "./facebook/pipeline.const";

const app = express();

app.use(express.json({limit:"10mb"}));

app.use("/task/:type", async (req, res) => {
  try {
    const body = await Joi.object({
      since: Joi.string()
        .optional()
        .empty(null)
        .allow(null)
        .default(dayjs.utc().subtract(1, "day").format("YYYY-MM-DD")),
      until: Joi.string()
        .optional()
        .empty(null)
        .allow(null)
        .default(dayjs.utc().format("YYYY-MM-DD")),
      pipeline_group: Joi.string()
        .allow("pages", "ads", "business", "posts")
        .default("ads"),
      type: Joi.string().allow("ad_accounts", "pages").default("ad_accounts"),
    }).validateAsync(
      { ...req.body, type: req.params.type },
      { stripUnknown: true }
    );
    const result = await createPipelineTasks(body);

    res.status(200).json({ result });
  } catch (error) {
    console.error(JSON.stringify(error));
    res.status(500).json({ error });
  }
});

type RunPipelineRequest = {
  id?: string;
  name: string;
  access_token?: string;
  since: string;
  until: string;
  model_name: string;
  is_reel?: boolean;
  pipeline_group: keyof typeof MODELS;
  params?: Pick<RunPipelineRequest, "id" | "access_token" | "name"|"is_reel">[];
};

app.use("/", async (req, res) => {
  try {
    const { model_name, pipeline_group, ...config } =
      await Joi.object<RunPipelineRequest>({
        id: Joi.string().optional(),
        since: Joi.string(),
        until: Joi.string(),
        model_name: Joi.string(),
        pipeline_group: Joi.string().allow("pages", "ads", "business", "posts"),
        access_token: Joi.string().optional(),
        is_reel: Joi.bool().optional(),
        params: Joi.array()
          .items({
            id: Joi.string(),
            name: Joi.string(),
            access_token: Joi.string(),
            is_reel: Joi.bool().optional(),
          })
          .optional(),
      }).validateAsync(req.body, { stripUnknown: true });
    const result = await runPipeline({ model_name, pipeline_group, config });

    res.status(200).json({ result });
  } catch (error) {
    // console.error(JSON.stringify(error));
    res.status(500).json({ error });
  }
});

app.listen(8080);
