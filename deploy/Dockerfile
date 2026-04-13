# ================================================================
# GestCaisse – Image de Production
# Build multi-stage : Node 20 (Vite build) → Nginx Alpine (serve)
# ================================================================

# ---------------------------------------------------------------
# Stage 1 : Build Vite
# ---------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les manifestes en premier (cache Docker des dépendances)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copier tout le code source
COPY . .

# Variables injektées au moment du build (remplacent les .env)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Build de production (génère /app/dist)
RUN npm run build

# ---------------------------------------------------------------
# Stage 2 : Nginx – serveur léger (~25 MB)
# ---------------------------------------------------------------
FROM nginx:alpine

# Supprimer la configuration par défaut
RUN rm -f /etc/nginx/conf.d/default.conf

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf

# Créer le répertoire des certificats (monté en volume au runtime)
RUN mkdir -p /etc/nginx/certs

# Ports exposés
EXPOSE 80 443

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
