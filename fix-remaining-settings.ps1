# Final comprehensive script to remove settings icons from remaining HTML files
Write-Host "Removing remaining redundant settings icons..."

# Define files that still need the settings icon removed
$filesToFix = @(
    ".\public\html\announcements.html",
    ".\public\html\create-form.html", 
    ".\public\html\dashboard.html",
    ".\public\html\edit-form.html",
    ".\public\html\edit-events.html",
    ".\public\html\events.html",
    ".\public\html\form-results.html",
    ".\public\html\groups.html",
    ".\public\html\profile.html",
    ".\public\html\settings.html"
)

$totalFiles = 0
foreach ($filePath in $filesToFix) {
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Look for the settings icon pattern and remove it
        $beforeCount = ($content -split "`n").Count
        
        # Remove the settings icon block using a more flexible approach
        $content = $content -replace '(?s)\s*<a href="settings\.html" class="settings-top"[^>]*>.*?</a>\s*', "`n        "
        
        $afterCount = ($content -split "`n").Count
        
        if ($beforeCount -ne $afterCount) {
            Set-Content -Path $filePath -Value $content -NoNewline
            Write-Host "Fixed: $(Split-Path $filePath -Leaf)"
            $totalFiles++
        }
    }
}

Write-Host "Successfully removed settings icons from $totalFiles files"
Write-Host "Settings icon is now centralized in the sidebar component!"
