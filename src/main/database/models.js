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
      Category: connection.model('Category', schemas.category),
      Space: connection.model('Space', schemas.space),
      PrimaryGuest: connection.model('PrimaryGuest', schemas.primaryGuest),
      AdditionalGuest: connection.model('AdditionalGuest', schemas.additionalGuest),
      Service: connection.model('Service', schemas.service),
      Booking: connection.model('Booking', schemas.booking),
      Invoice: connection.model('Invoice', schemas.invoice)
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
