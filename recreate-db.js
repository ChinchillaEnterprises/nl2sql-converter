const DatabaseSetup = require('./src/database/setupDatabase');

async function recreateDatabase() {
  console.log('Recreating database with proper data...');
  const dbSetup = new DatabaseSetup();
  
  try {
    await dbSetup.setup();
    console.log('Database recreated successfully!');
  } catch (error) {
    console.error('Error recreating database:', error);
  }
}

recreateDatabase();