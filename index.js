import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

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
import socialRoutes from './routes/socialRoutes.js';

import path from "path";
import { fileURLToPath } from "url";
import chatRoom from './routes/chatRoom.js';

dotenv.config();

const app = express();
const PORT = 8000;

/* ---------------- Middleware ---------------- */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: "*",  // change for production
  methods: ["GET", "POST"]
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------- DB ---------------- */
Connection();

/* ---------------- Routes ---------------- */
app.use('/user', users);
app.use('/products', verifyToken, ALLproducts);
app.use('/categories', verifyToken, category);
app.use('/orders', verifyToken, orders);
app.use('/recent-view', verifyToken, recentView);
app.use('/cart', verifyToken, cartRoutes);
app.use('/wishlist', verifyToken, wishListRoutes);
app.use('/story', verifyToken, storyRoute);
app.use('/social', verifyToken, socialRoutes);
app.use('/chatroom', verifyToken, chatRoom)


app.get('/', (req, res) => {
  res.json('Server is Running................');
});

/* ---------------- Socket Server ---------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // frontend URL in production
    methods: ["GET", "POST"]
  }
});

/* ---------------- Socket Events ---------------- */
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ---------------- Start Server ---------------- */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
});
