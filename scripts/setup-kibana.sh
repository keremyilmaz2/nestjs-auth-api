#!/bin/bash

# Kibana Setup Script
# Creates index patterns for viewing logs

ELASTICSEARCH_HOST="${ELASTICSEARCH_NODE:-http://localhost:9200}"
KIBANA_HOST="${KIBANA_HOST:-http://localhost:5601}"
ELASTIC_USER="${ELASTICSEARCH_USERNAME:-elastic}"
ELASTIC_PASS="${ELASTICSEARCH_PASSWORD:-elastic11}"

echo "🔍 Waiting for Elasticsearch..."
until curl -s -u "$ELASTIC_USER:$ELASTIC_PASS" "$ELASTICSEARCH_HOST/_cluster/health" | grep -q '"status":"green"\|"status":"yellow"'; do
  sleep 5
done
echo "✅ Elasticsearch is ready!"

echo "🔍 Waiting for Kibana..."
until curl -s "$KIBANA_HOST/api/status" | grep -q '"status":{"overall":{"level":"available"'; do
  sleep 5
done
echo "✅ Kibana is ready!"

# Create index pattern for logs
echo "📊 Creating index pattern..."
curl -X POST "$KIBANA_HOST/api/saved_objects/index-pattern/nestjs-logs-*" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -u "$ELASTIC_USER:$ELASTIC_PASS" \
  -d '{
    "attributes": {
      "title": "nestjs-logs-*",
      "timeFieldName": "@timestamp"
    }
  }'

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Access Kibana at: $KIBANA_HOST"
echo "   Username: $ELASTIC_USER"
echo "   Password: $ELASTIC_PASS"
echo ""
echo "🔍 Go to: Kibana > Analytics > Discover"
echo "   Select 'nestjs-logs-*' index pattern"
