# Pench Milk Production Deployment Plan

This plan uses your domain only for the app-facing services and opens DevOps tools by public IP for testing.

- Domain: `somesh-portfolio.online`
- EC2 public IP: `44.204.146.166`
- API domain: `https://api.somesh-portfolio.online`
- APK download domain: `https://downloads.somesh-portfolio.online`
- Jenkins: `http://44.204.146.166:8080`
- SonarQube: `http://44.204.146.166:9000`
- Prometheus: `http://44.204.146.166:9090`
- Grafana: `http://44.204.146.166:3000`

## 1. What Was Customized For Production

Code/config changes added to this repo:

- Django `STATIC_ROOT` for `collectstatic`.
- `/health/` endpoint for uptime/load balancer checks.
- Optional `/metrics` endpoint using `django-prometheus`.
- Production HTTPS/security settings controlled by env vars.
- Redis cache location fixed for production.
- Android cleartext traffic disabled when `EXPO_PUBLIC_ENV=production` or `NODE_ENV=production`.
- `docker-compose.prod.yml` for backend, Postgres, Redis, Jenkins, SonarQube, Prometheus, and Grafana.
- `ops/prometheus/prometheus.yml` to scrape Prometheus and Django.

## 2. DNS Setup

Create only these DNS records:

```text
api          A    44.204.146.166
downloads    A    44.204.146.166
```

Do not create DNS records for Jenkins, SonarQube, Grafana, or Prometheus if you want them opened only with public IP.

Check DNS:

```bash
nslookup api.somesh-portfolio.online
nslookup downloads.somesh-portfolio.online
```

## 3. EC2 Security Group

For initial testing, allow:

```text
22/tcp      Your IP only       SSH
80/tcp      0.0.0.0/0          HTTP
443/tcp     0.0.0.0/0          HTTPS
8080/tcp    Your IP only       Jenkins
9000/tcp    Your IP only       SonarQube
9090/tcp    Your IP only       Prometheus
3000/tcp    Your IP only       Grafana
```

Keep these closed:

```text
5432/tcp    PostgreSQL
6379/tcp    Redis
8000/tcp    Django direct port
```

## 4. Server Setup From Scratch

SSH:

```bash
ssh ubuntu@44.204.146.166
```

Install packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx unzip openjdk-17-jdk nodejs npm
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

Create folders:

```bash
sudo mkdir -p /opt/penchmilk/downloads/apk
sudo mkdir -p /opt/penchmilk/secrets
sudo chown -R ubuntu:ubuntu /opt/penchmilk
```

Clone:

```bash
cd /opt/penchmilk
git clone <YOUR_GIT_REPO_URL> app
cd /opt/penchmilk/app
```

## 5. Production Env

Create `backend/.env.production`:

```bash
cp backend/production.env.example backend/.env.production
nano backend/.env.production
```

Use this:

```text
DJANGO_SECRET_KEY=CHANGE_TO_LONG_RANDOM_SECRET
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=api.somesh-portfolio.online,44.204.146.166,backend
CSRF_TRUSTED_ORIGINS=https://api.somesh-portfolio.online
CORS_ALLOWED_ORIGINS=https://downloads.somesh-portfolio.online

# Keep this 0 because Nginx/Certbot handles public HTTP -> HTTPS and Prometheus scrapes Django over the private Docker network.
DJANGO_SECURE_SSL_REDIRECT=0
DJANGO_SESSION_COOKIE_SECURE=1
DJANGO_CSRF_COOKIE_SECURE=1
DJANGO_SECURE_HSTS_SECONDS=31536000
DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS=1
DJANGO_SECURE_HSTS_PRELOAD=1

POSTGRES_DB=pench_milk
POSTGRES_USER=pench_user
POSTGRES_PASSWORD=CHANGE_DB_PASSWORD
DB_NAME=pench_milk
DB_USER=pench_user
DB_PASSWORD=CHANGE_DB_PASSWORD
DB_HOST=postgres
DB_PORT=5432

GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=CHANGE_GRAFANA_PASSWORD

REDIS_URL=redis://redis:6379/0
DJANGO_CACHE_BACKEND=django.core.cache.backends.redis.RedisCache
DJANGO_CACHE_LOCATION=redis://redis:6379/0

MAP_PROVIDER=osm
OTP_DEV_MODE=0
OTP_TTL_SECONDS=300
FIREBASE_SERVICE_ACCOUNT_FILE=/run/secrets/firebase-service-account.json
```

Generate a secret:

```bash
python3 - <<'PY'
from secrets import token_urlsafe
print(token_urlsafe(64))
PY
```

Add Firebase Admin service account:

```bash
nano /opt/penchmilk/secrets/firebase-service-account.json
chmod 600 /opt/penchmilk/secrets/firebase-service-account.json
```

## 6. Start Docker Stack

The production stack is already in:

```text
docker-compose.prod.yml
```

Start it:

