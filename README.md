# LinguisticsDB-server
Instructions for running on the VM:
location of service file that allows constant running (won't stop when shell exits: /etc/systemd/system/lingserv.service

To reboot service:
sudo systemctl stop lingserv
sudo systemctl daemon-reload
sudo systemctl enable lingserv.service
sudo systemctl stop lingserv

To run server at reachable IP address:
screen -d -m ngrok http 3001 -subdomain=linguisticdb
