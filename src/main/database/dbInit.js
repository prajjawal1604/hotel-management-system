import connectionManager from './connectionManager';
import models from './models';

async function initializeOrgData() {
  try {
    const orgModels = models.getOrgModels();
    if (!orgModels) {
      throw new Error('Org models not initialized properly');
    }
    // Get all models
    const { 
      User, 
      Category, 
      Space, 
      PrimaryGuest,
      AdditionalGuest,
      Service,
      Booking,
      Invoice 
    } = orgModels;

    // Check and create admin user if doesn't exist
const adminExists = await User.findOne({ role: 'ADMIN' });
if (!adminExists) {
  await User.create({
    username: 'admin',
    password: 'admin123',
    email: 'admin@hotel.com',
    role: 'ADMIN'
  });
  console.log('Admin user created');
}

// Check and create front-office user if doesn't exist
const frontOfficeExists = await User.findOne({ role: 'FRONT_OFFICE' });
if (!frontOfficeExists) {
  await User.create({
    username: 'frontoffice',
    password: 'front123',
    email: 'frontoffice@hotel.com',
    role: 'FRONT_OFFICE'
  });
  console.log('Front Office user created');
}

    // Initialize categories with some floors
    const categoryExists = await Category.findOne();
    if (!categoryExists) {
      const categories = ['Floor 1', 'Floor 2', 'Floor 3'].map(name => ({
        categoryName: name,
        lastUpdated: new Date()
      }));
      await Category.insertMany(categories);
      console.log('Default categories created');

      // Add some sample rooms for each floor
      const floor1 = await Category.findOne({ categoryName: 'Floor 1' });
      if (floor1) {
        const sampleRooms = [
          {
            categoryId: floor1._id,
            spaceName: '101',
            spaceType: 'DELUX',
            currentStatus: 'AVAILABLE',
            basePrice: 2500,
            maxOccupancy: { adults: 2, kids: 2 }
          },
          {
            categoryId: floor1._id,
            spaceName: '102',
            spaceType: 'A/C',
            currentStatus: 'AVAILABLE',
            basePrice: 2000,
            maxOccupancy: { adults: 2, kids: 1 }
          }
        ];
        await Space.insertMany(sampleRooms);
        console.log('Sample rooms created');
      }
    }

    // Initialize other collections (they'll be created automatically when needed)
    const collections = [
      { model: PrimaryGuest, name: 'primaryguests' },
      { model: AdditionalGuest, name: 'additionalguests' },
      { model: Service, name: 'services' },
      { model: Booking, name: 'bookings' },
      { model: Invoice, name: 'invoices' }
    ];

    for (const collection of collections) {
      try {
        await collection.model.createCollection();
        console.log(`Collection ${collection.name} initialized`);
      } catch (error) {
        if (error.code !== 48) { // Ignore "collection already exists" error
          console.error(`Error creating collection ${collection.name}:`, error);
        }
      }
    }

    console.log('Organization data initialization complete');

  } catch (error) {
    console.error('Failed to initialize organization data:', error);
    throw error;
  }
}

async function initializeDatabases() {
  try {
    // Connect to master
    await connectionManager.connectToMaster();
    
    // Connect to org DB using org ID from .env
    await connectionManager.connectToOrg();
    
    // Initialize collections and sample data
    await initializeOrgData();
    
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export { initializeDatabases };