# PowerShell script to update file paths in HTML files after reorganization

$htmlDir = ".\html"
$files = Get-ChildItem -Path $htmlDir -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Update CSS references
    $content = $content -replace 'href="([^/][^"]*\.css)"', 'href="../css/$1"'
    $content = $content -replace 'href="styles\.css"', 'href="../css/styles.css"'
    
    # Update JS references (for relative paths, not absolute /config paths)
    $content = $content -replace 'src="([^/][^"]*\.js)"', 'src="../js/$1"'
    
    # Update HTML references (links to other pages)
    $content = $content -replace 'href="([^/][^"]*\.html)"', 'href="$1"'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Updated: $($file.Name)"
}

Write-Host "All HTML files updated successfully!"
