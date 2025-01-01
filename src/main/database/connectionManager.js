import mongoose from 'mongoose';
import models from './models';

class ConnectionManager {
    constructor() {
        this.masterConnection = null;
        this.orgConnection = null;

        // Hardcoded credentials
        this.masterUri = 'mongodb+srv://master:mmr%4012345@master-cluster.xu0s7.mongodb.net/?retryWrites=true&w=majority&appName=master-cluster';
        this.orgName = 'Maa Mangala Residency';

        console.log('DB Connection Initialized');
    }

    // Connect to Master DB
    async connectToMaster() {
        try {
            if (!this.masterConnection) {
                this.masterConnection = await mongoose.createConnection(this.masterUri);
                models.initializeMasterModels(this.masterConnection);
                console.log('Connected to Master DB');
            }
            return this.masterConnection;
        } catch (error) {
            console.error('Master DB Connection Error:', error);
            throw error;
        }
    }

    // Validate and Retrieve Organization DB URI
    async validateAndGetOrgUri() {
        try {
            console.log(`Searching for organization: "${this.orgName}"`);
            if (!this.masterConnection) {
                throw new Error('Master DB connection is not initialized. Call connectToMaster first.');
            }
            const masterDb = this.masterConnection.useDb('test');
            const organizations = masterDb.collection('organizations');
            const org = await organizations.findOne({ orgName: this.orgName });
            if (!org) {
                throw new Error(`Organization not found: "${this.orgName}"`);
            }
            if (!org.orgDbUri) {
                throw new Error(`Organization URI not found for: "${this.orgName}"`);
            }
            return org.orgDbUri;
        } catch (error) {
            console.error('Org Validation Error:', error);
            throw error;
        }
    }

    // Connect to Organization DB
    async connectToOrg() {
        try {
            const orgDbUri = await this.validateAndGetOrgUri();
            if (this.orgConnection) {
                await this.orgConnection.close();
            }
            this.orgConnection = await mongoose.createConnection(orgDbUri);
            models.initializeOrgModels(this.orgConnection);
            console.log('Connected to Org DB');
            return this.orgConnection;
        } catch (error) {
            console.error('Org DB Connection Error:', error);
            throw error;
        }
    }

    // Cleanup Method
    async closeConnections() {
        if (this.masterConnection) await this.masterConnection.close();
        if (this.orgConnection) await this.orgConnection.close();
        this.masterConnection = null;
        this.orgConnection = null;
        console.log('DB Connections Closed');
    }
}

// Export Singleton Instance
const connectionManager = new ConnectionManager();
export default connectionManager;
