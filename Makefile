.PHONY: help dev backend frontend install clean

help:
	@echo "Available commands:"
	@echo "  make dev       - Run backend and frontend together (debug mode)"
	@echo "  make backend   - Run only the backend server"
	@echo "  make frontend  - Run only the frontend dev server"
	@echo "  make install   - Install all dependencies"
	@echo "  make clean     - Clean up temporary files"

# Run both backend and frontend together with visible logs
dev:
	@echo "Starting backend and frontend..."
	@echo "Backend will run on http://localhost:4567"
	@echo "Frontend will run on http://localhost:3000"
	@echo "Press Ctrl+C to stop both servers"
	@echo "=========================================="
	@trap 'kill 0' SIGINT SIGTERM EXIT; \
	ruby web.rb 2>&1 | sed 's/^/[BACKEND]  /' & \
	cd client && npm start 2>&1 | sed 's/^/[FRONTEND] /' & \
	wait

# Run backend only
backend:
	@echo "Starting backend server on http://localhost:4567"
	ruby web.rb

# Run frontend only
frontend:
	@echo "Starting frontend dev server on http://localhost:3000"
	cd client && npm start

# Install dependencies
install:
	@echo "Installing Ruby dependencies..."
	bundle install
	@echo "Installing frontend dependencies..."
	cd client && npm install
	@echo "Dependencies installed successfully!"

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	rm -rf client/node_modules/.cache
	rm -rf client/build
	@echo "Clean complete!"
