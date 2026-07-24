# 🌐 crud-app-webhook-nodejs

> This repository is only 1 of 3 components that make up the full application.

This repo contains the webhook service for the Laurel integration workflow. 

Laurel is a time-tracking platform used to help organizations manage employee timesheets, client work allocation, and billing-related data. 

Laurel’s application works by ingesting client data from systems such as their Practice Management System (PMS), using that information to train its AI models on how time should be allocated across accounts, and then generating timesheets automatically on behalf of end users.



## 🚀 Overview

This webhook is designed to receive a JSON payload from Google Cloud Platform (GCP) when a new record is added to the test Practice Management System (PMS) database. Once the payload arrives, the webhook processes the expected fields such as ClientCode, ClientName, and MatterID, and then writes the record into the Laurel database hosted on Azure Cloud SQL.



## 🎯 Purpose

Laurel relies on having the most current client-related information (e.g. Client Codes, Project IDs, Matter ID codes, etc.) available so employee timesheet data can be allocated to the correct clients. This webhook helps keep that information synchronized in near real time and supports the larger workflow of turning source data into accurate, automated timesheet generation.

## 🧩 What This Repo Does

- Receives incoming webhook events from GCP
- Validates and parses expected payload fields
- Stores or updates relevant records in Azure Cloud SQL
- Supports integration between the PMS source system and the Laurel data layer


## 🚀 Deploy to Azure App Service

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
az group create --name rg-laurel-webhook --location eastus
az appservice plan create --name plan-laurel-webhook --resource-group rg-laurel-webhook --sku B1 --is-linux
az functionapp create --resource-group rg-laurel-webhook --plan plan-laurel-webhook --name <your-unique-function-app-name> --runtime node --functions-version 4 --os-type Linux
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

- 🖥️ Frontend: https://github.com/snowgh0st/crud-app-frontend-nextjs
- ⚙️ Backend: https://github.com/snowgh0st/crud-app-backend-api-python
- 🔗 Webhook (this repository): the integration point that receives events and syncs data

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for more details if it is included in the repository.