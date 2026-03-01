#!/bin/bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn src.api:app --reload --port 8000
