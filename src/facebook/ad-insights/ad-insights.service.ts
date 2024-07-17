import axios from "axios";
import { Readable } from "node:stream";
import { setTimeout } from "node:timers/promises";

import type { PIPELINE, PipelineConfig,PipelineData } from "../pipeline.const";
import {
  AD_LEVEL_CONFIGS,
  AD_MODELS_CONFIG,
  AD_METRICS,
} from "./ad-insights.const";
import { FacebookResponse } from "../facebook.const";

export const generateAdModel = (
  name: keyof typeof AD_MODELS_CONFIG
): PIPELINE => {
  return {
    name,
    config: ({ id, since, until }: PipelineConfig) => ({
      url: `/${id}/insights`,
      method: "POST",
      data: {
        fields: [
          "date_start",
          "date_stop",
          ...AD_LEVEL_CONFIGS[
            AD_MODELS_CONFIG[name].level as keyof typeof AD_LEVEL_CONFIGS
          ],
          ...AD_METRICS,
        ].join(","),
        level: AD_MODELS_CONFIG[name].level || "",
        breakdowns: AD_MODELS_CONFIG[name].breakdowns || "",
        time_range: JSON.stringify({ since, until }),
        time_increment: 1,
      },
    }),
    schema: [
      { name: "data", type: "JSON" },
      { name: "id", type: "STRING" },
    ],
    transform: (
      data: axios.AxiosResponse["data"],
    ) => ({
      data: data,
    }),
  };
};

export const getAdsInsights = async (
  client: axios.AxiosInstance,
  params: PipelineConfig,
  model: PIPELINE
): Promise<PipelineData> => {
  // const model = generateAdModel(model_name);

  type RequestReportResponse = {
    report_run_id: string;
  };

  const requestReport = async (): Promise<string> => {
    return client
      .request<RequestReportResponse>(model.config(params) as axios.AxiosRequestConfig)
      .then(({ data }) => data.report_run_id);
  };

  type ReportStatusResponse = {
    async_percent_completion: number;
    async_status: string;
  };

  const pollReport = async (reportId: string): Promise<string> => {
    const data = await client
      .request<ReportStatusResponse>({ method: "GET", url: `/${reportId}` })
      .then((res) => res.data);

    if (
      data.async_percent_completion === 100 &&
      data.async_status === "Job Completed"
    ) {
      return reportId;
    }

    if (data.async_status === "Job Failed") {
      throw new Error(JSON.stringify(data));
    }

    await setTimeout(10_000);

    return pollReport(reportId);
  };

  const getInsights = async (reportId: string): Promise<PipelineData> => {
    const stream = new Readable({ objectMode: true, read: () => {} });

    const _getInsights = async (after?: string) => {
      // console.log(after)
      const data = await client
        .request<FacebookResponse>({
          method: "GET",
          url: `/${reportId}/insights`,
          params: { after, limit: 500 },
        })
        .then((response) => response.data);

      data.data.forEach((row) => stream.push(row));
      // console.log(data.paging.next)
      data.paging.next
        ? _getInsights(data.paging.cursors.after)
        : stream.push(null);
    };

    await _getInsights();

    return {stream};
  };

  return requestReport()
    .then(pollReport)
    .then(getInsights)
    .catch((err) => {
      if (axios.isAxiosError(err)) {
        console.log(JSON.stringify(err.response?.data));
      } else {
        console.log(err);
      }
      return Promise.reject(err);
    });
};
