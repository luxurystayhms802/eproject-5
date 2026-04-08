import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    await db.collection('roles').updateOne(
        { name: 'admin' }, 
        { $addToSet: { permissions: { $each: ['users.read', 'users.create', 'users.update', 'users.delete'] } } }
    );
    console.log('Fixed permissions successfully');
    process.exit(0);
});
