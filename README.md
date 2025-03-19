# TDS MDM

This is an MDM application that allows IOS devices to comunicate with the server

This has a custom front end writen in React, with the backend written in PHP

## Info 
 this project uses the react front end, along with a PHP backend to handle the communication. The actual device  data is handled by micro MDM, this just uses its api to communicate with the api. 




 ## installation

There are config parameters that need to be set in the api/funcs/includes.php file. 
There is also Mongo DB config settings in teh DB file 
```php  
$GLOBALS["InstallPath"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api";
$GLOBALS["appDir"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/apps";
$GLOBALS["AppiconsDir"] = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/files/icons";
$GLOBALS["hostName"] = "device.server.thomasdye.net";
$GLOBALS["apikey"] = "";
$GLOBALS["BackEndHost"] = "http://127.0.0.1:6322";
```
These tell the api where to store the apps and icons, the hostname of the server, the api key, and the backend host.


### PHP code to remove, 
There may be some code to remove that is not in this repo, that is not part of this scope. 

Code for grafana loki logging in index.php 
```php
include_once "/Server/app/support/Grafana_Loki.php";
$GLOBALS["Grafana_Loki_Log_name"] = "TDS-MDM-Web";
register_shutdown_function("Grafana_Loki_Log_ShutDown");
```
Code to do with auth, I am not providing this code, as it is not part of this project, all functions are expecting user auth as a json to be the first parameter.

remove this code, but make sure to create a array for the user here instead. 
```php
    // Include the JWT authentication script
    include_once "/Server/app/auth/VAuthJWT.php";
    
    // Fetch user info from JWT
    $userinfo = getuserinfofromjwt();
    
    // Append the user info to the matched parameters
```
replace code with the follow 
```php
$userinfo = array("GeneratedUID" => "UserUUDID");
```

Core_incomingevents.php has some basic code for logging.

```php
 include_once "/Server/app/support/Grafana_Loki.php";
    //log to /Library/Server/Web/Data/Sites/Homeserver/home-serviceslist/api/logs
    $log = "/Library/Server/Web/Data/Sites/server.thomasdye/TDSMDM/api/logs/incomingevent.log";
    $date = date('Y-m-d H:i:s');
    $data = json_encode($postData);
    Grafana_Loki_Log("MDM","RAWRES",$data );
    // file_put_contents($log, $date . " " . $data . "\n", FILE_APPEND);
    // check if the event is a device enrolled

```



### Micro MDM
For the backend to work, you need to have a working instance of Micro MDM running on the server. This is what the backend uses to communicate with the devices.[https://github.com/micromdm/micromdm](https://github.com/micromdm/micromdm)
There is info on there about getting push certs and stuff like that. 



## Apache Config

This is the apache config that I use to get this to work. 
with access to mircomdm on port 6322, etc.

```apache
<VirtualHost *:443>
    ServerName device.server.thomasdye.net:443
    ServerAlias device.server2.thomasdye.net
    DirectoryIndex index.html
    SSLEngine on
    SSLCertificateFile ""
    SSLCertificateKeyFile ""
    SSLCertificateChainFile ""
    SSLProtocol all -SSLv2 -SSLv3
    DocumentRoot "ROOTDIR"
    # Directories
    <Directory "ROOTDIR">
        Options Indexes FollowSymLinks
        Require all granted
        AllowOverride All
    </Directory>

    # Aliases
    Alias /web  "ROOTDIR/build"
    Alias /TDSapi  "ROOTDIR/api"

    # Exclude /TDSapi from Proxy
    ProxyPass /TDSapi !

    # Proxy all other requests
    ProxyPass /scep http://127.0.0.1:6322/scep
    ProxyPassReverse /scep http://127.0.0.1:6322/scep
    
      ProxyPass /mdm http://127.0.0.1:6322/mdm
    ProxyPassReverse /mdm http://127.0.0.1:6322/mdm
    



</VirtualHost>
```



## About 

This code is written by Thomas Dye, I am more then happy for you to use, modify, and distribute this code. I would appreciate it if you would give me credit for my work.

I will also take feedback on the code, and will try to help you with any issues you have, this is not production ready, but could be made to be with some work.



```