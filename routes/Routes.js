import express from 'express';
import {  getUser, signIn, signUp } from '../controller/userController.js';

const users = express.Router()


users.post('/sign-up',signUp)
users.get('/all-users',getUser)
users.post("/sign-in", signIn)



export default users