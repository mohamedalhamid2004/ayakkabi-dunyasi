// Migration script to transfer data from SQLite to Firestore
// Run this AFTER Firebase has been initialized and you're ready to migrate

const admin = require('firebase-admin');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Initialize Firebase Admin (you'll need to set GOOGLE_APPLICATION_CREDENTIALS)
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const DB_FILE = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    } else {
        console.log("Connected to SQLite database.");
    }
});

async function migrateProducts() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products", [], async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            console.log(`Migrating ${rows.length} products...`);
            const batch = firestore.batch();

            for (const row of rows) {
                const docRef = firestore.collection('products').doc(String(row.id));
                batch.set(docRef, {
                    name: row.name,
                    price: row.price,
                    image: row.image,
                    description: row.description,
                    category: row.category,
                    type: row.type,
                    subtype: row.subtype,
                    colors: JSON.parse(row.colors || '[]'),
                    reviews: JSON.parse(row.reviews || '[]')
                });
            }

            await batch.commit();
            console.log('✅ Products migrated successfully!');
            resolve();
        });
    });
}

async function migrateUsers() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM users", [], async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            console.log(`Migrating ${rows.length} users...`);
            const batch = firestore.batch();

            for (const row of rows) {
                const docRef = firestore.collection('users').doc(String(row.id));
                batch.set(docRef, {
                    username: row.username,
                    password: row.password,
                    isAdmin: !!row.isAdmin,
                    email: row.email || '',
                    address: row.address || '',
                    phone: row.phone || '',
                    city: row.city || '',
                    district: row.district || ''
                });
            }

            await batch.commit();
            console.log('✅ Users migrated successfully!');
            resolve();
        });
    });
}

async function migrateOrders() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM orders", [], async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            console.log(`Migrating ${rows.length} orders...`);
            const batch = firestore.batch();

            for (const row of rows) {
                const docRef = firestore.collection('orders').doc(String(row.id));
                batch.set(docRef, {
                    user_id: String(row.user_id),
                    total: row.total,
                    status: row.status,
                    estimated_delivery: row.estimated_delivery,
                    items: JSON.parse(row.items || '[]'),
                    address: row.address,
                    created_at: row.created_at ? new Date(row.created_at) : new Date()
                });
            }

            await batch.commit();
            console.log('✅ Orders migrated successfully!');
            resolve();
        });
    });
}

async function migrate() {
    try {
        await migrateProducts();
        await migrateUsers();
        await migrateOrders();

        console.log('\n🎉 All data migrated successfully!');
        console.log('You can now deploy to Firebase.');

        db.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        db.close();
        process.exit(1);
    }
}

migrate();
