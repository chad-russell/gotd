FROM rust:1.72 as builder
WORKDIR /usr/src/gotd
COPY . .
RUN cargo install --path .
CMD ["gotd", "--db-host=postgres"]
