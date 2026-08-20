#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
REPOSITORY_ROOT="$(cd -- "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
APPS_WORKSPACE="${REPOSITORY_ROOT}/biabyss-apps"
NVM_SCRIPT="${NVM_DIR:-${HOME}/.nvm}/nvm.sh"

if [[ ! -f "${APPS_WORKSPACE}/package.json" || ! -f "${APPS_WORKSPACE}/.nvmrc" ]]; then
  printf 'BIABYSS workspace not found: %s\n' "${APPS_WORKSPACE}" >&2
  exit 1
fi

NVM_VERSION="$(<"${APPS_WORKSPACE}/.nvmrc")"

if command -v nvm >/dev/null 2>&1; then
  nvm use "${NVM_VERSION}" >/dev/null
elif [[ -s "${NVM_SCRIPT}" ]]; then
  # shellcheck source=/dev/null
  source "${NVM_SCRIPT}"
  nvm use "${NVM_VERSION}" >/dev/null
fi

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js 22.13 or newer is required.\n' >&2
  exit 1
fi

node -e '
  const [major, minor] = process.versions.node.split(".").map(Number)
  if (major < 22 || (major === 22 && minor < 13)) {
    console.error(`Node.js 22.13 or newer is required; found ${process.versions.node}.`)
    process.exit(1)
  }
'

if ! command -v npm >/dev/null 2>&1; then
  printf 'npm is required.\n' >&2
  exit 1
fi

cd "${APPS_WORKSPACE}"

if [[ ! -d node_modules ]]; then
  npm ci
fi

exec npm run dev:mobile -- "$@"
