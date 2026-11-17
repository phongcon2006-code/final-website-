

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetDirectory = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets/shop-references'
[System.IO.Directory]::CreateDirectory($assetDirectory) | Out-Null
$references = @(
    @('ga-dai-cat', 'ga-dai-cat-37x52', 'ga-dai-cat-37cm-x-52cm'),
    @('dan-lon-am-duong', 'dan-lon-am-duong-52x37', 'dan-lon-am-duong-52cm-x-37cm'),
    @('chan-trau-thoi-sao', 'chan-trau-thoi-sao-37x52', 'chan-trau-thoi-sao-37cm-x-52cm'),
    @('vinh-hoa', 'vinh-hoa-em-be-om-ga-37x52', 'vinh-hoa-em-be-om-ga-37cm-x-52cm'),
    @('phu-quy', 'phu-quy-em-be-om-vit-37x52', 'phu-quy-em-be-om-vit-37cm-x-52cm'),
    @('dam-cuoi-chuot', 'dam-cuoi-chuot-52x37', 'dam-cuoi-chuot-52cm-x-37cm')
)
$jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$manifest = foreach ($reference in $references) {
    $source = 'https://bizweb.dktcdn.net/100/438/304/products/tranh-giay-dong-ho-' + $reference[1] + '.jpg'
    $response = Invoke-WebRequest -UseBasicParsing -Uri $source
    $stream = [System.IO.MemoryStream]::new([byte[]]$response.Content)
    $original = [System.Drawing.Image]::FromStream($stream)
    $sizes = @{}
    foreach ($variant in @(@('full',1200,92),@('thumb',360,85))) {
        $scale = [Math]::Min([double]1, [double]$variant[1] / [Math]::Max($original.Width,$original.Height))
        $width = [Math]::Max(1,[int][Math]::Round($original.Width * $scale))
        $height = [Math]::Max(1,[int][Math]::Round($original.Height * $scale))
        $bitmap = [System.Drawing.Bitmap]::new($width,$height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($original,0,0,$width,$height)
        $fileName = $reference[0] + '-' + $variant[0] + '.jpg'
        $filePath = Join-Path $assetDirectory $fileName
        $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
        $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]$variant[2])
        $bitmap.Save($filePath,$jpegEncoder,$parameters)
        $sizes[$variant[0]] = @{file=$fileName;width=$width;height=$height;bytes=(Get-Item -LiteralPath $filePath).Length}
        $graphics.Dispose(); $bitmap.Dispose(); $parameters.Dispose()
    }
    $original.Dispose(); $stream.Dispose()
    @{id=$reference[0];source=$source;product=('https://tranhdangiandongho.com/tranh-giay-dong-ho-' + $reference[2]);permission='User confirmed permission to reuse shop photographs, 2026-11-08. Not CC0.';images=$sizes}
}
$json = ConvertTo-Json -Depth 5 -InputObject @($manifest)
[System.IO.File]::WriteAllText((Join-Path $assetDirectory 'sources.json'),$json,[System.Text.UTF8Encoding]::new($false))
$manifest | ForEach-Object { Write-Output ($_.id + ': thumbnail ' + $_.images.thumb.bytes + ' bytes; full ' + $_.images.full.bytes + ' bytes') }
