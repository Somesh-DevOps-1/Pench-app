# Nginx Setup

This config proxies the two Expo web apps running from Docker Compose:

- `somesh-portfolio.online` -> customer app on `127.0.0.1:8081`
- `www.somesh-portfolio.online` -> customer app on `127.0.0.1:8081`
- `44.204.146.166` -> customer app on `127.0.0.1:8081`
- `delivery.somesh-portfolio.online` -> delivery app on `127.0.0.1:8084`

On the EC2 server, install and enable it:

```bash
sudo cp ops/nginx/penchmilk.conf /etc/nginx/sites-available/penchmilk
sudo ln -s /etc/nginx/sites-available/penchmilk /etc/nginx/sites-enabled/penchmilk
sudo nginx -t
sudo systemctl reload nginx
```

Point these DNS records to `44.204.146.166`:

```text
@         A    44.204.146.166
www       A    44.204.146.166
delivery  A    44.204.146.166
```

After DNS is active, add HTTPS:

```bash
sudo certbot --nginx -d somesh-portfolio.online -d www.somesh-portfolio.online -d delivery.somesh-portfolio.online
```

