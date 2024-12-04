import express from "express";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import cors from "cors";
import {
  KubeConfig,
  AppsV1Api,
  CoreV1Api,
  NetworkingV1Api,
} from "@kubernetes/client-node";

const app = express();
app.use(express.json());
app.use(cors());

const kubeconfig = new KubeConfig();
kubeconfig.loadFromDefault();
const coreV1api = kubeconfig.makeApiClient(CoreV1Api);
const appV1api = kubeconfig.makeApiClient(AppsV1Api);
const networkV1api = kubeconfig.makeApiClient(NetworkingV1Api);

const readAndParseYaml = (filePath, replId) => {
  const fileContents = fs.readFileSync(filePath, "utf-8");
  const docs = yaml.parseAllDocuments(fileContents).map((doc) => {
    let docString = doc.toString();
    const regex = new RegExp(`service_name`, "g");
    docString = docString.replace(regex, replId);
    console.log(docString);
    return yaml.parse(docString);
  });
  return docs;
};

app.post("/start", async (req, res) => {
  const { userId, replId } = req.body;
  const namespace = allthecode;
  try {
    const kubeManifests = readAndParseYaml(
      path.join(__dirname, "../service.yaml"),
      replId
    );
    for (const mainifest of kubeManifests) {
      switch (mainifest.kind) {
        case "Deployement":
          await appV1api.createNamespacedDeployment(namespace, mainifest);
          break;
        case "Service":
          await coreV1api.createNamespacedService(namespace, mainifest);
          break;
        case "Ingress":
          await networkV1api.createNamespacedIngress(namespace, mainifest);
          break;
        default:
          console.log(`Unsupported kind:${mainifest.kind}`);
      }
    }
    res.status(200).send({ message: "Resources created successfully" });
  } catch (error) {
    console.error("Failed creation of resource:", error);
    res.status(500).send({ message: "Failed to create resource" });
  }
});

const port = process.env.PORT || 3002
app.listen(port,()=>{
    console.log(`Listening on port:${port}`)
})