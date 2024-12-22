import schemas from './schemas/index';

class Models {
    constructor() {
        this.masterModels = null;
        this.orgModels = null;
    }

    initializeMasterModels(connection) {
        this.masterModels = {
            organizations: connection.model('organizations', schemas.organizations)
        };
    }

    initializeOrgModels(connection) {
        this.orgModels = {
            User: connection.model('User', schemas.user),
            Category: connection.model('Category', schemas.category),
            Space: connection.model('Space', schemas.space),
            PrimaryGuest: connection.model('PrimaryGuest', schemas.primaryGuest),
            AdditionalGuest: connection.model('AdditionalGuest', schemas.additionalGuest),
            Service: connection.model('Service', schemas.service),
            Booking: connection.model('Booking', schemas.booking),
            Invoice: connection.model('Invoice', schemas.invoice)
        };
    }

    getMasterModels() {
        return this.masterModels;
    }

    getOrgModels() {
        return this.orgModels;
    }
}

const models = new Models();
export default models;