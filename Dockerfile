FROM python:3.11-slim
WORKDIR /app
# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
# 复制后端代码
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
# 复制前端静态文件
COPY frontend/static/ /app/static/
COPY frontend/templates/ /app/templates/
COPY frontend/widget-embed.js /app/static/widget-embed.js
# 暴露端口
EXPOSE 8000
# 启动
CMD ["python", "run.py", "--host", "0.0.0.0", "--port", "8000"]
