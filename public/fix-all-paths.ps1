# PowerShell script to fix remaining CSS and JS paths in HTML files

$htmlDir = ".\html"
$files = Get-ChildItem -Path $htmlDir -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix CSS references that are pointing to root instead of /css/
    $content = $content -replace 'href="/styles\.css"', 'href="/css/styles.css"'
    $content = $content -replace 'href="/([^/]+\.css)"', 'href="/css/$1"'
    
    # Fix JS references for page-specific files that should be in /js/
    $content = $content -replace 'src="/([^/]+\.js)"', 'src="/js/$1"'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Updated: $($file.Name)"
}

# Also check the root HTML files
$rootFiles = Get-ChildItem -Path "." -Filter "*.html"
foreach ($file in $rootFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix CSS references 
    $content = $content -replace 'href="styles\.css"', 'href="css/styles.css"'
    $content = $content -replace 'href="([^/]+\.css)"', 'href="css/$1"'
    
    # Fix JS references for page-specific files
    $content = $content -replace 'src="([^/]+\.js)"', 'src="js/$1"'
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $content -NoNewline
    
    Write-Host "Updated root file: $($file.Name)"
}

Write-Host "All HTML CSS and JS paths updated successfully!"
