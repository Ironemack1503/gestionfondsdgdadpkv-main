#!/bin/sh
set -e
apk add --quiet openssl 2>/dev/null || true

SERVER_IP=${1:-192.168.0.32}
DAYS=${2:-3650}

echo "==> Génération CA..."
openssl genrsa -out /certs/ca.key 4096 2>/dev/null
openssl req -x509 -new -nodes \
    -key /certs/ca.key -sha256 -days "$DAYS" -out /certs/ca.crt \
    -subj "/C=CD/ST=Kinshasa/L=Kinshasa/O=DGDA/OU=IT/CN=GestCaisse-LocalCA" 2>/dev/null
echo "    CA créée."

echo "==> Génération clé serveur..."
openssl genrsa -out /certs/server.key 2048 2>/dev/null

cat > /tmp/san.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext
[dn]
C = CD
ST = Kinshasa
O = DGDA
CN = $SERVER_IP
[req_ext]
subjectAltName = @alt_names
[alt_names]
IP.1 = $SERVER_IP
IP.2 = 127.0.0.1
DNS.1 = gestcaisse.local
DNS.2 = localhost
EOF

cat > /tmp/ext.cnf << EOF
subjectAltName = IP:$SERVER_IP, IP:127.0.0.1, DNS:gestcaisse.local, DNS:localhost
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
EOF

echo "==> Signature du certificat serveur..."
openssl req -new -key /certs/server.key -out /tmp/server.csr -config /tmp/san.cnf 2>/dev/null
openssl x509 -req \
    -in /tmp/server.csr \
    -CA /certs/ca.crt -CAkey /certs/ca.key -CAcreateserial \
    -out /certs/server.crt -days "$DAYS" -sha256 \
    -extfile /tmp/ext.cnf 2>/dev/null

chmod 644 /certs/server.crt /certs/ca.crt
chmod 600 /certs/server.key /certs/ca.key

echo ""
echo "=== Certificats generés avec succès ==="
openssl x509 -in /certs/server.crt -noout -subject -dates -fingerprint
echo ""
