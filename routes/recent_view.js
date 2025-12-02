import express from 'express';
import { getRecentView, postRecentView } from '../controller/RecentViewController.js';

const recentView = express.Router()


recentView.post('/',postRecentView)
recentView.get('/',getRecentView)

// https://codeshare.io/5w0R99


export default recentView