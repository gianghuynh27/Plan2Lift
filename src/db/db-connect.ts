import mongoose from 'mongoose';

export default async function dbConnect(
  uri: string,
): Promise<mongoose.Mongoose | null> {
  try {
    const connection = await mongoose.connect(uri, {
      autoIndex: true,
      autoCreate: true,
    });

    console.log('MongoDB connected successfully');

    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return null;
  }
}
