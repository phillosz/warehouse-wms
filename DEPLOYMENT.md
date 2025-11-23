# Warehouse WMS - Deployment Guide

## Lokální vývoj

### Backend
```bash
cd backend
npm install
docker-compose up -d
npm run prisma:migrate
npx tsx prisma/seed.ts
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npm start
```

## Production Deployment

### Backend - Docker

#### Build image
```bash
cd backend
docker build -t warehouse-wms-backend:latest .
```

#### Run with docker-compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Environment variables
```env
DATABASE_URL=postgresql://user:pass@db:5432/warehouse_wms
PORT=3000
NODE_ENV=production
```

### Backend - PaaS (Heroku/Railway/Fly.io)

1. **Připojit PostgreSQL addon**
2. **Nastavit environment variables**
3. **Deploy:**

```bash
# Railway
railway up

# Heroku
git push heroku main
heroku run npm run prisma:migrate

# Fly.io
fly deploy
```

### Mobile - Expo EAS Build

#### Setup
```bash
npm install -g eas-cli
cd mobile
eas login
eas build:configure
```

#### Build pro Android
```bash
eas build --platform android --profile production
```

#### Build pro iOS
```bash
eas build --platform ios --profile production
```

#### Update OTA (Over-The-Air)
```bash
eas update --branch production --message "Bug fixes"
```

### Mobile - Standalone APK/IPA

```bash
# Android APK
expo build:android -t apk

# Android App Bundle (pro Google Play)
expo build:android -t app-bundle

# iOS
expo build:ios -t archive
```

## Monitoring a Logs

### Backend logs
```bash
docker logs -f warehouse-wms-backend
```

### Database backup
```bash
docker exec warehouse_wms_db pg_dump -U warehouse warehouse_wms > backup.sql
```

### Database restore
```bash
docker exec -i warehouse_wms_db psql -U warehouse warehouse_wms < backup.sql
```

## SSL/HTTPS

Pro production doporučeno:
- **Nginx** jako reverse proxy
- **Let's Encrypt** pro SSL certifikáty
- **Cloudflare** pro CDN a DDoS protection

Příklad nginx.conf:
```nginx
server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.example.com;
    
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance

### Database indexy
Již nastaveno v Prisma schema:
- `ean` (unique)
- `roll.status`
- `rail.code` (unique)
- `movement.rollId`, `movement.at`

### Caching (budoucí)
- Redis pro session a často dotazované data
- HTTP cache headers pro export endpointy

### Rate limiting (budoucí)
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100 // limit požadavků
});

app.use('/api/', limiter);
```

## Scaling

### Horizontální škálování
- Load balancer (nginx, HAProxy)
- Více backend instancí
- Shared PostgreSQL

### Vertikální škálování
- Zvýšit DB resources (CPU, RAM)
- Connection pooling (Prisma má built-in)

## Security Checklist

- [ ] HTTPS everywhere
- [ ] Environment variables (ne hardcoded)
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection protection (Prisma ORM ✓)
- [ ] CORS whitelist
- [ ] Helmet.js (security headers)
- [ ] Regular dependency updates
- [ ] Database backups (automated)
- [ ] Monitoring & alerting

## Troubleshooting

### Backend neběží
```bash
# Check logs
docker logs warehouse_wms_db
docker logs warehouse-wms-backend

# Check DB connection
docker exec -it warehouse_wms_db psql -U warehouse warehouse_wms
```

### Mobile se nepřipojí
- Zkontrolovat API_URL (musí být dostupná IP)
- Firewall pravidla
- Backend CORS nastavení
- Network connectivity

### Migrace selhala
```bash
# Reset database
npm run prisma:migrate reset

# Force push schema
npx prisma db push --force-reset
```
