import mongoose from 'mongoose';

// استخدم متغير البيئة (MONGO_URI أو MONGODB_URI كما في Render) أو الرابط الافتراضي للتطوير المحلي
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

export const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ DB Connected');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    if (error.message.includes('querySrv ENOTFOUND')) {
      console.log('💡 سبب محتمل: DNS لا يدعم SRV (شبكة أو جدار ناري).');
      console.log('   الحل: استخدم Standard connection string من Atlas (Connect → MongoDB Compass) أو شغّل MongoDB محلياً.');
    } else {
      console.log('⚠️  تأكد من تشغيل MongoDB أو ضبط MONGO_URI في ملف .env');
    }
  }
};