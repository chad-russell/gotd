FROM rust:1.72 as builder
WORKDIR /usr/src/gotd
COPY Cargo.toml .
RUN mkdir src && echo "fn main() {}" > ./src/main.rs
RUN cargo build --release
COPY ./src ./src
RUN touch ./src/main.rs
RUN cargo build --release
CMD ["./target/release/gotd", "--db-host=host.docker.internal"]
