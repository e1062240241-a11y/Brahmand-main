$folder = 'C:\Users\prarh\Desktop\Brahmand-main\frontend\assets\audio\Hanuman chalisa Audio'
$file = 'Hanuman chalisa.mp3'
$shell = New-Object -ComObject Shell.Application
$ns = $shell.NameSpace($folder)
$item = $ns.ParseName($file)
# Index 27 is usually duration in Windows 10/11
$duration = $ns.GetDetailsOf($item, 27)
Write-Output "Duration at index 27: $duration"
# Let's print all properties to see if duration is at another index
for ($i=0; $i -lt 300; $i++) {
    $val = $ns.GetDetailsOf($item, $i)
    if ($val -ne "") {
        Write-Output "$i : $($ns.GetDetailsOf($null, $i)) = $val"
    }
}
