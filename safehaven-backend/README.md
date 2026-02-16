# SafeHaven Backend

Login API using AWS DynamoDB.

## Setup

1. **Copy env file and add your credentials**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `AWS_REGION` – e.g. `us-east-1`
   - `AWS_ACCESS_KEY_ID` – from IAM → Users → safehaven-backend-user → Security credentials → Create access key
   - `AWS_SECRET_ACCESS_KEY` – from the same “Create access key” step (save it when shown)
   - `JWT_SECRET` – any long random string

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create DynamoDB table**
   In AWS Console → DynamoDB → Create table:
   - Table name: `users`
   - Partition key: `username` (String)

4. **Create a test user**
   ```bash
   npm run create-user
   ```
   This creates user `admin` with password `test123`.

5. **Start the server**
   ```bash
   npm start
   ```
   Server runs at http://localhost:5000.

## Run frontend

From project root:
```bash
cd safehaven-web
npm start
```
Then open http://localhost:3000 and log in with `admin` / `test123`.
