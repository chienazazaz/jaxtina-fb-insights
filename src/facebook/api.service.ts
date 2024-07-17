import axios from "axios";

import { getSecret } from "../gcloud";
import { API_VERSION, BASE_URL } from "./facebook.const";
import { PipelineConfig } from "./pipeline.const";
import { BUSINESS_MODELS_CONFIG } from "./generic-models";

export const getClient = async () => {
  try {
    const access_token = await getSecret("facebook-user-token");
    // console.log(access_token)
    return axios.create({
      baseURL: `${BASE_URL}/${API_VERSION}`,
      params: { access_token },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  } catch (error) {
    throw new Error("Failed to initialize client");
  }
};

export const getAppAccessToken = async () => {
  const { client_id, client_secret } = JSON.parse(
    await getSecret("facebook-app-secret")
  );
  return axios({
    url: `${BASE_URL}/oauth/access_token`,
    method: "GET",
    params: { client_id, client_secret, grant_type: "client_credentials" },
  }).then((responese) => responese.data.access_token);
};

type ObjectResponse = {
  account_id?: string;
  id: string;
  name: string;
  access_token?: string;
};

type ListObjectsResponse = {
  data: ObjectResponse[];
};

export const getBusinessObjects = async (
  type: keyof typeof BUSINESS_MODELS_CONFIG,
  { id }: PipelineConfig
): Promise<ObjectResponse[]> => {
  const client = await getClient();
  return Promise.all(
    (BUSINESS_MODELS_CONFIG[type].edge as Array<string>).map(
      async (edge: string) => {
        return client
          .request<ListObjectsResponse>({
            method: "GET",
            params: {
              limit: 500,
              fields: BUSINESS_MODELS_CONFIG[type]!.get_fields!.join(","),
            },
            url: `/${id}/${edge}`,
          })
          .then((response) => {
            return response.data.data;
          });
      }
    )
  ).then((objectGroups) => {
    return objectGroups.flatMap((obj) => obj);
  });
};
