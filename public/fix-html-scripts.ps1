# PowerShell script to fix script paths in HTML files

$htmlDir = ".\html"
$files = Get-ChildItem -Path $htmlDir -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix script references with the double-slash issue
    $content = $content -replace 'src="\.\./js/\./config/', 'src="/config/'
    $content = $content -replace 'src="\.\./js/\./components/', 'src="/components/'
    $content = $content -replace 'src="\.\./js/\./services/', 'src="/services/'
    $content = $content -replace 'src="\.\./js/\./utils/', 'src="/utils/'
    $content = $content -replace 'src="\.\./js/\./', 'src="../js/'
    
    # Fix any remaining JS file references to point to the js folder
    $content = $content -replace 'src="\.\./js/([^/][^"]*\.js)"', 'src="../js/$1"'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Updated: $($file.Name)"
}

Write-Host "All HTML script paths updated successfully!"
