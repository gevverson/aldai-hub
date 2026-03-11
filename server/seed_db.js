import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './db.js';
import Project from './models/Project.js';
import { projects } from './data/seed.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Project.deleteMany();
    
    // Insert seed data
    const insertedProjects = await Project.insertMany(projects);
    console.log(`Successfully seeded ${insertedProjects.length} projects.`);
    
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

seedData();
