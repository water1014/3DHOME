FROM python:3.12-slim

RUN pip install --no-cache-dir git+https://github.com/tsuru0805/engawa-mcp.git

ENV ENGAWA_HOST=0.0.0.0
ENV ENGAWA_PORT=8799

CMD ["engawa-mcp", "--http"]
