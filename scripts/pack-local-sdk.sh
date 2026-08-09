#!/usr/bin/env bash
# Re-pack the SDK from a local animated-waffle checkout into .sdk-local/.
#
# The example consumes the SDK exactly as npm publishes it, so testing an
# unreleased change means packing it rather than linking it: a workspace link
# would expose the packages' TypeScript sources, which resolve and typecheck
# differently from the built entry points a real consumer gets.
#
# Usage:  scripts/pack-local-sdk.sh [path-to-animated-waffle]   (default: ../animated-waffle)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SDK_DIR="$(cd "${1:-$ROOT_DIR/../animated-waffle}" && pwd)"
OUT_DIR="$ROOT_DIR/.sdk-local"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
for package in packages/avatar packages/waffle-client packages/waffle-react; do
  (cd "$SDK_DIR/$package" && pnpm pack --pack-destination "$OUT_DIR" >/dev/null)
done

echo "Packed into $OUT_DIR:"
ls -1 "$OUT_DIR"
cat <<'NEXT'

Add this to package.json, then run `pnpm install`. Remove it again once the
SDK version this example depends on is published — the tarballs are ignored by
git, so a committed override would leave every other checkout unable to install.

  "pnpm": {
    "overrides": {
      "@animated-waffle/avatar": "file:./.sdk-local/animated-waffle-avatar-<version>.tgz",
      "@animated-waffle/client": "file:./.sdk-local/animated-waffle-client-<version>.tgz",
      "@animated-waffle/react": "file:./.sdk-local/animated-waffle-react-<version>.tgz"
    }
  }
NEXT
