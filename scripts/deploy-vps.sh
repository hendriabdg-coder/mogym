#!/usr/bin/env bash
set -euo pipefail

cd /opt/mogym

if [[ ! -f .env.production ]]; then
  postgres_password="$(openssl rand -hex 32)"
  jwt_secret="$(openssl rand -hex 48)"
  jwt_refresh_secret="$(openssl rand -hex 48)"
  read -r vapid_public vapid_private < <(
    sudo docker run --rm node:20-alpine node -e \
      'const {generateKeyPairSync}=require("crypto");const {publicKey,privateKey}=generateKeyPairSync("ec",{namedCurve:"prime256v1"});const pub=publicKey.export({format:"jwk"});const priv=privateKey.export({format:"jwk"});const b=Buffer.concat([Buffer.from([4]),Buffer.from(pub.x,"base64url"),Buffer.from(pub.y,"base64url")]).toString("base64url");process.stdout.write(`${b} ${priv.d}`)'
  )

  umask 077
  {
    echo "POSTGRES_DB=cuttrack"
    echo "POSTGRES_USER=cuttrack"
    echo "POSTGRES_PASSWORD=${postgres_password}"
    echo "JWT_SECRET=${jwt_secret}"
    echo "JWT_REFRESH_SECRET=${jwt_refresh_secret}"
    echo "JWT_EXPIRES_IN=15m"
    echo "JWT_REFRESH_EXPIRES_IN=30d"
    echo "FRONTEND_ORIGIN=https://mogym.endrichtech.com"
    echo "APP_URL=https://mogym.endrichtech.com"
    echo "VAPID_PUBLIC_KEY=${vapid_public}"
    echo "VAPID_PRIVATE_KEY=${vapid_private}"
    echo "VAPID_EMAIL=mailto:admin@endrichtech.com"
    echo "GOOGLE_CLIENT_ID="
    echo "GOOGLE_CLIENT_SECRET="
    echo "APPLE_CLIENT_ID="
    echo "APPLE_TEAM_ID="
    echo "APPLE_KEY_ID="
    echo "MAIL_HOST="
    echo "MAIL_PORT=587"
    echo "MAIL_USER="
    echo "MAIL_PASS="
    echo "MAIL_FROM=CutTrack <noreply@endrichtech.com>"
  } > .env.production
fi

sudo docker compose --env-file .env.production -f docker-compose.vps.yml up -d --build
sudo docker compose --env-file .env.production -f docker-compose.vps.yml exec -T backend npm run prisma:seed
sudo docker compose --env-file .env.production -f docker-compose.vps.yml ps
