# 🛒 Eshop – Multivendor eCommerce Platform (Microservices-Based)

> Built with ❤️ by **Becodemy**  
> A scalable, modern eCommerce SaaS with seller dashboard, real-time analytics, and microservice architecture.

---

## ⚠️ Legal Disclaimer

This source code is **licensed for individual use only**.

> 🚫 **Strictly Prohibited:**  
> Sharing, reselling, publishing to GitHub/public repos, or redistributing this codebase in any form is a **violation of licensing terms**.

We retain full rights under the **laws of the United Kingdom and Wales**. Legal actions will be taken in case of any misuse. We actively monitor license violations.

---

## 🧩 Project Structure – Services Breakdown

| Service                  | Description                                       | Port |
| ------------------------ | ------------------------------------------------- | ---- |
| `admin-service`          | Backend service for admin operations              | 6005 |
| `admin-ui`               | Frontend for managing admin dashboard             | 3002 |
| `api-gateway`            | API layer that connects all backend microservices | 8080 |
| `auth-service`           | Handles login, register, token refresh, etc.      | 6001 |
| `auth-service-e2e`       | End-to-end test suite for `auth-service`          | -    |
| `chatting-service`       | Real-time chat service between buyers and sellers | 6006 |
| `kafka-service`          | Kafka setup for event-driven messaging            |  -   |
| `logger-service`         | Captures logs/events across all services          | 6008 |
| `order-service`          | Manages orders, statuses, shipping, etc.          | 6003 |
| `product-service`        | Handles products, categories, filtering           | 6002 |
| `recommendation-service` | AI-based product recommendations                  | 6007 |
| `seller-service`         | Seller profile, store data, and control center    | 6004 |
| `seller-ui`              | Seller dashboard interface                        | 3001 |
| `user-ui`                | Main user-facing frontend                         | 3000 |

> **Note:** `kafka-service` and `auth-service-e2e` don't have ports as they are not Express applications. The kafka-service is a Kafka consumer that processes events in the background.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **pnpm**
- **Docker** and **Docker Compose** (for Kafka infrastructure and production deployment)
- **Git** for cloning the repository

### 1. Clone the Repository

```bash
git clone https://github.com/becodemy/eshop.git
cd eshop
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

**Important:** Update the `.env` file with your actual credentials (see Environment Variables section below).

### 3. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 4. Start Kafka Infrastructure

```bash
# Start Kafka, Zookeeper, and create topics
npm run docker:start-kafka-stack
```

### 5. Development Mode (Recommended for Local Development)

```bash
# Start all services in development mode with hot reload
npm run dev
```

This command will start all backend services and frontend applications simultaneously with hot reload enabled.

### 6. Production Mode (Local Testing)

```bash
# Build all services
npm run build

# Start all services in production mode
npm run start:prod
```

### 7. Docker Production Mode (Production-like Testing)

```bash
# Build and run all services with Docker
npm run docker:prod

# Or use individual Docker commands:
npm run docker:build    # Build all Docker images
npm run docker:run      # Run all services
npm run docker:stop     # Stop all services
npm run docker:clean    # Clean up containers and images
npm run docker:logs     # View logs from all services
```

### 8. Access the Applications

Once all services are running:

| Application          | URL                   | Description                 |
| -------------------- | --------------------- | --------------------------- |
| **User Frontend**    | http://localhost:3000 | Main customer-facing app    |
| **Seller Dashboard** | http://localhost:3001 | Seller management interface |
| **Admin Panel**      | http://localhost:3002 | Admin control center        |
| **API Gateway**      | http://localhost:8080 | Backend API endpoint        |

---

## 🔐 Environment Variables Setup

### Required Environment Variables

Update your `.env` file with the following credentials:

## 🛠️ How to Get Your `.env` Values

This section walks you through how to obtain **each required environment variable** to run the project locally or in production.

---

### 🔹 `DATABASE_URL` – MongoDB Atlas

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and a new **project**.
3. Click **Build a Database** → Choose Free Tier.
4. Select a region and deploy your cluster.
5. Once ready, go to your cluster → **Connect** → **Drivers** → Copy the connection string.
6. Replace `<password>` with your MongoDB password and add your DB name.

Example:

```env
DATABASE_URL="mongodb+srv://your-username:your-password@cluster0.mongodb.net/eshop-db"
```

---

### 🔸 `REDIS_DATABASE_URI` – Upstash Redis

1. Go to [https://upstash.com](https://upstash.com)
2. Create an account and a **Redis** database.
3. Go to the **REST API** tab.
4. Copy the **Redis REST URL**.

Example:

```env
REDIS_DATABASE_URI="rediss://global-winter-xxxx.upstash.io"
```

---

### 📧 SMTP Config – Gmail (or any SMTP provider)

For sending emails using **Gmail SMTP**:

1. Go to [https://myaccount.google.com](https://myaccount.google.com)
2. Enable **2-step verification**.
3. Then go to **App Passwords** section.
4. Generate a password for "Mail".

Use these values:

```env
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
```

---

### 🔑 `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`

Use any secure string. You can generate one using [https://generate-random.org](https://generate-random.org)

Example:

```env
ACCESS_TOKEN_SECRET="fj2#Z8Kp$1sn_9dVk12@@kKd7"
REFRESH_TOKEN_SECRET="7DJskf**4ss@Q29s2AakjWv"
```

---

### 💳 Stripe Keys – Payments

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Go to **Developers → API keys**
   - Copy your **Secret Key**
3. Go to **Webhooks** → Create a webhook endpoint
   - URL: `http://localhost:8080/order/webhook` (or your deployed backend)
   - Events: `checkout.session.completed`
   - Copy the generated **Webhook Signing Secret**

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."
```

---

### 🖼️ ImageKit Keys – Image CDN

1. Go to [https://imagekit.io/dashboard](https://imagekit.io/dashboard)
2. Create an account and a project.
3. Go to **Developer → API Keys**
   - Copy **Public API Key**
   - Copy **Private API Key**

```env
IMAGEKIT_PUBLIC_KEY="public_xyz..."
IMAGEKIT_SECRET_KEY="private_abc..."
```

---

### 📡 Kafka Setup – Docker Infrastructure

Kafka is now handled via Docker infrastructure. The required Kafka topics are automatically created when you run:

```bash
npm run docker:start-kafka-stack
```

This will create the following topics:
- `user-events`
- `logs`
- `chat.new_message`

**No additional Kafka configuration is needed** - the Docker setup handles everything locally.

---

### ✅ Complete .env Example

Your final `.env` should look like this:

```env
DATABASE_URL="mongodb+srv://..."
REDIS_DATABASE_URI="rediss://..."
SMTP_USER="you@gmail.com"
SMTP_PASS="your_app_password"
SMTP_PORT=465
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com

