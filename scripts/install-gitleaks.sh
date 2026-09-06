#!/usr/bin/env bash
set -euo pipefail

GITLEAKS_VERSION="8.24.3"
GITLEAKS_SHA256="9991e0b2903da4c8f6122b5c3186448b927a5da4deef1fe45271c3793f4ee29c"
GITLEAKS_ARCHIVE="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
GITLEAKS_URL="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${GITLEAKS_ARCHIVE}"
INSTALL_DIR="${1:-/usr/local/bin}"

curl -sSfL "${GITLEAKS_URL}" -o "${GITLEAKS_ARCHIVE}"
echo "${GITLEAKS_SHA256}  ${GITLEAKS_ARCHIVE}" | sha256sum -c -
tar xzf "${GITLEAKS_ARCHIVE}" gitleaks
install -m 755 gitleaks "${INSTALL_DIR}/gitleaks"
gitleaks version
