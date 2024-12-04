import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  CopyObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.S3_ENDPOINT,
});

export const fetchS3Folder = async (key, localPath) => {
  const params = {
    Bucket: process.env.S3_BUCKET ?? "",
    Prefix: key,
  };

  const listCommand = new ListObjectsV2Command(params)
  const response = await s3.send(listCommand);
  if (response.Contents) {
    for (const file of response.Contents) {
      const fileKey = file.Key;
      if (fileKey) {
        const params = {
          Bucket: process.env.S3_BUCKET ?? "",
          Key: fileKey,
        };
        const data = await s3.getObject(params).promise();
        if (data.Body) {
          const fileData = data.Body;
          const filePath = `${localPath}/${fileKey.replace(key, "")}`;
          await writeFile(filePath, fileData);
        }
      }
    }
  }
};

export async function copyS3Folder(source, destination, continuationToken) {
  try {
    const listPrams = {
      Bucket: process.env.S3_BUCKET ?? "",
      Prefix: source,
      ContinuationToken: continuationToken,
    };

    const listCommand = new ListObjectsV2Command(listPrams)
    const listObjects = await s3.send(listCommand)
    if (!listObjects.Contents || listObjects.Contents.length === 0) return;

    for (const object of listObjects.Contents) {
      if (!object.Key) continue;
      let destinationKey = object.Key.replace(source, destination);
      let copyParams = {
        Bucket: process.env.S3_BUCKET ?? "",
        CopySource: `${process.env.S3_BUCKET}/${object.Key}`,
        Key: destinationKey,
      };
      console.log(copyParams);

      const copyObjectCommand = new CopyObjectCommand(copyParams)
      await s3.send(copyObjectCommand)
      console.log(`Copied ${object.Key} to ${destination}`);
    }

    if (listObjects.IsTruncated) {
      listPrams.ContinuationToken = listObjects.NextContinuationToken;
      await copyS3Folder(source, destination, continuationToken);
    }
  } catch (err) {
    console.error("Error copyging folder:", err);
  }
}

function writeFile(filePath, fileData) {
  return new Promise(async (resolve, reject) => {
    await createFolder(path.dirname(filePath));

    fs.writeFile(filePath, fileData, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function createFolder(dirName) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirName, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export const saveTos3 = async (key, filePath, content) => {
  const params = {
    Bucket: process.env.S3_BUCKET ?? "",
    Key: `${key}${filePath}`,
    Body: content,
  };
  const putCommand = new PutObjectCommand(params)
  await s3.send(putCommand);
};
