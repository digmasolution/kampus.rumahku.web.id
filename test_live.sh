#!/bin/bash
curl -s -X POST http://127.0.0.1:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kampus.rumahku.web.id","password":"11jTKLM0sa"}'
echo ""

curl -s -X POST http://127.0.0.1:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dosen1@uncm.ac.id","password":"password123"}'
echo ""

curl -s http://127.0.0.1:3005/api/bug-reports
echo ""
