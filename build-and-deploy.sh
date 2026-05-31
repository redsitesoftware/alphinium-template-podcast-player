#!/bin/bash
# WaveForm — Build and Deploy Script
#
# Deploys to the PERSISTENT USER-POD at waveform.app.alphinium.com
#
# Architecture:
#   Context:    gke_alphinium-production_us-central1-a_user-pods-cluster
#   Namespace:  alphinium-7r86kuat
#   Deployment: pod-podcast-player
#   Service:    svc-podcast-player-7r86kuat
#   Registry:   us-central1-docker.pkg.dev/alphinium-production/user-pods/
#   Image:      podcast-player:<TAG>
#   Domain:     waveform.app.alphinium.com
#
# For the DEMO-POD at waveform.demo.alphinium.io (Alphinium platform managed):
#   alphinium user-pods start demo-podcast   # rebuilds from main branch
#   alphinium user-pods list                 # check status
#   Cluster:    australia-southeast1 (alphinium-cluster)
#   Namespace:  alphinium-2hm4rxx6
#   Deployment: pod-demo-podcast-<id>
#   Image:      fcaf6cc9-.../demo-podcast:branch-main (auto-built by platform)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CONTEXT="gke_alphinium-production_us-central1-a_user-pods-cluster"
NAMESPACE="alphinium-7r86kuat"
DEPLOYMENT="pod-podcast-player"
SVC="svc-podcast-player-7r86kuat"
REGISTRY="us-central1-docker.pkg.dev/alphinium-production/user-pods"
IMAGE_NAME="podcast-player"
TAG="${1:-$(date +%Y%m%d-%H%M%S)}"
IMAGE="${REGISTRY}/${IMAGE_NAME}:${TAG}"
DOMAIN="waveform.app.alphinium.com"

echo "🎙️ Building and deploying WaveForm (podcast-player user-pod)"
echo ""
echo "  Registry:   $REGISTRY"
echo "  Tag:        $TAG"
echo "  Image:      $IMAGE"
echo "  Namespace:  $NAMESPACE"
echo "  Deployment: $DEPLOYMENT"
echo "  Domain:     $DOMAIN"
echo ""
read -p "Continue? (y/n): " confirm
[[ $confirm == "y" ]] || { echo "Cancelled."; exit 1; }

echo ""
echo "📦 Authenticating Docker..."
gcloud auth configure-docker us-central1-docker.pkg.dev --quiet

echo ""
echo "📦 Building Docker image (linux/amd64)..."
docker buildx build --platform linux/amd64 -t "$IMAGE" --push .

echo ""
echo "🔧 Applying Kubernetes resources..."
# Create or update Deployment
kubectl apply --context "$CONTEXT" -n "$NAMESPACE" -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $DEPLOYMENT
  namespace: $NAMESPACE
  labels:
    app: podcast-player
    managed-by: user-pods-persistent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: podcast-player
  template:
    metadata:
      labels:
        app: podcast-player
    spec:
      containers:
        - name: app
          image: $IMAGE
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
EOF

# Create or update Service
kubectl apply --context "$CONTEXT" -n "$NAMESPACE" -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: $SVC
  namespace: $NAMESPACE
  labels:
    managed-by: user-pods-persistent
spec:
  selector:
    app: podcast-player
  ports:
    - port: 80
      targetPort: 80
EOF

# Create or update Ingress (apps.alphinium.com subdomain)
kubectl apply --context "$CONTEXT" -n "$NAMESPACE" -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ing-podcast-player-waveform
  namespace: $NAMESPACE
  labels:
    managed-by: user-pods-persistent
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  ingressClassName: nginx
  rules:
    - host: $DOMAIN
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: $SVC
                port:
                  number: 80
EOF

echo ""
echo "⏳ Waiting for rollout..."
kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE" --context "$CONTEXT" --timeout=300s

echo ""
echo "✅ Deployment complete!"
echo "  Image:   $IMAGE"
echo "  Domain:  https://$DOMAIN"
echo "  "
echo ""
kubectl get pods -n "$NAMESPACE" --context "$CONTEXT" | grep podcast-player