const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

/* --- PRODUCTS API --- */

app.get('/api/products', async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const doc = await db.collection('products').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, image, description, category, type, subtype, colors, reviews } = req.body;
        const docRef = await db.collection('products').add({
            name,
            price,
            image,
            description,
            category,
            type,
            subtype,
            colors: colors || [],
            reviews: reviews || []
        });
        res.json({ id: docRef.id, ...req.body });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const docRef = db.collection('products').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Not found" });
        }

        const current = doc.data();
        const updated = { ...current, ...req.body };

        if (req.body.colors) updated.colors = req.body.colors;
        if (req.body.reviews) updated.reviews = req.body.reviews;

        await docRef.update(updated);
        res.json({ id: doc.id, ...updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await db.collection('products').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* --- AUTH API --- */

app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Check if username already exists
        const existingUsers = await db.collection('users')
            .where('username', '==', username)
            .get();

        if (!existingUsers.empty) {
            return res.status(400).json({ message: "Bu kullanıcı adı dolu." });
        }

        const docRef = await db.collection('users').add({
            username,
            password,
            isAdmin: false,
            email,
            address: '',
            phone: '',
            city: '',
            district: ''
        });

        res.json({
            success: true,
            user: {
                id: docRef.id,
                username,
                password,
                isAdmin: false,
                email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const snapshot = await db.collection('users')
            .where('username', '==', username)
            .where('password', '==', password)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({
                success: false,
                message: "Hatalı kullanıcı adı veya şifre"
            });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        res.json({
            success: true,
            user: {
                id: userDoc.id,
                username: userData.username,
                isAdmin: !!userData.isAdmin,
                email: userData.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* --- USER & PROFILE API --- */

app.get('/api/users/:id', async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: "User not found" });
        }
        const userData = doc.data();
        res.json({
            id: doc.id,
            username: userData.username,
            isAdmin: !!userData.isAdmin,
            address: userData.address,
            email: userData.email,
            phone: userData.phone,
            city: userData.city,
            district: userData.district
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/profile', async (req, res) => {
    try {
        const { id, address, username, email, phone, city, district } = req.body;

        const updateData = {};
        if (address !== undefined) updateData.address = address;
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (city !== undefined) updateData.city = city;
        if (district !== undefined) updateData.district = district;

        if (Object.keys(updateData).length === 0) {
            return res.json({ success: true });
        }

        await db.collection('users').doc(id).update(updateData);
        res.json({ success: true, changes: Object.keys(updateData).length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                username: userData.username,
                email: userData.email,
                isAdmin: !!userData.isAdmin,
                address: userData.address
            });
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* --- ORDERS API --- */

app.get('/api/orders', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: "userId required" });
        }

        const snapshot = await db.collection('orders')
            .where('user_id', '==', userId)
            .orderBy('created_at', 'desc')
            .get();

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { userId, total, items, address } = req.body;
        const status = "Hazırlanıyor";

        // Estimated delivery: 3 days later
        const date = new Date();
        date.setDate(date.getDate() + 3);
        const estimated_delivery = date.toISOString().split('T')[0];

        const docRef = await db.collection('orders').add({
            user_id: userId,
            total,
            status,
            estimated_delivery,
            items,
            address,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ success: true, orderId: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/* --- RETURNS API --- */

app.post('/api/returns', async (req, res) => {
    try {
        const { userId, orderId, productName, type, reason } = req.body;
        const docRef = await db.collection('returns').add({
            user_id: userId,
            order_id: orderId,
            product_name: productName,
            type,
            reason,
            status: 'Beklemede',
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true, id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/returns', async (req, res) => {
    try {
        const userId = req.query.userId;
        let query = db.collection('returns').orderBy('created_at', 'desc');

        if (userId) {
            query = query.where('user_id', '==', userId);
        }

        const snapshot = await query.get();
        const returns = [];
        snapshot.forEach(doc => {
            returns.push({ id: doc.id, ...doc.data() });
        });

        res.json(returns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/returns/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await db.collection('returns').doc(req.params.id).update({ status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deprecated simple pay but kept for compatibility
app.post('/api/pay', (req, res) => {
    res.json({ success: true, message: "Ödeme başarıyla alındı." });
});

// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
