.PHONY: install dev build run test clean

install:
	cd backend && pip install -r requirements.txt

dev:
	cd backend && python run.py --reload

run:
	cd backend && python run.py --host 0.0.0.0 --port 8000

build:
	docker build -t chatpilot .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

test:
	cd backend && python -m pytest tests/ -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf data/*.db
