#!/bin/sh
# Idempotently creates every ANGALY media bucket (spec §76) and makes each
# one publicly readable (download-only) since served images are not
# sensitive — write access still requires the access/secret key.
# Run by the one-shot `minio-init` service in docker-compose*.yml against the
# `minio/mc` image; keep this list in sync with packages/storage/src/buckets.ts.
set -e

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

for bucket in creations products collections ateliers customers patterns blog avatars; do
  mc mb --ignore-existing "local/$bucket"
  mc anonymous set download "local/$bucket"
done

echo "✅ ANGALY MinIO buckets ready"
