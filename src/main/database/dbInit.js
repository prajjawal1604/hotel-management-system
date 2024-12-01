// database/dbInit.js
import { ObjectId } from 'mongodb';

const COLLECTIONS = {
  CATEGORIES: 'Categories',
  ROOMS: 'Rooms',
  BOOKINGS: 'Bookings'
};

// Complete schemas with all fields
const Schemas = {
  Categories: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "type", "lastUpdated"],
        properties: {
          name: {
            bsonType: "string",
            description: "Name of the category"
          },
          type: {
            bsonType: "string",
            enum: ["Room", "Hall"],
            description: "Type of category"
          },
          lastUpdated: {
            bsonType: "date",
            description: "Last update timestamp"
          }
        }
      }
    }
  },

  Rooms: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["name", "categoryId", "type", "status", "basePricePerNight", "gstPercentage", "maxPeople"],
        properties: {
          name: {
            bsonType: "string",
            description: "Room number/name"
          },
          categoryId: {
            bsonType: "objectId",
            description: "Reference to category collection"
          },
          type: {
            bsonType: "string",
            description: "Room type (Deluxe, Suite, etc.)"
          },
          status: {
            bsonType: "string",
            enum: ["Available", "Occupied", "Maintenance", "CheckoutPending"]
          },
          basePricePerNight: {
            bsonType: "number",
            description: "Base price per night"
          },
          gstPercentage: {
            bsonType: "number",
            description: "GST percentage"
          },
          currentGuest: {
            bsonType: ["object", "null"],
            properties: {
              name: { bsonType: "string" },
              phone_no: { bsonType: "long" },
              gender: { bsonType: "string" },
              aadhar: { bsonType: "long" },
              age: { bsonType: "number" },
              nationality: { bsonType: "string" },
              permanent_address: { bsonType: "string" },
              company_name: { bsonType: ["string", "null"] },
              GSTIN: { bsonType: ["string", "null"] },
              designation: { bsonType: ["string", "null"] },
              purpose_of_visit: { bsonType: ["string", "null"] },
              checkin: { bsonType: "date" },
              checkout: { bsonType: "date" },
              services: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["name", "cost", "units"],
                  properties: {
                    name: { bsonType: "string" },
                    cost: { bsonType: "number" },
                    units: { bsonType: "number" }
                  }
                }
              },
              dependants: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["name", "phone_no", "gender", "aadhar", "age", "kid"],
                  properties: {
                    name: { bsonType: "string" },
                    phone_no: { bsonType: "long" },
                    gender: { bsonType: "string" },
                    aadhar: { bsonType: "long" },
                    age: { bsonType: "number" },
                    kid: { bsonType: "bool" },
                    uploads: {
                      bsonType: "array",
                      items: { bsonType: "string" }
                    }
                  }
                }
              },
              uploads: {
                bsonType: "array",
                items: { bsonType: "string" }
              }
            }
          },
          maxPeople: {
            bsonType: "object",
            required: ["adults", "kids"],
            properties: {
              adults: { bsonType: "number" },
              kids: { bsonType: "number" }
            }
          },
          lastUpdated: {
            bsonType: "date",
            description: "Last update timestamp"
          }
        }
      }
    }
  },

  Bookings: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["billNo", "roomId", "guestDetails", "stayDetails", "charges", "status"],
        properties: {
          billNo: {
            bsonType: "string",
            description: "Unique bill number"
          },
          roomId: {
            bsonType: "objectId",
            description: "Reference to room collection"
          },
          guestDetails: {
            bsonType: "object",
            required: ["name", "phone_no", "gender", "aadhar"],
            properties: {
              name: { bsonType: "string" },
              phone_no: { bsonType: "long" },
              gender: { bsonType: "string" },
              aadhar: { bsonType: "long" },
              age: { bsonType: "number" },
              nationality: { bsonType: "string" },
              permanent_address: { bsonType: "string" },
              company_name: { bsonType: ["string", "null"] },
              GSTIN: { bsonType: ["string", "null"] },
              designation: { bsonType: ["string", "null"] },
              purpose_of_visit: { bsonType: ["string", "null"] },
              dependants: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["name", "phone_no", "gender", "aadhar", "age", "kid"],
                  properties: {
                    name: { bsonType: "string" },
                    phone_no: { bsonType: "long" },
                    gender: { bsonType: "string" },
                    aadhar: { bsonType: "long" },
                    age: { bsonType: "number" },
                    kid: { bsonType: "bool" }
                  }
                }
              }
            }
          },
          stayDetails: {
            bsonType: "object",
            required: ["checkin", "checkout", "fullDays"],
            properties: {
              checkin: { bsonType: "date" },
              checkout: { bsonType: "date" },
              fullDays: { bsonType: "number" },
              extraHours: { bsonType: "number" }
            }
          },
          charges: {
            bsonType: "object",
            required: ["roomCharges", "gstAmount", "totalAmount"],
            properties: {
              roomCharges: { bsonType: "number" },
              serviceCharges: { bsonType: "number" },
              gstAmount: { bsonType: "number" },
              gstBreakdown: {
                bsonType: "object",
                properties: {
                  cgst: { bsonType: "number" },
                  sgst: { bsonType: "number" }
                }
              },
              miscCharges: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["remark", "amount"],
                  properties: {
                    remark: { bsonType: "string" },
                    amount: { bsonType: "number" }
                  }
                }
              },
              totalAmount: { bsonType: "number" }
            }
          },
          services: {
            bsonType: "array",
            items: {
              bsonType: "object",
              required: ["name", "cost", "units"],
              properties: {
                name: { bsonType: "string" },
                cost: { bsonType: "number" },
                units: { bsonType: "number" }
              }
            }
          },
          status: {
            bsonType: "string",
            enum: ["COMPLETED", "CANCELLED"]
          },
          checkoutTimestamp: { bsonType: "date" },
          createdAt: { bsonType: "date" }
        }
      }
    }
  }
};

async function createIndexes(db) {
  await db.collection(COLLECTIONS.CATEGORIES).createIndex({ name: 1 }, { unique: true });
  await db.collection(COLLECTIONS.ROOMS).createIndex({ name: 1 }, { unique: true });
  await db.collection(COLLECTIONS.ROOMS).createIndex({ categoryId: 1 });
  await db.collection(COLLECTIONS.BOOKINGS).createIndex({ billNo: 1 }, { unique: true });
  await db.collection(COLLECTIONS.BOOKINGS).createIndex({ roomId: 1 });
  await db.collection(COLLECTIONS.BOOKINGS).createIndex({ checkoutTimestamp: 1 });
}

export async function initializeDatabase(db) {
  try {
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);

    // Only create collections that don't exist
    for (const [name, schema] of Object.entries(Schemas)) {
      if (!existingCollections.includes(name)) {
        await db.createCollection(name, schema);
        console.log(`Created collection: ${name}`);
      }
    }

    // Create or update indexes
    await createIndexes(db);
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { COLLECTIONS, Schemas };