ACCESS_TOKEN_SECRET="your_random_key"
REFRESH_TOKEN_SECRET="your_random_key"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_..."

IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_SECRET_KEY="private_..."
```

---

## 🏗️ Architecture Overview

### Microservices Architecture

- **API Gateway** (Port 8080) - Single entry point for all client requests
- **Backend Services** (Ports 6001-6008) - Independent microservices
- **Frontend Applications** (Ports 3000-3002) - React/Next.js applications
- **Kafka Consumer Service** - Event-driven messaging (no port, background service)
- **Cloud Infrastructure** - MongoDB Atlas, Upstash Redis, Docker Kafka

### NX Monorepo Structure

- **Unified Development** - Single `npm run dev` command starts all services
- **Shared Packages** - Common utilities, components, and middleware
- **Independent Deployment** - Each service can be built and deployed separately
- **Hot Reload** - Fast development with automatic reloading

### Docker Setup

- **Multi-stage builds** for optimized image sizes
- **Individual Dockerfiles** for each service enabling independent deployment
- **Resource limits** configured to prevent memory issues
- **Production-ready** with `docker-compose.production.yml`
- **Local Kafka Infrastructure** - Dockerized Kafka, Zookeeper, and topic management

---

## 📜 Available Scripts

### Development Scripts

```bash
npm run dev          # Start all services in development mode with hot reload
npm run build        # Build all services for production
npm run start:prod   # Start all services in production mode
```

### Docker Scripts

```bash
npm run docker:prod  # Build and run all services with Docker
npm run docker:build # Build all Docker images
npm run docker:run   # Run all services in containers
npm run docker:stop  # Stop all running containers
npm run docker:clean # Clean up containers and images
npm run docker:logs  # View logs from all services
```

### Kafka Infrastructure Scripts

```bash
npm run docker:start-kafka-stack # Start Kafka, Zookeeper, and create topics
npm run docker:stop-kafka-stack  # Stop Kafka infrastructure
npm run kafka:topics             # List all Kafka topics
npm run kafka:create-topics      # Create required Kafka topics
```

### Individual UI Scripts

```bash
npm run user-ui:prod   # Start user frontend in production mode
npm run seller-ui:prod # Start seller dashboard in production mode
npm run admin-ui:prod  # Start admin panel in production mode
```

---

## 🚀 Production Deployment

For production deployment:

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

**Recommended Platforms:**

- Railway
- Render
- AWS ECS Fargate
- Google Cloud Run
- DigitalOcean App Platform

---

## 🧠 AI-Powered Features

This app supports:

- ✅ AI Product Recommendations (via TensorFlow)
- ✅ Real-time Log Streaming (Kafka + WebSocket)
- ✅ Seller + User Analytics Dashboard
- ✅ Event-driven Architecture
- ✅ Microservices Communication
- ✅ Real-time Chat System
- ✅ User Behavior Analytics
- ✅ Background Event Processing

---

## 🛠️ Troubleshooting

### Common Issues

**Port conflicts:**

```bash
# Check what's running on ports
lsof -i :3000
lsof -i :8080
```

**Development mode issues:**

```bash
# Clear NX cache
npx nx reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Docker build issues:**

```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
npm run docker:clean
npm run docker:build
```

**Environment variables not loading:**

- Ensure `.env` file is in the root directory
- Check for typos in variable names
- Restart services after `.env` changes

**Kafka connection issues:**

```bash
# Restart Kafka infrastructure
npm run docker:stop-kafka-stack
npm run docker:start-kafka-stack

# Check Kafka topics
npm run kafka:topics
```

**Service startup issues:**

```bash
# Check individual service logs
npm run docker:logs

# Restart specific service (development mode)
npx nx serve <service-name>
```

---

## 📞 Support

If you need help with this project, please contact us through the official channel or our [Becodemy App](https://play.google.com/store/apps/details?id=com.becodemyofficial.app&pli=1).

> 🔒 Licensed to individual buyer only. All rights reserved © Becodemy Private Ltd.