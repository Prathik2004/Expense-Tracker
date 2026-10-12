import { Db, MongoClient } from 'mongodb';
import { config } from 'dotenv';

config();

async function runMigration() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db();

    // Add completed field with default false
    console.log('Adding completed field to goals collection...');
    await db.collection('goals').updateMany(
      { completed: { $exists: false } },
      { $set: { completed: false } }
    );

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function rollbackMigration() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db();

    // Remove completed field
    console.log('Removing completed field from goals collection...');
    await db.collection('goals').updateMany(
      { completed: { $exists: true } },
      { $unset: { completed: '' } }
    );

    console.log('Rollback completed successfully.');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'down') {
    rollbackMigration().catch(console.error);
  } else {
    runMigration().catch(console.error);
  }
}

export { runMigration, rollbackMigration };