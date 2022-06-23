#!/bin/bash

APP="google-messages-electron"
INSTALL="$HOME/.local/$APP"
ICON="./icon.svg"

set -e

npm install
npm run dist

mkdir -p "${INSTALL}"

# Install
rsync -azv --delete \
  "./dist/$APP-linux-x64/" \
  "${INSTALL}/"

# Icon
cp "${ICON}" ~/.icons/

sed "s*@@EXEC@@*$INSTALL/$APP*g" ./linux/google-messages-electron.desktop \
  >"$HOME/.local/share/applications/google-messages-electron.desktop"

set +e
[[ -d $HOME/.local/bin ]] && \
  ln -sfv "$INSTALL/$APP" "$HOME/.local/bin/"
