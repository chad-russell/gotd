db-up:
    sqlx migrate run --database-url "postgresql://admin:pgpass@homelab:5432/gotd"

db-down:
    sqlx migrate revert --database-url "postgresql://admin:pgpass@homelab:5432/gotd"

db-downup: db-down db-up
