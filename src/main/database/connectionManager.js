import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class ConnectionManager {
    constructor() {
        this.masterConnection = null;
        this.orgConnection = null;
        this.orgName = process.env.ORG_NAME;
    }

    // Connect to master DB
    async connectToMaster() {
        try {
            if (!this.masterConnection) {
                this.masterConnection = await mongoose.createConnection(process.env.MASTER_DB_URI);
                console.log('Connected to Master DB');
            }
            return this.masterConnection;
        } catch (error) {
            console.error('Master DB Connection Error:', error);
            throw error;
        }
    }

    // Validate org and get connection URI
    // Validate org and get connection URI (Hardcoded orgName)
async validateAndGetOrgUri() {
    try {
        console.log(`Searching for organization: "Maa Mangala Residency"`);

        // Ensure the master connection exists
        if (!this.masterConnection) {
            throw new Error("Master DB connection is not initialized. Call connectToMaster first.");
        }

        // Get master database explicitly
        const masterDb = this.masterConnection.useDb('master');

        // Get organizations collection
        const organizations = masterDb.collection('organizations');

        // Hardcoded organization name for now
        const org = await organizations.findOne({ orgName: "Maa Mangala Residency" }); // Match exact field name and value
        console.log('Query result:', org);

        if (!org) {
            throw new Error(`Organization not found: "Maa Mangala Residency"`);
        }

        if (!org.orgDbUri) {
            throw new Error(`Organization URI not found for: "Maa Mangala Residency"`);
        }

        return org.orgDbUri; // Return the database URI
    } catch (error) {
        console.error('Org Validation Error:', error.message);
        throw error;
    }
}


    // Connect to org DB
    async connectToOrg() {
        try {
            const orgDbUri = await this.validateAndGetOrgUri(this.orgName);
            
            // Close existing org connection if any
            if (this.orgConnection) {
                await this.orgConnection.close();
            }

            this.orgConnection = await mongoose.createConnection(orgDbUri);
            console.log('Connected to Org DB');
            return this.orgConnection;
        } catch (error) {
            console.error('Org DB Connection Error:', error);
            throw error;
        }
    }

    // Get current connections
    getMasterConnection() {
        return this.masterConnection;
    }

    getOrgConnection() {
        return this.orgConnection;
    }

    // Cleanup method
    async closeConnections() {
        if (this.masterConnection) await this.masterConnection.close();
        if (this.orgConnection) await this.orgConnection.close();
        this.masterConnection = null;
        this.orgConnection = null;
    }
}

// Export a singleton instance
const connectionManager = new ConnectionManager();
export default connectionManager;