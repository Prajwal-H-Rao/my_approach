import {S3Client,ListObjectsV2Command,CopyObjectCommand} from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region:process.env.AWS_REGION,
  credentials:{accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY},
  endpoint: process.env.S3_ENDPOINT,
});

export async function copyS3Folder(source, destination, continuationToken) {
  try {
    const listParams = {
      Bucket: process.env.S3_BUCKET ?? "",
      Prefix: source,
      ContiniuationToken: continuationToken,
    }

    const listCommand = new ListObjectsV2Command(listParams)
    const listObjects = await s3.send(listCommand)

    if (!listObjects.Contents || listObjects.Contents.length === 0) return;

    await Promise.all(
      listObjects.Contents.map(async (object) => {
        if (!object.Key) return;
        let destinationKey = object.Key.replace(source, destination);
        let copyParams = {
          Bucket: process.env.S3_BUCKET ?? "",
          CopySource: `${process.env.S3_BUCKET}/${object.Key}`,
          Key: destinationKey,
        };

        console.log(copyParams);
        const copyCommand  = new CopyObjectCommand(copyParams)
        await s3.send(copyCommand)
        console.log(`Copied ${object.Key} to ${destinationKey}`);
      })
    );

    if (listObjects.IsTruncated) {
      await copyS3Folder(source, destination, continuationToken,listObjects.NextContinuationToken);
    }
  } catch (error) {
    console.error("Error copying folder", error);
  }
}