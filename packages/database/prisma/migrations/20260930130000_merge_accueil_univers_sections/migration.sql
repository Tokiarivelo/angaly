-- Data migration: the four `accueil` "univers-*" sections (one row each, one image each) become ONE `univers`
-- section holding an ordered, editable list in dataJson.items ({ label, imageUrl, imageAlt, href }).
-- Only the French rows exist today; images are carried over as the resolved media URL.
WITH src AS (
  SELECT
    ps."titleText" AS label,
    m."url"        AS url,
    m."altText"    AS alt,
    CASE ps."sectionKey"
      WHEN 'univers-mariage'  THEN 1
      WHEN 'univers-costumes' THEN 2
      WHEN 'univers-soiree'   THEN 3
      ELSE 4
    END AS ord,
    CASE ps."sectionKey" WHEN 'univers-sur-mesure' THEN '/sur-mesure' ELSE '/creations' END AS href
  FROM "page_sections" ps
  LEFT JOIN "media" m ON m."id" = ps."mediaId"
  WHERE ps."page" = 'accueil'
    AND ps."locale" = 'FR'
    AND ps."sectionKey" IN ('univers-mariage', 'univers-costumes', 'univers-soiree', 'univers-sur-mesure')
)
INSERT INTO "page_sections" ("id", "page", "sectionKey", "locale", "titleText", "dataJson", "status", "createdAt", "updatedAt")
SELECT
  'univers_' || md5(random()::text || clock_timestamp()::text),
  'accueil',
  'univers',
  'FR',
  'Univers',
  jsonb_build_object(
    'items',
    jsonb_agg(
      jsonb_build_object('label', label, 'imageUrl', url, 'imageAlt', alt, 'href', href)
      ORDER BY ord
    )
  ),
  'PUBLISHED',
  now(),
  now()
FROM src
HAVING count(*) > 0
ON CONFLICT ("page", "sectionKey", "locale") DO NOTHING;

DELETE FROM "page_sections"
WHERE "page" = 'accueil'
  AND "sectionKey" IN ('univers-mariage', 'univers-costumes', 'univers-soiree', 'univers-sur-mesure');
