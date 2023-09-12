db-migrate:
    sqlx migrate run --database-url "postgresql://doadmin:AVNS_qgKtUh7sZdZG2fbpl6q@db-postgresql-nyc1-47255-do-user-14375111-0.b.db.ondigitalocean.com:25060/gotd?sslmode=require"

db-revert:
    sqlx migrate revert --database-url "postgresql://doadmin:AVNS_qgKtUh7sZdZG2fbpl6q@db-postgresql-nyc1-47255-do-user-14375111-0.b.db.ondigitalocean.com:25060/gotd?sslmode=require"

db-downup: db-revert db-migrate

google-login:
    curl -X POST -H "Content-Type: application/json" -d @'google_token.json' localhost:3001/login | pbcopy

gotd-login:
    curl -H "Authorization: Bearer $(cat gotd_token.json)" localhost:3001/check_auth_simpler

gotd-login-fail:
    curl -H "Authorization: Bearer $(cat gotd_token_invalid.json)" localhost:3001/check_auth_simpler
