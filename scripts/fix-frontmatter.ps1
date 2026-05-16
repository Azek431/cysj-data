param()
Import-Module -Name PowerShellGet -ErrorAction SilentlyContinue
# 扫描 docs 目录修复 frontmatter 的 date/updated 字段
Get-ChildItem -Path .\docs -Recurse -Filter *.md | ForEach-Object {
     = Get-Content .FullName -Raw
    if ( -match '^(?<fm>---\s*?
.*??
---)') {
         = ['fm']
         = (Get-Date).ToString('yyyy-MM-dd')
         =  -replace 'date:\s*.*', "date: " -replace 'updated:\s*.*', "updated: "
         =  -replace [regex]::Escape(), 
        Set-Content .FullName  -Force
    }
}

