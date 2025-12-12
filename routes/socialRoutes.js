import express from 'express';

import { deletePost, getNewsFeed, getPostById, getPostbyUser, getTrendingPosts, updatePost, uploadAPost } from "../controller/postController.js";

const socialRoutes = express.Router()


// All routes require authentication


// Post routes
socialRoutes.post('/create', uploadAPost);
socialRoutes.get('/user/:userId', getPostbyUser); // Get user posts
socialRoutes.get('/newsfeed', getNewsFeed); // Facebook-like infinite scroll
socialRoutes.get('/trending', getTrendingPosts); // Trending posts
socialRoutes.get('/:postId', getPostById); // Get single post

socialRoutes.put('/:postId', updatePost); // Update post
socialRoutes.delete('/:postId', deletePost); // Delete post

export default socialRoutes;