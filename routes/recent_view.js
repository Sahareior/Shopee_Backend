import express from 'express';
import { getRecentView, postRecentView } from '../controller/RecentViewController.js';

const recentView = express.Router()


recentView.post('/',postRecentView)
recentView.get('/',getRecentView)




export default recentView