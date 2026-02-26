# Deployment Guide

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] TypeScript compilation: `npm run build`

### Environment
- [ ] `.env` configured for production
- [ ] `NODE_ENV=production`
- [ ] JWT_SECRET set to strong random value (min 32 chars)
- [ ] Sensitive credentials NOT in version control

### Database
- [ ] PostgreSQL 13+ installed
- [ ] Database user created with limited permissions
- [ ] Database backed up before migration
- [ ] `npm run migrate` executed successfully
- [ ] Connection pooling configured

### Redis
- [ ] Redis 6+ installed and running
- [ ] Persistence enabled (`appendonly yes` in redis.conf)
- [ ] Password authentication configured
- [ ] Memory limits set appropriately

### S3/Storage
- [ ] S3 bucket created with appropriate permissions
- [ ] IAM user with minimal required permissions
- [ ] CORS configured for frontend domain
- [ ] Bucket versioning enabled (optional)
- [ ] Lifecycle policies set (cleanup old uploads)

### Security
- [ ] SSL/TLS certificate obtained
- [ ] CORS whitelist configured for frontend only
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Security headers configured (via Helmet)
- [ ] Rate limiting configured
- [ ] Input validation implemented

### Monitoring
- [ ] Logging configured (file or service)
- [ ] Error tracking setup (Sentry, DataDog, etc.)
- [ ] Database monitoring enabled
- [ ] Redis monitoring enabled
- [ ] Health check endpoint accessible

### Backups
- [ ] PostgreSQL automated backups configured
- [ ] Backup retention policy set (min 30 days)
- [ ] Backup restore testing done
- [ ] Off-site backup storage configured

## Deployment Methods

### 1. Traditional Server Deployment

#### Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+ and npm
- PostgreSQL 13+
- Redis 6+
- Nginx (as reverse proxy)

#### Steps

1. **SSH into server**
```bash
ssh user@your-server.com
```

2. **Install dependencies (one-time)**
```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Redis
sudo apt install redis-server -y

# Install Nginx
sudo apt install nginx -y
```

3. **Clone and setup application**
```bash
git clone <repository-url> /opt/colorhunt
cd /opt/colorhunt
npm install
npm run build
```

4. **Configure environment**
```bash
sudo nano .env
# Add production environment variables
```

5. **Initialize database**
```bash
npm run migrate
```

6. **Configure Nginx**
```nginx
# /etc/nginx/sites-available/colorhunt
upstream colorhunt_api {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name api.colorhunt.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.colorhunt.com;

  ssl_certificate /path/to/certificate.crt;
  ssl_certificate_key /path/to/private.key;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;

  location / {
    proxy_pass http://colorhunt_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/colorhunt /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

7. **Setup PM2 (process manager)**
```bash
sudo npm install -g pm2

# Start application
pm2 start dist/index.js --name "colorhunt-api"

# Auto-start on reboot
pm2 startup
pm2 save
```

8. **Setup automated backups**
```bash
# Create backup script
cat > /opt/colorhunt/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/colorhunt"
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
pg_dump -U colorhunt_user colorhunt > $BACKUP_DIR/db_$DATE.sql

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /opt/colorhunt/backup.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/colorhunt/backup.sh" | crontab -
```

### 2. Docker Deployment

#### Prerequisites
- Docker and Docker Compose installed
- Docker registry (Docker Hub, AWS ECR, etc.)

#### Steps

1. **Build Docker image**
```bash
docker build -t colorhunt-api:1.0.0 .
docker tag colorhunt-api:1.0.0 your-registry/colorhunt-api:1.0.0
docker push your-registry/colorhunt-api:1.0.0
```

2. **Deploy with Docker Compose**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: your-registry/colorhunt-api:1.0.0
    container_name: colorhunt-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - colorhunt

  postgres:
    image: postgres:15-alpine
    container_name: colorhunt-postgres
    environment:
      POSTGRES_USER: colorhunt_user
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: colorhunt
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - colorhunt
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U colorhunt_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: colorhunt-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - colorhunt
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: colorhunt-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - colorhunt

volumes:
  postgres_data:
  redis_data:

networks:
  colorhunt:
    driver: bridge
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Kubernetes Deployment

For large-scale deployments, create Kubernetes manifests:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: colorhunt-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: colorhunt-api
  template:
    metadata:
      labels:
        app: colorhunt-api
    spec:
      containers:
      - name: api
        image: your-registry/colorhunt-api:1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          value: "postgres-service"
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## Monitoring & Logging

### Logging Setup

```typescript
// Add to src/utils/logger.ts
import fs from 'fs';
import path from 'path';

const logFile = path.join('/var/log/colorhunt', 'app.log');

export function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logEntry, data || '');
  
  // Write to file in production
  if (process.env.NODE_ENV === 'production') {
    fs.appendFileSync(logFile, logEntry + '\n');
  }
}
```

### Health Check

```bash
# Monitor health endpoint
curl -f http://api.colorhunt.com/health || alert "API down"
```

## Performance Optimization

### Database
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM finds ORDER BY score DESC LIMIT 20;

-- Optimize large queries with proper indexes
CREATE INDEX idx_finds_score ON finds(score DESC);
```

### Caching
- Cache leaderboard rankings (refresh every 1 hour)
- Cache color history (cache until next day)
- Cache user stats (short TTL, 5 minutes)

### Application
- Use connection pooling (already configured in connection.ts)
- Implement request compression (gzip)
- Use CDN for static assets/images

## Rollback Procedure

```bash
# If deployment fails:
1. Check logs: tail -f /var/log/colorhunt/app.log
2. Verify database integrity: npm run migrate
3. Restart services: pm2 restart colorhunt-api
4. If critical: revert to previous version from git
5. Notify users of any data loss
```

## Scaling Considerations

For high traffic:
- Use read replicas for PostgreSQL (read-heavy operations)
- Configure Redis clustering for horizontal scaling
- Implement request rate limiting
- Use CDN for image delivery
- Consider microservices for analysis operations

## SSL/TLS Certificate

Using Let's Encrypt (free option):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d api.colorhunt.com
sudo systemctl restart nginx
```

Auto-renewal (runs daily):
```bash
0 3 * * * certbot renew --quiet
```

## Post-Deployment

After deployment:
1. Run smoke tests against production
2. Monitor error rates and latency
3. Verify database backups running
4. Test failover procedures
5. Document any custom configurations
6. Setup alerts/notifications for critical events
7. Schedule regular security audits
8. Plan capacity upgrades as needed

## Support & Troubleshooting

### Common Issues

**"502 Bad Gateway"**
- API process crashed: `pm2 status`
- Connection pool exhausted: check `max_connections`
- Redis unavailable: `redis-cli ping`

**"Connection refused"**
- Database not running: `sudo systemctl status postgresql`
- Redis not running: `sudo systemctl status redis-server`
- Wrong hostname/port in `.env`

**"Out of disk space"**
- Check with: `df -h`
- Clear old logs: `rm /var/log/colorhunt/app.log.*`
- Review S3 bucket size

**"High memory usage"**
- Check Node process: `top`
- Memory leak in code: use Chrome DevTools inspector
- Redis persistence too large: review `append-only.aof` size
