# Remove redundant settings icons from HTML files
Write-Host "Removing redundant settings icons from HTML files..."

$htmlFolder = ".\public\html"
$htmlFiles = Get-ChildItem -Path $htmlFolder -Include "*.html"

$totalFiles = 0
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove the settings icon block (multi-line with SVG)
    $pattern = '(?s)<a href="settings\.html" class="settings-top">.*?</a>\s*'
    $content = $content -replace $pattern, ''
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Removed settings icon from: $($file.Name)"
        $totalFiles++
    }
}

Write-Host "Removed redundant settings icons from $totalFiles files"
