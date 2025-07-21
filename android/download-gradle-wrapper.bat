@echo off
echo Downloading gradle-wrapper.jar from official source...
powershell -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.0.1-bin.zip' -OutFile 'gradle-8.0.1-bin.zip'"
echo Extracting gradle-wrapper.jar...
powershell -Command "Expand-Archive -Path 'gradle-8.0.1-bin.zip' -DestinationPath 'temp-gradle' -Force"
copy "temp-gradle\gradle-8.0.1\lib\gradle-wrapper.jar" "gradle\wrapper\gradle-wrapper.jar"
echo Cleaning up...
rmdir /s /q temp-gradle
del gradle-8.0.1-bin.zip
echo Download complete!
pause 