```bash
cd /opt/penchmilk/app
set -a
. backend/.env.production
set +a
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

Create admin:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Check backend locally:

```bash
curl http://127.0.0.1:8000/health/
curl http://127.0.0.1:8000/metrics
```

## 7. Nginx Only For App/API Domains

Create `/etc/nginx/sites-available/penchmilk`:

```nginx
server {
    listen 80;
    server_name api.somesh-portfolio.online;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name downloads.somesh-portfolio.online;
    root /opt/penchmilk/downloads;
    index index.html;

    location /apk/ {
        autoindex on;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/penchmilk /etc/nginx/sites-enabled/penchmilk
sudo nginx -t
sudo systemctl reload nginx
```

Add HTTPS only for app/API domains:

```bash
sudo certbot --nginx -d api.somesh-portfolio.online -d downloads.somesh-portfolio.online
```

## 8. Download Page

Create `/opt/penchmilk/downloads/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pench Milk App Downloads</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
      a { display: block; margin: 16px 0; font-size: 20px; }
    </style>
  </head>
  <body>
    <h1>Pench Milk App Downloads</h1>
    <a href="/apk/pench-foods-customer.apk">Download Customer App</a>
    <a href="/apk/pench-delivery.apk">Download Delivery App</a>
  </body>
</html>
```

Final app links:

```text
https://downloads.somesh-portfolio.online/apk/pench-foods-customer.apk
https://downloads.somesh-portfolio.online/apk/pench-delivery.apk
```

## 9. Build Customer And Delivery APKs

Install build tools:

```bash
npm ci
npm install -g eas-cli
eas login
```

Customer APK:

```bash
EXPO_PUBLIC_ENV=production \
EXPO_PUBLIC_APP_VARIANT=customer \
EXPO_PUBLIC_API_BASE_URL=https://api.somesh-portfolio.online/api/v1 \
EXPO_PUBLIC_MAP_PROVIDER=osm \
eas build --platform android --profile preview --local --output /opt/penchmilk/downloads/apk/pench-foods-customer.apk
```

Delivery APK:

```bash
EXPO_PUBLIC_ENV=production \
EXPO_PUBLIC_APP_VARIANT=delivery \
EXPO_PUBLIC_API_BASE_URL=https://api.somesh-portfolio.online/api/v1 \
EXPO_PUBLIC_MAP_PROVIDER=osm \
eas build --platform android --profile preview --local --output /opt/penchmilk/downloads/apk/pench-delivery.apk
```

## 10. Tool URLs By Public IP

Open these in your browser:

```text
Jenkins:     http://44.204.146.166:8080
SonarQube:   http://44.204.146.166:9000
Prometheus:  http://44.204.146.166:9090
Grafana:     http://44.204.146.166:3000
```

Jenkins initial password:

```bash
docker compose -f docker-compose.prod.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Grafana login:

```text
admin / value of GRAFANA_ADMIN_PASSWORD
```

Grafana Prometheus data source:

```text
http://prometheus:9090
```

## 11. Jenkins Freestyle CI/CD

Create freestyle job: `penchmilk-prod-deploy`

SCM:

```text
Git repo: <YOUR_GIT_REPO_URL>
Branch: main
```

Build step:

```bash
cd /opt/penchmilk/app
git pull origin main
npm ci
npm run typecheck

sonar-scanner \
  -Dsonar.projectKey=penchmilk \
  -Dsonar.sources=src,backend,delivery-app \
  -Dsonar.exclusions=node_modules/**,dist/**,backend/venv/**,android/**,ios/** \
  -Dsonar.host.url=http://44.204.146.166:9000 \
  -Dsonar.token=$SONAR_TOKEN

set -a
. backend/.env.production
set +a
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

EXPO_PUBLIC_ENV=production EXPO_PUBLIC_APP_VARIANT=customer EXPO_PUBLIC_API_BASE_URL=https://api.somesh-portfolio.online/api/v1 eas build --platform android --profile preview --local --non-interactive --output /opt/penchmilk/downloads/apk/pench-foods-customer.apk
EXPO_PUBLIC_ENV=production EXPO_PUBLIC_APP_VARIANT=delivery EXPO_PUBLIC_API_BASE_URL=https://api.somesh-portfolio.online/api/v1 eas build --platform android --profile preview --local --non-interactive --output /opt/penchmilk/downloads/apk/pench-delivery.apk
```

## 12. Production Verification

API:

```bash
curl https://api.somesh-portfolio.online/health/
curl https://api.somesh-portfolio.online/api/v1/products/
```

Downloads:

```bash
curl -I https://downloads.somesh-portfolio.online/apk/pench-foods-customer.apk
curl -I https://downloads.somesh-portfolio.online/apk/pench-delivery.apk
```

Tools:

```bash
curl -I http://44.204.146.166:8080
curl -I http://44.204.146.166:9000
curl -I http://44.204.146.166:9090
curl -I http://44.204.146.166:3000
```

## 13. App File Structure

```text
PenchMilkApp/
  app.config.js                 Production env disables Android cleartext traffic
  app.json                      Base Expo config
  eas.json                      APK/AAB build profiles
  docker-compose.prod.yml       Production Docker stack
  ops/prometheus/prometheus.yml Prometheus scrape config
  src/
    services/api.ts             Uses EXPO_PUBLIC_API_BASE_URL
    screens/                    Customer app screens
  delivery-app/
    DeliveryApp.js              Delivery variant entry flow
    screens/                    Delivery app screens
  backend/
    Dockerfile                  Django production image
    requirements.txt            Includes django-prometheus
    config/settings.py          Production security, static, metrics settings
    config/urls.py              /health/, /metrics, admin, API routes
    apps/common/views.py        Health check endpoint
```
