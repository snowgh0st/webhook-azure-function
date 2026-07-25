const { app } = require('@azure/functions');
const { Connection, Request, TYPES } = require('tedious'); 
const { DefaultAzureCredential } = require('@azure/identity');

const credential = new DefaultAzureCredential();

const sqlConfig = {
    server: process.env.AZURE_SQL_SERVER,
    authentication: {
        type: 'azure-active-directory-msi-app-service', // Optimized for Flex Consumption / App Service infrastructure
        options: {
            tokenCredential: credential 
        }
    },
    options: {
        database: process.env.AZURE_SQL_DATABASE,
        encrypt: true,
        trustServerCertificate: false
    }
};

app.http('httpTriggerAWSAuroratoAzureSQLwebhook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request.');

        let data;
        try {
            data = await request.json();
        } catch (err) {
            return { status: 400, body: 'Invalid JSON body.' };
        }

        const { ClientCode, ClientName, ProjectID } = data;

        return new Promise((resolve) => {
            context.log('Initiating Azure SQL connection...');
            const sqlConnection = new Connection(sqlConfig);

            sqlConnection.on('connect', (err) => {
                if (err) {
                    // FIXED: Changed context.log.error to context.error
                    context.error('❌ SQL Connection Error details:', err.message, err.code); 
                    resolve({ status: 500, body: `Database Connection Failed: ${err.message}` });
                    return;
                }

                context.log('✅ SQL Connected successfully. Executing query...');
                const query = `INSERT INTO dbo.Clients (ClientCode, ClientName, ProjectID) VALUES (@ClientCode, @ClientName, @ProjectID)`;

                const sqlRequest = new Request(query, (rowCount, err) => {
                    sqlConnection.close();
                    if (err) {
                        // FIXED: Changed context.log.error to context.error
                        context.error('❌ Insert Query Error:', err.message); 
                        resolve({ status: 500, body: `Insert Failed: ${err.message}` });
                    } else {
                        context.log(`🎉 Success! Rows inserted: ${rowCount}`);
                        resolve({ status: 200, body: `Successfully inserted ${rowCount} row(s)` });
                    }
                });

                sqlRequest.addParameter('ClientCode', TYPES.NVarChar, ClientCode);
                sqlRequest.addParameter('ClientName', TYPES.NVarChar, ClientName);
                sqlRequest.addParameter('ProjectID', TYPES.NVarChar, ProjectID);
                sqlConnection.execSql(sqlRequest);
            });

            sqlConnection.on('error', (err) => {
                // FIXED: Changed context.log.error to context.error
                context.error('❌ Global SQL Error:', err); 
            });

            sqlConnection.connect();
        });
    }
});
