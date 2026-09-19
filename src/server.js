import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedDefaultCategoriesIfEmpty } from './controllers/category.controller.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();

    // Auto-seed default categories if not already populated
    await seedDefaultCategoriesIfEmpty();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Personal Finance Tracker API running on port ${PORT}`);
      console.log(`📖 Swagger API Docs: http://localhost:${PORT}/docs`);
      console.log(`💻 Interactive Client: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection] ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`[Server Start Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();
