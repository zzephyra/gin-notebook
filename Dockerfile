FROM golang:1.24.3
ENV GOPROXY https://goproxy.cn,direct
RUN go install github.com/air-verse/air@latest
COPY . /gnote-server
WORKDIR /gnote-server
RUN go mod download
RUN make build
EXPOSE 8899
ENTRYPOINT [ "make", "dev" ]