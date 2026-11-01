#!/bin/bash

# 炁体围棋 - 启动开发服务器

NODE_BIN="/Users/sunfei/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node"
VITE_BIN="./node_modules/.pnpm/vite@5.4.21/node_modules/vite/bin/vite.js"

cd "/Users/sunfei/Documents/思考中/炁体围棋"

echo "启动炁体围棋开发服务器..."
$NODE_BIN $VITE_BIN --host 127.0.0.1 --port 3000
