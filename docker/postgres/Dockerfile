ARG PG_CONTAINER_VERSION=16
FROM docker.io/library/postgres:${PG_CONTAINER_VERSION}-bookworm as builder

ARG DEBIAN_FRONTEND=noninteractive

# 以 postgres:16-bookworm 为例
RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
    # Debian 12 默认文件，直接把域名替换为国内镜像（清华示例）
    sed -i -E 's|deb\.debian\.org|mirrors.tuna.tsinghua.edu.cn|g; s|security\.debian\.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources; \
    else \
    # 兜底：生成传统 sources.list
    printf '%s\n' \
    'deb https://mirrors.tuna.tsinghua.edu.cn/debian bookworm main contrib non-free non-free-firmware' \
    'deb https://mirrors.tuna.tsinghua.edu.cn/debian bookworm-updates main contrib non-free non-free-firmware' \
    'deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware' \
    > /etc/apt/sources.list; \
    fi; \
    apt-get update

RUN set -ex \
    # && apt-get update \
    && apt-get install -y ca-certificates build-essential git postgresql-server-dev-${PG_MAJOR} pkg-config binutils automake libtool \
    && apt-get clean

RUN set -ex \
    && git clone --branch 1.2.3 --single-branch --depth 1 https://github.com/hightman/scws.git \
    && cd scws \
    && touch README;aclocal;autoconf;autoheader;libtoolize;automake --add-missing \
    && ./configure \
    && make install

RUN set -ex \
    && git clone --branch master --single-branch --depth 1 https://github.com/amutu/zhparser.git \
    && cd zhparser \
    && make install

RUN set -ex \
    && git clone --single-branch --depth 1 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make -j"$(nproc)" \
    && make install

FROM docker.io/library/postgres:${PG_CONTAINER_VERSION}-bookworm
RUN localedef -i zh_CN -c -f UTF-8 -A /usr/share/locale/locale.alias zh_CN.UTF-8
ENV LANG zh_CN.UTF-8

COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/zhparser.so /usr/lib/postgresql/${PG_MAJOR}/lib/
COPY --from=builder /usr/local/lib/libscws.* /usr/local/lib/
COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension/zhparser* /usr/share/postgresql/${PG_MAJOR}/extension/
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/bitcode/zhparser* /usr/lib/postgresql/${PG_MAJOR}/lib/bitcode/
COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/tsearch_data/*.utf8.* /usr/share/postgresql/${PG_MAJOR}/tsearch_data/
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/vector.so /usr/lib/postgresql/${PG_MAJOR}/lib/
COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension/vector* /usr/share/postgresql/${PG_MAJOR}/extension/

COPY init/00_extensions.sql /docker-entrypoint-initdb.d/
