import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_S3_ENDPOINT,
});

/**
 * Upload image buffer to S3
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  };

  try {
    const result = await s3.upload(params).promise();
    console.log('Image uploaded to S3:', result.Location);
    return result.Location;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
}

/**
 * Get signed URL for private image
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: expiresIn,
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw error;
  }
}

/**
 * Delete object from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log('Image deleted from S3:', key);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
}
