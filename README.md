# LinguisticsDB-server

> app.js is the back-end server that handles all client requests, queries database, and returns results to client
> 

VM files (copied into repo) that let server run perpetually:
file that runs server: /etc/systemd/system/lingserv.service
file that port forwards server at localhost to accessible url: /etc/systemd/system/ngrokserver.service

# Build Setup
``` bash 
# To reboot service:
sudo systemctl stop lingserv; sudo systemctl daemon-reload; sudo systemctl enable lingserv.service; sudo systemctl start lingserv

# To run server at reachable IP address:
sudo systemctl stop ngrokserver; sudo systemctl daemon-reload; sudo systemctl enable ngrokserver.service; sudo systemctl start ngrokserver
```