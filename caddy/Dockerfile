FROM caddy:2.7.4

COPY Caddyfile /etc/caddy/Caddyfile
COPY ./caddy_index.html /srv/index.html

ENV TS_AUTHKEY="tskey-auth-kUxmhB3CNTRL-ug9ivUHeNYQoScgqXswXXQ8D3pGdndVVC"
ENV TS_HOSTNAME="reverse_proxy"
RUN curl -fsSL https://tailscale.com/install.sh | sh

EXPOSE 80 443
