require('dotenv').config();
const { Pool } = require('pg');

async function populateDatabase() {
    const connectionString = process.argv[2];
    if (!connectionString) {
        console.error('Please provide the Neon database connection string as a command-line argument.');
        process.exit(1);
    }

    const pool = new Pool({ connectionString });
    const db = {
        query: (text, params) => pool.query(text, params),
    };

    try {
        console.log('Dropping existing tables...');
        await db.query(`DROP TABLE IF EXISTS freezer_items;`);
        await db.query(`DROP TABLE IF EXISTS storage_area_groups;`);
        await db.query(`DROP TABLE IF EXISTS item_groups;`);
        await db.query(`DROP TABLE IF EXISTS storage_areas;`);
        await db.query(`DROP TABLE IF EXISTS users;`);
        console.log('Tables dropped.');

        console.log('Creating users table...');
        await db.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                google_id TEXT UNIQUE,
                name TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Users table created.');

        console.log('Creating item_groups table...');
        await db.query(`
            CREATE TABLE item_groups (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                group_name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Item_groups table created.');

        console.log('Creating storage_areas table...');
        await db.query(`
            CREATE TABLE storage_areas (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Storage_areas table created.');

        console.log('Creating storage_area_groups table...');
        await db.query(`
            CREATE TABLE storage_area_groups (
                storage_area_id UUID NOT NULL REFERENCES storage_areas(id) ON DELETE CASCADE,
                group_id UUID NOT NULL REFERENCES item_groups(id) ON DELETE CASCADE,
                PRIMARY KEY (storage_area_id, group_id)
            );
        `);
        console.log('Storage_area_groups table created.');

        console.log('Creating freezer_items table...');
        await db.query(`
            CREATE TABLE freezer_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                storage_area_id UUID REFERENCES storage_areas(id) ON DELETE CASCADE,
                group_id UUID REFERENCES item_groups(id) ON DELETE SET NULL,
                item_name TEXT NOT NULL,
                quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
                category TEXT,
                expiry_date DATE,
                barcode TEXT,
                date_added DATE
            );
        `);
        console.log('Freezer_items table created.');

        console.log('Database tables created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error populating database tables:', err.stack);
        process.exit(1);
    }
}

populateDatabase();
