import { bindings, defineConfig, defineWorker } from "cf/config";

const serviceId = process.env.RESUMAX_ORACLE_VPC_SERVICE_ID;
if (!serviceId) throw new Error("Set RESUMAX_ORACLE_VPC_SERVICE_ID before deploying the Oracle API gateway.");

export default defineConfig({
  worker: defineWorker({
    name: "resumax-api",
    entrypoint: "./worker.ts",
    compatibilityDate: "2026-11-25",
    workersDev: true,
    env: {
      ORACLE_API: bindings.vpcService({ id: serviceId }),
    },
  }),
});
