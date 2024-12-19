const mongoose = require('mongoose');
require('dotenv').config();

class ConnectionManager {
    constructor() {
        this.masterConnection = null;
        this.orgConnection = null;
        this.orgId = process.env.ORG_ID;
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
    async validateAndGetOrgUri(orgId) {
        try {
            const Organization = this.masterConnection.model('Organization', new mongoose.Schema({
                orgname: String,
                subscriptionEndDate: Date,
                subscribedOn: Date,
                orgDbUri: String,
                email: String,
                gstNumber: String,
                gst: String
            }));

            const org = await Organization.findById(orgId);
            if (!org) throw new Error('Organization not found');

            // Check subscription validity
            if (new Date(org.subscriptionEndDate) < new Date()) {
                throw new Error('Subscription expired');
            }

            return org.orgDbUri;
        } catch (error) {
            console.error('Org Validation Error:', error);
            throw error;
        }
    }

    // Connect to org DB
    async connectToOrg() {
        try {
            const orgDbUri = await this.validateAndGetOrgUri(this.orgId);
            
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
module.exports = connectionManager;