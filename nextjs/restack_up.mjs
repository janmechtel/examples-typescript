import { RestackCloud } from "@restackio/cloud";
import "dotenv/config";

const main = async () => {
  const restackCloudClient = new RestackCloud(process.env.RESTACK_CLOUD_TOKEN);

  const restackEngineEnvs = [
    {
      name: "RESTACK_ENGINE_ENV_ID",
      value: process.env.RESTACK_ENGINE_ENV_ID,
    },
    {
      name: "RESTACK_ENGINE_ENV_ADDRESS",
      value: process.env.RESTACK_ENGINE_ENV_ADDRESS,
    },
    {
      name: "RESTACK_ENGINE_ENV_API_KEY",
      value: process.env.RESTACK_ENGINE_ENV_API_KEY,
    },
  ];

  const nextjsApp = {
    name: "nextjs",
    dockerFilePath: "nextjs/Dockerfile",
    dockerBuildContext: "nextjs",
    environmentVariables: [...restackEngineEnvs],
  };

  await restackCloudClient.stack({
    name: "development environment",
    previewEnabled: false,
    applications: [nextjsApp],
  });

  await restackCloudClient.up();
};

main();
