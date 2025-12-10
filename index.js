import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import Connection from './database/db.js';
import users from './routes/Routes.js';

import category from './routes/categoryRoutes.js';
import orders from './routes/orders.js';
import recentView from './routes/recent_view.js';
import ALLproducts from './routes/product_routes.js';
import cartRoutes from './routes/cart.js';
import wishListRoutes from './routes/wishList.js';
import storyRoute from './routes/storyRoutes.js';
import verifyToken from './middleware/verifyToken.js';

dotenv.config();
const app = express();
const PORT = 8000;


// ✅ Increase payload limit
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ✅ Enable CORS
app.use(cors());

// ✅ Connect to database
Connection();

// ✅ Register routes
app.use('/user', users);
app.use('/products',verifyToken, ALLproducts);
app.use('/categories',verifyToken, category);
app.use('/orders',verifyToken, orders)
app.use('/recent-view',verifyToken, recentView)
app.use('/cart', verifyToken, cartRoutes)
app.use('/wishlist', verifyToken, wishListRoutes)
app.use('/story',verifyToken, storyRoute)

// ✅ Default route
app.use('/', (req, res) => {
  res.json('Server is Running................');
});

// ✅ Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running successfully on PORT ${PORT}`);
});

