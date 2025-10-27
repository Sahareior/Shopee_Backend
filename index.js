import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import Connection from './database/db.js';
import users from './routes/Routes.js';
import products from './routes/Products.js';
import category from './routes/categoryRoutes.js';

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
app.use('/products', products);
app.use('/categories', category);

// ✅ Default route
app.use('/', (req, res) => {
  res.json('Server is Running................');
});

// ✅ Start the server
app.listen(PORT, () => console.log(`Server is running successfully on PORT ${PORT}`));
