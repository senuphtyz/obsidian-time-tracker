# ================================================================================
FROM mcr.microsoft.com/vscode/devcontainers/rust:bullseye AS rustBuild

RUN curl -L "https://github.com/tavianator/bfs/releases/download/4.0.5/bfs-4.0.5.tar.gz" -o /tmp/bfs.tgz
RUN mkdir -p /tmp/bfs/ 

WORKDIR /tmp/bfs
RUN tar xvf /tmp/bfs.tgz
RUN ./configure --enable-release
RUN make


# ================================================================================
FROM mcr.microsoft.com/devcontainers/base:bullseye AS build

RUN curl -L "https://github.com/devcontainers-contrib/nanolayer/releases/download/v0.5.6/nanolayer-x86_64-unknown-linux-gnu.tgz" -o /tmp/nanolayer.tgz
RUN tar -C /tmp -xvf /tmp/nanolayer.tgz

# ================================================================================
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

COPY --from=build --chown=root:root /tmp/nanolayer /nanolayer
COPY --from=rustBuild --chown=root:root /tmp/bfs/bin/bfs /usr/local/bin/bfs
COPY --chown=1000:1000 zshrc /home/node/.zshrc

RUN /nanolayer install apt-get vim
RUN /nanolayer install gh-release 'sharkdp/bat' 'bat'
RUN /nanolayer install gh-release 'junegunn/fzf' 'fzf'
RUN /nanolayer install gh-release 'ajeetdsouza/zoxide' 'zoxide'
RUN /nanolayer install gh-release --asset-regex '\.tar\.gz$' 'eza-community/eza' 'eza'
RUN /nanolayer install gh-release 'astral-sh/uv' 'uv'
RUN /nanolayer install gh-release 'Wilfred/difftastic' 'difft'
# RUN /nanolayer install gh-release --asset-regex '^deno\-' 'denoland/deno' 'deno'

