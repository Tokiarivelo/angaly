#!/usr/bin/env bash
# Dumps one pattern version (pieces, measurements, fabric behaviour, the fabric look read off the photo) from the dev
# Postgres container,
# in the shape tools/export-job.ts reads.
#   apps/cloth-sim/scripts/dump-version.sh <versionId> <out.json>
set -euo pipefail

VERSION_ID="${1:?usage: dump-version.sh <versionId> <out.json>}"
OUT="${2:?usage: dump-version.sh <versionId> <out.json>}"
CONTAINER="${POSTGRES_CONTAINER:-angaly_postgres}"
DB_USER="${POSTGRES_USER:-angaly_user}"
DB_NAME="${POSTGRES_DB:-angaly_dev}"

if [[ ! "$VERSION_ID" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  echo "dump-version.sh: '$VERSION_ID' is not a version uuid" >&2
  exit 1
fi

docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -At -v ON_ERROR_STOP=1 -c "
select json_build_object(
  'versionId', v.id,
  'garmentType', p.\"garmentType\",
  'measurements', v.\"parametersJson\"->'measurements',
  'fabricBehavior', v.\"parametersJson\"->'inspiration'->>'fabricBehavior',
  'fit', p.\"inspirationAnalysisJson\"->'profile'->'fit',
  'pieces', (select json_agg(row_to_json(pp)) from pattern_pieces pp where pp.\"versionId\" = v.id))
from pattern_versions v join pattern_projects p on p.id = v.\"projectId\"
where v.id = '$VERSION_ID'" > "$OUT"

if [[ ! -s "$OUT" ]]; then
  echo "dump-version.sh: version $VERSION_ID not found" >&2
  rm -f "$OUT"
  exit 1
fi
