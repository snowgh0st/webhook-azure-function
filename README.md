# 🌐 Webhook Azure Function

> This repository is only 1 of 3 components that make up the full application.

This repo contains the webhook service for a GCP PostgreSQL to Azure SQL integration workflow. 

## 🚀 Overview

This webhook is designed to receive a JSON payload from Google Cloud Platform (GCP) when a new record is added to a PostgreSQL database in GCP. Once the payload arrives, the webhook processes the expected fields such as ClientCode, ClientName, and ProjectID, and then writes the record into the destination AI App database hosted on Azure Cloud SQL.



## 🎯 Purpose

The AI App relies on having the most current client-related information (e.g. Client Codes, Project IDs, etc.) available so provide suggestions to the end users. This webhook helps keep that information synchronized in near real time and supports the larger workflow to downstream systems.

## 🧩 What This Repo Does

- Receives incoming webhook events from GCP
- Validates and parses expected payload fields
- Stores or updates relevant records in Azure Cloud SQL
- Supports integration between the source system's database and the AI application


## � PostgreSQL Trigger Setup for Create Events

If you are the owner of the source PostgreSQL database in GCP, you can capture new record inserts and forward them to this webhook so the Azure-side database stays in sync.

### Recommended flow

1. Create a trigger on the source table that fires after every `INSERT`.
2. In the trigger function, build a JSON payload containing the new row values.
3. Send that payload to the webhook endpoint exposed by this Azure Function.

### Example trigger pattern

The webhook expects a JSON body with fields such as `ClientCode`, `ClientName`, and `ProjectID`. A typical PostgreSQL setup looks like this:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_webhook()
RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'ClientCode', NEW.client_code,
    'ClientName', NEW.client_name,
    'ProjectID', NEW.project_id
  );

  PERFORM net.http_post(
    url := 'https://<your-function-app-name>.azurewebsites.net/api/httpTriggerGCPPostgreSQLtoAzureSQLwebhook',
    body := payload::text,
    headers := jsonb_build_object('content-type', 'application/json')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_client_insert
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION notify_webhook();
```

### Notes

- Replace the table name and column names with the ones used in your source database.
- If your PostgreSQL environment does not support `pg_net` or HTTP calls directly from the database, use a small service or worker in GCP to receive the trigger event and forward the payload to the webhook.
- If you want this behavior for multiple tables, create a similar trigger for each table or use a shared function with table-specific mapping.
- For a production deployment, consider adding retry, idempotency, and logging so failed deliveries can be recovered safely.

## �🚀 Deploy to Azure App Service

This project is an Azure Functions app, so it can be deployed to Azure App Service using the Azure Functions runtime.

### Prerequisites

- Azure CLI installed
- Node.js installed
- Azure Functions Core Tools installed
- An Azure subscription

### 1. Sign in to Azure

```bash
az login
```

### 2. Create the Azure resources

```bash
az group create --name rg-azure-webhook --location eastus

az appservice plan create --name plan-azure-webhook --resource-group rg-azure-webhook --sku B1 --is-linux

az functionapp create --resource-group rg-azure-webhook --plan plan-azure-webhook --name <your-unique-function-app-name> --runtime node --functions-version 4 --os-type Linux
```

### 3. Configure app settings

In Azure Portal or via Azure CLI, make sure the function app has the required settings, including:

- `AzureWebJobsStorage` (storage connection string)
- `FUNCTIONS_WORKER_RUNTIME=node`
- Any environment variables required by your webhook logic

### 4. Deploy the project

From the project root, run:

```bash
func azure functionapp publish <your-unique-function-app-name>
```

### 5. Verify deployment

After deployment, open the Azure portal and check the function app's Functions blade to confirm the webhook endpoint is available.

> Note: Do not rely on local settings from local.settings.json in production. Move any required secrets and configuration into Azure App Settings.


## 🛠️ Tech Stack

- Node.js
- Azure App Service
- Azure Cloud SQL
- JSON payload processing

## 📌 Note

This repository is just the webhook component of the larger application. The frontend and backend live in the repositories linked in the Related Repositories section below and work together with this service to provide the complete end-to-end experience.

## 🔗 Related Repositories

The full solution is made up of three parts:

- 🖥️ Frontend: https://github.com/snowgh0st/frontend-vercel
- ⚙️ Backend: https://github.com/snowgh0st/fastapi-azure-app-service
- 🔗 Webhook (this repository): the integration point that receives events and syncs data

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for more details if it is included in the repository.