import express from "express";
import { addCategory, getAllCategories } from "../controller/categoryController.js"
const category = express.Router();

category.post("/", addCategory);
category.get("/", getAllCategories);

export default category;
