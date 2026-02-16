const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
require("dotenv").config();

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function createUser() {
  const username = "admin";
  const password = "test123";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const command = new PutCommand({
      TableName: "users",
      Item: {
        username: username,
        id: crypto.randomUUID(),
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    console.log(`User "${username}" created successfully!`);
    console.log(`Password: ${password}`);
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.error("\n❌ ERROR: DynamoDB table 'users' not found!");
      console.error("\nPlease create the table first:");
      console.error("1. Go to AWS Console → DynamoDB");
      console.error("2. Click 'Create table'");
      console.error("3. Table name: users");
      console.error("4. Partition key: username (String)");
      console.error(`5. Make sure region is: ${process.env.AWS_REGION || "us-east-1"}`);
      console.error("\nThen run this script again.");
    } else if (error.name === "UnrecognizedClientException" || error.message.includes("region")) {
      console.error("\n❌ ERROR: AWS region mismatch!");
      console.error(`Current region in .env: ${process.env.AWS_REGION}`);
      console.error("Make sure your DynamoDB table is in the same region.");
    } else {
      console.error("\n❌ Error:", error.message);
      console.error("Full error:", error);
    }
    process.exit(1);
  }
}

createUser();
