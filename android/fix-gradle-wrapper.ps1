# Download Gradle distribution
Write-Host "Downloading Gradle 8.0.1..."
Invoke-WebRequest -Uri "https://services.gradle.org/distributions/gradle-8.0.1-bin.zip" -OutFile "gradle-8.0.1-bin.zip"

# Extract the zip file
Write-Host "Extracting Gradle..."
Expand-Archive -Path "gradle-8.0.1-bin.zip" -DestinationPath "temp-gradle" -Force

# Copy the gradle-wrapper.jar
Write-Host "Copying gradle-wrapper.jar..."
Copy-Item "temp-gradle\gradle-8.0.1\lib\gradle-wrapper.jar" "gradle\wrapper\gradle-wrapper.jar" -Force

# Clean up
Write-Host "Cleaning up..."
Remove-Item "temp-gradle" -Recurse -Force
Remove-Item "gradle-8.0.1-bin.zip" -Force

Write-Host "Gradle wrapper setup complete!" 