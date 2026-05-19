import prisma from './prisma';

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('MySQL Connected via Prisma');
  } catch (error: any) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
