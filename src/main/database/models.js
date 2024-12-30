import schemas from './schemas/index'

class Models {
  constructor() {
    this.masterModels = null
    this.orgModels = null
  }

  initializeMasterModels(connection) {
    console.log('Initializing master models...')
    this.masterModels = {
      Organization: connection.model('organizations', schemas.organizations)
    }
    console.log('Master models initialized')
  }

  initializeOrgModels(connection) {
    console.log('Initializing org models...')
    this.orgModels = {
      User: connection.model('users', schemas.users),
        Category: connection.model('categories', schemas.category),
        Space: connection.model('spaces', schemas.space),
        PrimaryGuest: connection.model('primary_guests', schemas.primaryGuest),
        AdditionalGuest: connection.model('additional_guests', schemas.additionalGuest),
        Service: connection.model('services', schemas.service),
        Booking: connection.model('bookings', schemas.booking),
        Invoice: connection.model('invoices', schemas.invoice),
        Document: connection.model('documents', schemas.document)
    }
    console.log('Org models initialized')
  }

  getMasterModels() {
    if (!this.masterModels) {
      console.error('Master models not initialized')
      return null
    }
    return this.masterModels
  }

  getOrgModels() {
    if (!this.orgModels) {
      console.error('Org models not initialized')
      return null
    }
    return this.orgModels
  }
}

const models = new Models()
export default models
