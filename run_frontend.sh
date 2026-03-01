#!/bin/bash
cd frontend
npm run build && npx serve@latest out -l 3008
