# نشر الباك إند على Render

## الخطوات:

### 1. إنشاء قاعدة بيانات MongoDB Atlas (مجاناً)
1. اذهب إلى [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. سجل دخول أو أنشئ حساب جديد
3. أنشئ Cluster جديد (اختر FREE tier)
4. انتظر حتى يتم إنشاء الـ Cluster
5. اضغط على "Connect" واختر "Connect your application"
6. انسخ رابط الاتصال (connection string)

### 2. نشر على Render
1. اذهب إلى [Render](https://render.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط على "New +" واختر "Web Service"
4. اربط حسابك على GitHub أو ارفع الكود يدوياً
5. اختر مجلد `backend`

### 3. إعدادات Render:
- **Name**: portfolio-backend (أو أي اسم تريده)
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Plan**: Free

### 4. إضافة Environment Variables:
في صفحة الإعدادات، أضف:
- `MONGODB_URI` = رابط MongoDB Atlas الذي نسخته
- `PORT` = 3001
- `NODE_ENV` = production

### 5. Deploy
اضغط على "Create Web Service" وانتظر حتى ينتهي النشر.

## النتيجة
ستحصل على رابط مثل:
`https://portfolio-backend-xxxx.onrender.com`

استخدم هذا الرابط في الفرونت إند والأدمين!

