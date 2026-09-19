# AWS infrastructure

`upload-storage.yml` provisions the private, encrypted, versioned S3 bucket used
for browser-to-S3 image uploads and a least-privilege managed policy for the
Next.js application role. Supply the exact deployed web origin for browser CORS.

Deployments must attach the output `UploadApplicationPolicyArn` only to the
application's execution role. The bucket is retained if its stack is deleted or
replaced; removing retained data is an explicit operational action.

SQS queues, dead-letter queues, workers, and their independent IAM policies will
be added with the asynchronous-processing increments.
