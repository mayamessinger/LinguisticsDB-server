# LinguisticsDB-server
Instructions for running on the VM:
file that runs node constantly: /etc/systemd/system/lingserv.service
file that runs ngrok at url constantly: /etc/systemd/system/ngrokserver.service

To reboot service:
sudo systemctl stop lingserv; sudo systemctl daemon-reload; sudo systemctl enable lingserv.service; sudo systemctl start lingserv

To run server at reachable IP address:
sudo systemctl stop ngrokserver
sudo systemctl daemon-reload
sudo systemctl enable ngrokserver.service
sudo systemctl start ngrokserver