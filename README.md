# Eden Kenya

A Node.js WhatsApp bot starter designed for Termux.

## Requirements

- Node.js 20+
- Git
- A WhatsApp account for testing

## Setup in Termux

```sh
pkg update -y
pkg install -y nodejs git
git clone https://github.com/ndungueliud/eden-kenya.git
cd eden-kenya
cp .env.example .env
nano .env
npm install
npm start
