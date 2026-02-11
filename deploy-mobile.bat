#!/bin/bash
cd nexus-phase2/dashboard
git add -A
git commit -m "Mobile optimization: responsive CSS, touch-friendly interactions, modal improvements"
git push origin main
echo "Deployment complete!"
