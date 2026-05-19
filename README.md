# Ziko Home - Server Documentation

## 🚀 Quick Start
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Configuration**:
   Create a `.env` file based on the schema in `src/config/env.ts`.
   ```env
   DATABASE_URL="mysql://user:pass@host:3306/db"
   JWT_SECRET="your_secret"
   JWT_REFRESH_SECRET="your_refresh_secret"
   REDIS_URL="redis://localhost:6379"
   ```
3. **Database Initialization**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   ```
4. **Run Server**:
   ```bash
   npm run dev
   ```

---

## 📦 Docker Support
A `Dockerfile` and `docker-compose.yml` are provided for containerized deployment.
```bash
docker-compose up -d --build
```
This starts both the **API Server** and a **Redis** instance.

---

## 🌐 Alternative Hosting Guides

### 1. Railway.app / Koyeb / Railway (Easiest)
These platforms auto-detect the `Dockerfile` in the root.
1. **Link Repo**: Connect your GitHub.
2. **Environment Variables**: Add all variables from your `.env`.
3. **Port**: Set the port to `5000` (or match your `PORT` env var).
4. **Database**: Most of these platforms provide a MySQL/Redis addon. Link them and update your `DATABASE_URL` and `REDIS_URL`.

### 2. DigitalOcean App Platform (Web Service)
1. **Create App**: Select your repo.
2. **Resource Type**: Choose **Web Service**.
3. **Source**: Ensure it points to the `ziko-home-server` directory.
4. **Build**: It will use the `Dockerfile` automatically.
5. **HTTP Port**: Set to `5000`.

### 3. AWS App Runner
1. **Service Type**: Source code repository.
2. **Runtime**: Select **Docker**.
3. **Build Settings**: Use the defaults (it will read the `Dockerfile`).
4. **Networking**: Ensure it has access to your RDS (MySQL) and ElastiCache (Redis) instances.

---

## 🛠️ Key Modules
- **Prisma**: Database ORM (MySQL).
- **Express**: Web Framework.
- **Cloudinary**: Image management (Multer storage).
- **Redis**: Caching and Rate-limiting.
- **Resend**: Transactional Email/OTP.

---

## 🔒 Security Checklist
- [ ] Set `NODE_ENV=production`.
- [ ] Set `ENABLE_DEV_OTP_ROUTES=false`.
- [ ] Ensure `JWT_SECRET` is at least 32 characters.
- [ ] Configure `CLIENT_URL` to allow only your production frontend domain.
