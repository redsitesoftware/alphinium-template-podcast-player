FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx expo export --platform web --output-dir dist

# Replace Expo's generated index.html with our SEO-optimized version,
# preserving the generated JS bundle script tag(s).
RUN BUNDLE_SCRIPTS=$(grep -oE '<script[^>]+/_expo/static[^>]+></script>' dist/index.html | tr '\n' ' ') && \
    cp web/index.html dist/index.html && \
    sed -i "s|</body>|  ${BUNDLE_SCRIPTS}\n  </body>|" dist/index.html && \
    cp web/robots.txt dist/robots.txt && \
    cp web/sitemap.xml dist/sitemap.xml

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/assets/favicon.png /usr/share/nginx/html/favicon.ico
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
