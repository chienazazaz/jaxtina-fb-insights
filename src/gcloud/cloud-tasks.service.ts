import { CloudTasksClient, protos } from "@google-cloud/tasks";
import HttpMethod = protos.google.cloud.tasks.v2.HttpMethod;
import { v4 as uuidv4 } from "uuid";

const REGION = process.env.REGION || ""
const QUEUE = process.env.QUEUE || ""

export const createTasks = async <P>(
  payloads: P[],
  nameFn: (p: P) => string
) => {
  try {
    const client = new CloudTasksClient();

  const [projectId, serviceAccountEmail] = await Promise.all([
    client.getProjectId(),
    client.auth
      .getCredentials()
      .then((credentials) => credentials.client_email),
  ]);

  const tasks = payloads.map((p) => ({
    parent: client.queuePath(projectId, REGION, QUEUE),
    task: {
      name: client.taskPath(
        projectId,
        REGION,
        QUEUE,
        `${nameFn(p)}-${uuidv4()}`
      ),
      httpRequest: {
        httpMethod: HttpMethod.POST,
        headers: { "Content-Type": "application/json" },
        url: process.env.PUBLIC_URL || "",
        oidcToken: { serviceAccountEmail },
        body: Buffer.from(JSON.stringify(p)).toString("base64"),
      },
    },
  }));

  // console.log(tasks.length)

  // return tasks.length

  const requests = await Promise.all(tasks.map((r) => client.createTask(r)));

  const results = requests.map(([res]) => res.name);

  return results.length;
  } catch(error) {
    throw error
  }
  
};
