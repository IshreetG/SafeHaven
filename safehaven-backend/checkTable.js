const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkTable() {
  try {
    console.log(`Checking for table 'users' in region: ${process.env.AWS_REGION}`);
    
    const command = new DescribeTableCommand({ TableName: "users" });
    const result = await dynamoClient.send(command);
    
    console.log("\n✅ Table found!");
    console.log(`Table name: ${result.Table.TableName}`);
    console.log(`Table status: ${result.Table.TableStatus}`);
    console.log(`Region: ${result.Table.TableArn.split(":")[3]}`);
    console.log(`Partition key: ${result.Table.KeySchema[0].AttributeName}`);
    
    if (result.Table.TableStatus !== "ACTIVE") {
      console.log(`\n⚠️  Warning: Table status is ${result.Table.TableStatus}, not ACTIVE`);
    }
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.error("\n❌ Table 'users' NOT FOUND!");
      console.error("\nTo create it:");
      console.error("1. Go to: https://console.aws.amazon.com/dynamodb/");
      console.error("2. Click 'Create table'");
      console.error("3. Table name: users");
      console.error("4. Partition key: username (String)");
      console.error(`5. Region: ${process.env.AWS_REGION}`);
      console.error("6. Use default settings and click 'Create table'");
    } else {
      console.error("\n❌ Error:", error.message);
      console.error("Error code:", error.name);
    }
    process.exit(1);
  }
}

checkTable();
