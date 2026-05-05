#!/usr/bin/env bash
# Regenerate the four PNG icon sizes from public/icons/icon.svg.
#
# Requires: npx (uses @resvg/resvg-js-cli, fetched on demand).
#   resvg renders gradients and rounded rects faithfully — ImageMagick's
#   built-in SVG path is unreliable for our background gradient.
#
# Also copies the master SVG to website/public/favicon.svg so the marketing
# site and the extension stay visually identical.
#
# Usage:  bash scripts/generate-icons.sh
set -euo pipefail

EXT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$(cd "${EXT_DIR}/../website" && pwd)"
SRC="${EXT_DIR}/public/icons/icon.svg"

for size in 16 32 48 128; do
  out="${EXT_DIR}/public/icons/icon${size}.png"
  npx --yes @resvg/resvg-js-cli --fit-width "${size}" "${SRC}" "${out}" >/dev/null
  echo "  wrote $(basename "${out}")"
done

cp "${SRC}" "${WEB_DIR}/public/favicon.svg"
echo "  wrote ${WEB_DIR}/public/favicon.svg"
