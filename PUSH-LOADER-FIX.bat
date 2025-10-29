@echo off
chcp 65001 >nul
echo Adding changes...
git add -A
echo Committing...
git commit -m "Fix loader screen: brighter gradient background with animated effects"
echo Pushing to GitHub...
git push
echo Done!
pause

